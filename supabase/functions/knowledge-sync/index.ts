import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingKnowledge {
  id: string;
  extracted_fact: string;
  fact_category: string;
  confidence: number;
  source_message: string;
}

// Generate embeddings using Lovable AI
async function generateEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
      }),
    });

    if (!response.ok) {
      console.error("Embedding API error:", response.status);
      return null;
    }

    const data = await response.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

// Check for duplicate or similar knowledge
async function findSimilarKnowledge(
  supabase: any,
  embedding: number[],
  threshold: number = 0.85
): Promise<{ id: string; title: string; similarity: number } | null> {
  try {
    const { data, error } = await supabase.rpc("search_global_knowledge", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: 1,
    });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error searching similar knowledge:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This is a scheduled function - validate it's called by cron or service role
  const authHeader = req.headers.get("Authorization");
  
  console.log("Knowledge sync batch job started at", new Date().toISOString());

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create sync log entry
    const { data: syncLog, error: logError } = await supabase
      .from("knowledge_sync_log")
      .insert({ status: "running" })
      .select()
      .single();

    if (logError) {
      console.error("Error creating sync log:", logError);
    }

    const syncLogId = syncLog?.id;

    // Get all pending knowledge items
    const { data: pendingItems, error: fetchError } = await supabase
      .from("pending_knowledge")
      .select("*")
      .eq("processing_status", "pending")
      .order("created_at", { ascending: true })
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log("No pending knowledge to process");
      
      if (syncLogId) {
        await supabase
          .from("knowledge_sync_log")
          .update({ 
            status: "completed", 
            completed_at: new Date().toISOString(),
            items_processed: 0 
          })
          .eq("id", syncLogId);
      }

      return new Response(
        JSON.stringify({ message: "No pending items", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${pendingItems.length} pending knowledge items`);

    let approved = 0;
    let rejected = 0;
    let merged = 0;

    for (const item of pendingItems as PendingKnowledge[]) {
      try {
        // Mark as processing
        await supabase
          .from("pending_knowledge")
          .update({ processing_status: "processing" })
          .eq("id", item.id);

        // Generate embedding for the fact
        const embedding = await generateEmbedding(item.extracted_fact, LOVABLE_API_KEY);

        if (!embedding) {
          console.error(`Failed to generate embedding for item ${item.id}`);
          await supabase
            .from("pending_knowledge")
            .update({ processing_status: "rejected", processed_at: new Date().toISOString() })
            .eq("id", item.id);
          rejected++;
          continue;
        }

        // Check for duplicates
        const similar = await findSimilarKnowledge(supabase, embedding, 0.85);

        if (similar) {
          // Merge with existing knowledge - increment validation count
          console.log(`Merging item ${item.id} with existing knowledge ${similar.id} (similarity: ${similar.similarity})`);
          
          // First get current validation count
          const { data: existingKnowledge } = await supabase
            .from("knowledge_base")
            .select("validation_count")
            .eq("id", similar.id)
            .single();

          await supabase
            .from("knowledge_base")
            .update({ 
              validation_count: (existingKnowledge?.validation_count || 0) + 1,
              last_used_at: new Date().toISOString()
            })
            .eq("id", similar.id);

          await supabase
            .from("pending_knowledge")
            .update({ processing_status: "merged", processed_at: new Date().toISOString() })
            .eq("id", item.id);

          merged++;
        } else {
          // Approve and add to global knowledge base
          const title = item.extracted_fact.substring(0, 100);
          
          const { error: insertError } = await supabase.from("knowledge_base").insert({
            title: title,
            content: item.extracted_fact,
            category: item.fact_category,
            source: "user_learned",
            is_global: true,
            knowledge_type: "learned",
            validation_status: "validated",
            validation_count: 1,
            embedding: embedding,
            learned_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error(`Error inserting knowledge for item ${item.id}:`, insertError);
            await supabase
              .from("pending_knowledge")
              .update({ processing_status: "rejected", processed_at: new Date().toISOString() })
              .eq("id", item.id);
            rejected++;
          } else {
            await supabase
              .from("pending_knowledge")
              .update({ processing_status: "approved", processed_at: new Date().toISOString() })
              .eq("id", item.id);
            approved++;
          }
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (itemError) {
        console.error(`Error processing item ${item.id}:`, itemError);
        await supabase
          .from("pending_knowledge")
          .update({ processing_status: "rejected", processed_at: new Date().toISOString() })
          .eq("id", item.id);
        rejected++;
      }
    }

    // Update sync log
    if (syncLogId) {
      await supabase
        .from("knowledge_sync_log")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          items_processed: pendingItems.length,
          items_approved: approved,
          items_rejected: rejected,
          items_merged: merged,
        })
        .eq("id", syncLogId);
    }

    console.log(`Knowledge sync complete: ${approved} approved, ${rejected} rejected, ${merged} merged`);

    return new Response(
      JSON.stringify({
        message: "Knowledge sync complete",
        processed: pendingItems.length,
        approved,
        rejected,
        merged,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Knowledge sync error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Sync failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
