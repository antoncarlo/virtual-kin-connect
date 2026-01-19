import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface KnowledgeExtractionRequest {
  messages: Array<{ role: string; content: string }>;
  avatarId: string;
}

interface ExtractedFact {
  fact: string;
  category: string;
  isPersonal: boolean;
  confidence: number;
}

interface ExtractionResult {
  publicFacts: ExtractedFact[];
  privateFacts: ExtractedFact[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { auth, error: authError } = await validateAuth(req);
  if (authError) {
    return authError;
  }

  const userId = auth!.userId;

  try {
    const { messages, avatarId } = (await req.json()) as KnowledgeExtractionRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Format conversation for analysis
    const conversationText = messages
      .filter((m) => m.role === "user")
      .slice(-10)
      .map((m) => m.content)
      .join("\n");

    if (conversationText.length < 50) {
      return new Response(
        JSON.stringify({ success: true, message: "Not enough content to extract", extracted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to extract knowledge
    const extractionPrompt = `Analizza questi messaggi utente e identifica NUOVE CONOSCENZE che potrebbero essere utili da ricordare.

MESSAGGI UTENTE:
${conversationText}

REGOLE DI ESTRAZIONE:
1. CONOSCENZA PUBBLICA (da condividere globalmente):
   - Fatti oggettivi, verità universali, citazioni sagge
   - Tecniche di benessere o mindfulness condivise dall'utente
   - Riflessioni filosofiche profonde
   - NON includere opinioni personali o preferenze soggettive

2. CONOSCENZA PRIVATA (solo per questo utente):
   - Informazioni personali: nome, lavoro, famiglia, amici
   - Preferenze individuali, traumi, segreti
   - Eventi specifici della vita dell'utente
   - Relazioni interpersonali

3. IGNORA:
   - Saluti e convenevoli
   - Domande senza contenuto informativo
   - Affermazioni troppo vaghe

Rispondi SOLO in JSON valido:
{
  "publicFacts": [
    {"fact": "descrizione del fatto", "category": "wisdom|philosophy|technique|insight", "isPersonal": false, "confidence": 0.0-1.0}
  ],
  "privateFacts": [
    {"fact": "descrizione del fatto personale", "category": "personal|relationship|preference|event", "isPersonal": true, "confidence": 0.0-1.0}
  ]
}

Se non trovi nulla di rilevante: {"publicFacts": [], "privateFacts": []}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Sei un estrattore di conoscenza. Rispondi SOLO in JSON valido senza markdown.",
          },
          { role: "user", content: extractionPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI extraction error:", response.status, errorText);
      
      // Graceful handling for quota exhaustion (402) and service unavailable (503)
      if (response.status === 402 || response.status === 503) {
        console.log(`AI Gateway unavailable (${response.status}), skipping extraction`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            status: "skipped", 
            reason: response.status === 402 ? "quota_exhausted" : "service_unavailable",
            extracted: 0 
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI extraction failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "{}";
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("No valid JSON in response");
      return new Response(
        JSON.stringify({ success: true, message: "No extractable knowledge", extracted: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extracted: ExtractionResult = JSON.parse(jsonMatch[0]);
    let savedCount = 0;

    // Save public facts to pending_knowledge for batch validation
    for (const fact of extracted.publicFacts || []) {
      if (fact.confidence >= 0.7) {
        const { error } = await supabase.from("pending_knowledge").insert({
          user_id: userId,
          avatar_id: avatarId,
          extracted_fact: fact.fact,
          source_message: conversationText.substring(0, 500),
          fact_category: fact.category,
          confidence: fact.confidence,
          is_personal: false,
        });
        if (!error) savedCount++;
      }
    }

    // Save private facts directly to user_context (with cross-avatar flag for sensitive data)
    for (const fact of extracted.privateFacts || []) {
      if (fact.confidence >= 0.6) {
        const key = fact.category + "_" + fact.fact.substring(0, 30).toLowerCase().replace(/\s+/g, "_");
        const { error } = await supabase.from("user_context").upsert({
          user_id: userId,
          avatar_id: avatarId,
          context_type: fact.category,
          key: key.substring(0, 100),
          value: fact.fact.substring(0, 500),
          confidence: fact.confidence,
          is_cross_avatar: true, // Private memory accessible by all avatars for this user
          privacy_level: "cross_avatar",
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,avatar_id,context_type,key" });
        if (!error) savedCount++;
      }
    }

    console.log(`Knowledge extraction complete: ${savedCount} items saved for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        extracted: savedCount,
        publicPending: (extracted.publicFacts || []).filter(f => f.confidence >= 0.7).length,
        privateSaved: (extracted.privateFacts || []).filter(f => f.confidence >= 0.6).length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Knowledge extraction error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Extraction failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
