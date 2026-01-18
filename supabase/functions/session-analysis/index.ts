import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SessionAnalysisRequest {
  messages: Message[];
  avatarId: string;
  sessionDuration?: number; // in seconds
}

interface EmotionalAnalysis {
  predominant_mood: string;
  mood_intensity: number; // 0-10
  emotional_trajectory: "improving" | "stable" | "declining";
  detected_emotions: string[];
}

interface EntityExtraction {
  people: Array<{ name: string; relationship?: string }>;
  events: Array<{ description: string; date?: string; importance: "low" | "medium" | "high" }>;
  places: string[];
  topics: string[];
}

interface DialoguePreferences {
  prefers_philosophical: boolean;
  prefers_practical: boolean;
  response_depth: "brief" | "moderate" | "deep";
  emotional_support_needed: boolean;
}

interface SessionSynthesis {
  new_learnings: string[];
  key_insight: string;
  suggested_followup: string;
  context_for_next_session: string;
}

interface FullAnalysis {
  emotional: EmotionalAnalysis;
  entities: EntityExtraction;
  preferences: DialoguePreferences;
  synthesis: SessionSynthesis;
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
    const { messages, avatarId, sessionDuration } = (await req.json()) as SessionAnalysisRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Only analyze if there are enough messages
    if (messages.length < 4) {
      return new Response(
        JSON.stringify({ success: true, message: "Session too short for analysis" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting session analysis for user ${userId}, avatar ${avatarId}`);

    // Format conversation for analysis
    const conversationText = messages
      .map((m) => `${m.role === "user" ? "UTENTE" : "MARCO"}: ${m.content}`)
      .join("\n\n");

    // Perform comprehensive AI analysis using tool calling for structured output
    const analysisPrompt = `Analizza questa conversazione tra un utente e Marco (AI companion). Estrai informazioni strutturate.

CONVERSAZIONE:
${conversationText}

Analizza secondo questi 4 criteri:

1. ANALISI EMOTIVA: Qual è lo stato d'animo prevalente? (ansia, gioia, solitudine, stress, tristezza, rabbia, calma, confusione, speranza)
   - Intensità dell'emozione (0-10)
   - Traiettoria emotiva durante la conversazione
   - Emozioni secondarie rilevate

2. ESTRAZIONE ENTITÀ: L'utente ha menzionato:
   - Persone (nome, relazione)
   - Eventi importanti (descrizione, data se menzionata, importanza)
   - Luoghi significativi
   - Argomenti ricorrenti

3. PREFERENZE DI DIALOGO:
   - Ha apprezzato riflessioni filosofiche o approccio pratico?
   - Preferisce risposte brevi, moderate o approfondite?
   - Ha bisogno di supporto emotivo?

4. SINTESI EVOLUTIVA:
   - Cosa ho imparato di nuovo su questa persona?
   - Qual è l'insight chiave di questa sessione?
   - Cosa dovrei chiedere nella prossima sessione?
   - Contesto da ricordare per la prossima volta`;

    // Retry logic with exponential backoff for transient errors (503, 429, etc.)
    const makeRequest = async (attempt = 1): Promise<Response> => {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Sei un analista esperto di conversazioni terapeutiche. Estrai insights strutturati in italiano." },
            { role: "user", content: analysisPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "save_session_analysis",
                description: "Salva l'analisi strutturata della sessione",
                parameters: {
                  type: "object",
                  properties: {
                    emotional: {
                      type: "object",
                      properties: {
                        predominant_mood: { type: "string", description: "Emozione principale (ansia, gioia, solitudine, stress, tristezza, rabbia, calma, confusione, speranza)" },
                        mood_intensity: { type: "number", description: "Intensità 0-10" },
                        emotional_trajectory: { type: "string", enum: ["improving", "stable", "declining"] },
                        detected_emotions: { type: "array", items: { type: "string" } },
                      },
                      required: ["predominant_mood", "mood_intensity", "emotional_trajectory", "detected_emotions"],
                    },
                    entities: {
                      type: "object",
                      properties: {
                        people: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              relationship: { type: "string" },
                            },
                            required: ["name"],
                          },
                        },
                        events: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              description: { type: "string" },
                              date: { type: "string" },
                              importance: { type: "string", enum: ["low", "medium", "high"] },
                            },
                            required: ["description", "importance"],
                          },
                        },
                        places: { type: "array", items: { type: "string" } },
                        topics: { type: "array", items: { type: "string" } },
                      },
                      required: ["people", "events", "places", "topics"],
                    },
                    preferences: {
                      type: "object",
                      properties: {
                        prefers_philosophical: { type: "boolean" },
                        prefers_practical: { type: "boolean" },
                        response_depth: { type: "string", enum: ["brief", "moderate", "deep"] },
                        emotional_support_needed: { type: "boolean" },
                      },
                      required: ["prefers_philosophical", "prefers_practical", "response_depth", "emotional_support_needed"],
                    },
                    synthesis: {
                      type: "object",
                      properties: {
                        new_learnings: { type: "array", items: { type: "string" } },
                        key_insight: { type: "string" },
                        suggested_followup: { type: "string" },
                        context_for_next_session: { type: "string" },
                      },
                      required: ["new_learnings", "key_insight", "suggested_followup", "context_for_next_session"],
                    },
                  },
                  required: ["emotional", "entities", "preferences", "synthesis"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "save_session_analysis" } },
        }),
      });

      // Retry on 503 (service unavailable) or 429 (rate limit) with exponential backoff
      if ((response.status === 503 || response.status === 429) && attempt < 3) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s
        console.log(`AI gateway returned ${response.status}, retrying in ${delay}ms (attempt ${attempt}/3)`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return makeRequest(attempt + 1);
      }

      return response;
    };

    const response = await makeRequest();

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI analysis error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || !toolCall.function?.arguments) {
      console.error("No tool call in response");
      throw new Error("AI did not return structured analysis");
    }

    const analysis: FullAnalysis = JSON.parse(toolCall.function.arguments);
    console.log("Analysis extracted:", JSON.stringify(analysis, null, 2));

    // Save all extracted data to database using async functions
    const saveEmotionalState = async () => {
      const { error } = await supabase.from("user_context").upsert({
        user_id: userId,
        avatar_id: avatarId,
        context_type: "emotional_state",
        key: "current_mood",
        value: JSON.stringify({
          mood: analysis.emotional.predominant_mood,
          intensity: analysis.emotional.mood_intensity,
          trajectory: analysis.emotional.emotional_trajectory,
          emotions: analysis.emotional.detected_emotions,
          updated: new Date().toISOString(),
        }),
        confidence: Math.min(analysis.emotional.mood_intensity / 10, 1),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,avatar_id,context_type,key" });
      if (error) throw error;
    };

    const savePeople = async () => {
      for (const person of analysis.entities.people) {
        const { error } = await supabase.from("user_context").upsert({
          user_id: userId,
          avatar_id: avatarId,
          context_type: "memory_anchor",
          key: `person_${person.name.toLowerCase().replace(/\s+/g, "_")}`,
          value: JSON.stringify({ name: person.name, relationship: person.relationship }),
          confidence: 0.9,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,avatar_id,context_type,key" });
        if (error) console.error("Error saving person:", error);
      }
    };

    const saveEvents = async () => {
      for (const event of analysis.entities.events) {
        const eventKey = event.description.substring(0, 30).toLowerCase().replace(/\s+/g, "_");
        const { error } = await supabase.from("user_context").upsert({
          user_id: userId,
          avatar_id: avatarId,
          context_type: "memory_anchor",
          key: `event_${eventKey}`,
          value: JSON.stringify({ description: event.description, date: event.date, importance: event.importance }),
          confidence: event.importance === "high" ? 1 : event.importance === "medium" ? 0.7 : 0.5,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,avatar_id,context_type,key" });
        if (error) console.error("Error saving event:", error);
      }
    };

    const savePreferences = async () => {
      const { error } = await supabase.from("user_context").upsert({
        user_id: userId,
        avatar_id: avatarId,
        context_type: "preference",
        key: "dialogue_style",
        value: JSON.stringify({
          philosophical: analysis.preferences.prefers_philosophical,
          practical: analysis.preferences.prefers_practical,
          depth: analysis.preferences.response_depth,
          emotional_support: analysis.preferences.emotional_support_needed,
        }),
        confidence: 0.85,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,avatar_id,context_type,key" });
      if (error) throw error;
    };

    const saveSessionSummary = async () => {
      const { error } = await supabase.from("session_summaries").insert({
        user_id: userId,
        avatar_id: avatarId,
        summary: analysis.synthesis.key_insight,
        insights: {
          new_learnings: analysis.synthesis.new_learnings,
          suggested_followup: analysis.synthesis.suggested_followup,
          context_for_next: analysis.synthesis.context_for_next_session,
        },
        emotions_detected: analysis.emotional.detected_emotions,
        topics_discussed: analysis.entities.topics,
        session_date: new Date().toISOString(),
      });
      if (error) throw error;
    };

    const saveSessionInsight = async () => {
      const { error } = await supabase.from("session_insights").insert({
        user_id: userId,
        avatar_id: avatarId,
        mood: analysis.emotional.predominant_mood,
        topic: analysis.entities.topics[0] || "conversazione generale",
        summary: analysis.synthesis.key_insight,
        key_points: analysis.synthesis.new_learnings,
        duration_seconds: sessionDuration || null,
      });
      if (error) throw error;
    };

    // Execute all saves in parallel
    const results = await Promise.allSettled([
      saveEmotionalState(),
      savePeople(),
      saveEvents(),
      savePreferences(),
      saveSessionSummary(),
      saveSessionInsight(),
    ]);

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error("Some saves failed:", failures);
    }

    console.log(`Session analysis complete. Saved ${results.length - failures.length}/${results.length} items.`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          mood: analysis.emotional.predominant_mood,
          intensity: analysis.emotional.mood_intensity,
          topics: analysis.entities.topics,
          key_insight: analysis.synthesis.key_insight,
          entities_found: {
            people: analysis.entities.people.length,
            events: analysis.entities.events.length,
          },
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Session analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Analysis failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
