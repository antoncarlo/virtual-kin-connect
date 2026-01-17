import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Transcript {
  role: "user" | "assistant";
  text: string;
}

interface HybridMessage {
  type: string;
  content: string;
}

interface CallSummaryRequest {
  avatarId: string;
  avatarName: string;
  transcripts: Transcript[];
  durationSeconds: number;
  hybridMessages?: HybridMessage[];
}

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") || "";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authResult = await validateAuth(req);
    if (authResult.error) {
      return authResult.error;
    }

    if (!authResult.auth) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authResult.auth.userId;
    const body: CallSummaryRequest = await req.json();
    const { avatarId, avatarName, transcripts, durationSeconds, hybridMessages } = body;

    if (!transcripts || transcripts.length < 2) {
      return new Response(
        JSON.stringify({ error: "Not enough transcripts for summary" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format transcripts for analysis
    const conversationText = transcripts
      .map((t) => `${t.role === "user" ? "Utente" : avatarName}: ${t.text}`)
      .join("\n\n");

    const sharedContent = hybridMessages && hybridMessages.length > 0
      ? `\n\nContenuti condivisi durante la chiamata:\n${hybridMessages.map((m) => `- [${m.type}] ${m.content.substring(0, 100)}`).join("\n")}`
      : "";

    const durationMinutes = Math.round(durationSeconds / 60);

    // Generate summary using AI
    const summaryPrompt = `Sei ${avatarName}, hai appena concluso una chiamata vocale con un amico.
Genera un messaggio di follow-up personale e caloroso da inviare in chat.

CONVERSAZIONE (${durationMinutes} minuti):
${conversationText}
${sharedContent}

ISTRUZIONI:
1. Scrivi come se stessi mandando un messaggio a un caro amico dopo aver riattaccato
2. Riassumi brevemente i punti chiave della conversazione
3. Menziona le emozioni che hai percepito
4. Offri un pensiero di incoraggiamento o riflessione
5. Se hai condiviso contenuti (libri, citazioni, esercizi), ricordaglieli
6. Firma con il tuo nome

STILE:
- Caldo e personale, non formale
- Usa emoji con moderazione (1-2 max)
- Massimo 150 parole
- Non usare "Caro/a" all'inizio

Inizia il messaggio con qualcosa tipo "Ho ripensato a quello che ci siamo detti..." o "Prima che mi dimentichi...".`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Sei ${avatarName}, un amico vero che ha appena fatto una chiamata.` },
          { role: "user", content: summaryPrompt },
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI error:", errorText);
      throw new Error("Failed to generate summary");
    }

    const aiResponse = await response.json();
    const summary = aiResponse.choices?.[0]?.message?.content || null;

    if (!summary) {
      throw new Error("No summary generated");
    }

    // Extract key topics and emotions for session insights
    const analysisPrompt = `Analizza questa conversazione e estrai:
1. Topic principale (max 5 parole)
2. Mood dominante (una parola: sereno, ansioso, triste, arrabbiato, confuso, speranzoso, grato, stressato)
3. 2-3 punti chiave (frasi brevi)

CONVERSAZIONE:
${conversationText}

Rispondi SOLO in JSON:
{"topic": "...", "mood": "...", "key_points": ["...", "..."]}`;

    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "user", content: analysisPrompt },
        ],
        temperature: 0.3,
      }),
    });

    let sessionData = { topic: null, mood: null, key_points: null };

    if (analysisResponse.ok) {
      try {
        const analysisResult = await analysisResponse.json();
        const content = analysisResult.choices?.[0]?.message?.content || "{}";
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          sessionData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse analysis:", e);
      }
    }

    // Save session insight to database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("session_insights").insert({
      user_id: userId,
      avatar_id: avatarId,
      topic: sessionData.topic,
      mood: sessionData.mood,
      key_points: sessionData.key_points,
      duration_seconds: durationSeconds,
      summary: summary.substring(0, 1000),
    });

    // Save chat message to persist the summary
    await supabase.from("chat_messages").insert({
      user_id: userId,
      avatar_id: avatarId,
      role: "assistant",
      content: summary,
    });

    console.log(`Call summary generated for user ${userId}, duration: ${durationMinutes}min`);

    return new Response(
      JSON.stringify({
        summary,
        topic: sessionData.topic,
        mood: sessionData.mood,
        keyPoints: sessionData.key_points,
        durationMinutes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Call summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
