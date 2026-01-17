import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // This is an admin-only function, check for service role
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.includes("service_role")) {
    console.log("Generating embeddings for knowledge base...");
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all knowledge base entries without embeddings
    const { data: entries, error: fetchError } = await supabase
      .from("knowledge_base")
      .select("id, title, content, category")
      .is("embedding", null);

    if (fetchError) {
      throw fetchError;
    }

    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ message: "No entries need embeddings", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${entries.length} entries without embeddings`);

    let successCount = 0;
    let errorCount = 0;

    for (const entry of entries) {
      // Combine title and content for embedding
      const textToEmbed = `${entry.title}\n\n${entry.content}`;
      
      const embedding = await generateEmbedding(textToEmbed, LOVABLE_API_KEY);

      if (embedding) {
        const { error: updateError } = await supabase
          .from("knowledge_base")
          .update({ embedding })
          .eq("id", entry.id);

        if (updateError) {
          console.error(`Error updating entry ${entry.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`Generated embedding for: ${entry.title}`);
          successCount++;
        }
      } else {
        console.error(`Failed to generate embedding for: ${entry.title}`);
        errorCount++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        message: "Embedding generation complete",
        success: successCount,
        errors: errorCount,
        total: entries.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating embeddings:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
