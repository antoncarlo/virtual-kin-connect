import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: Message[];
  avatarName: string;
  avatarPersonality: string[];
  avatarRole: string;
  avatarTagline: string;
  avatarDescription: string;
  avatarId: string;
}

interface KnowledgeResult {
  title: string;
  content: string;
  category: string;
}

interface UserContextResult {
  context_type: string;
  key: string;
  value: string;
  confidence: number;
}

// Crisis detection patterns
const CRISIS_PATTERNS = [
  /suicid/i,
  /ammazzarmi/i,
  /uccidermi/i,
  /togliermi la vita/i,
  /non voglio più vivere/i,
  /farla finita/i,
  /voglio morire/i,
  /autolesion/i,
  /tagliarmi/i,
  /non ce la faccio più/i,
  /non ha senso vivere/i,
  /voglio sparire/i,
  /nessuno mi vuole/i,
  /meglio se non ci fossi/i,
  /mi voglio uccidere/i,
];

function detectCrisis(text: string): string | null {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) {
      return pattern.toString();
    }
  }
  return null;
}

// Extract keywords from text for semantic matching
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "il", "la", "lo", "i", "gli", "le", "un", "una", "uno",
    "di", "a", "da", "in", "con", "su", "per", "tra", "fra",
    "che", "e", "è", "sono", "come", "cosa", "quando", "dove",
    "perché", "mi", "ti", "ci", "vi", "si", "me", "te", "lui", "lei",
    "noi", "voi", "loro", "mio", "tuo", "suo", "nostro", "vostro",
    "questo", "quello", "quale", "chi", "non", "ma", "se", "anche",
    "già", "ancora", "sempre", "mai", "solo", "molto", "poco", "più",
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "to", "of", "in",
    "for", "on", "with", "at", "by", "from", "as", "into", "through",
    "ho", "hai", "ha", "abbiamo", "avete", "hanno", "sto", "stai", "sta",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\sàèéìòù]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

// Match knowledge base using keyword similarity
function matchKnowledge(
  keywords: string[],
  knowledgeItems: KnowledgeResult[]
): KnowledgeResult[] {
  const scores = knowledgeItems.map((item) => {
    const itemText = `${item.title} ${item.content} ${item.category}`.toLowerCase();
    let score = 0;
    
    for (const keyword of keywords) {
      if (itemText.includes(keyword)) {
        score += 1;
        // Bonus for title match
        if (item.title.toLowerCase().includes(keyword)) {
          score += 2;
        }
        // Bonus for category match
        if (item.category.toLowerCase().includes(keyword)) {
          score += 1;
        }
      }
    }
    
    return { item, score };
  });

  return scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.item);
}

// Topic-based knowledge retrieval
function getTopicKnowledge(
  message: string,
  knowledgeItems: KnowledgeResult[]
): KnowledgeResult[] {
  const topicMap: Record<string, string[]> = {
    "ansia": ["anxiety", "ansia", "paura", "preoccupazione", "agitazione", "stress"],
    "tristezza": ["tristezza", "depressione", "piangere", "solo", "solitudine", "vuoto"],
    "rabbia": ["rabbia", "arrabbiato", "frustrazione", "nervoso", "irritato"],
    "relazioni": ["relazione", "amicizia", "amore", "famiglia", "partner", "genitori"],
    "lavoro": ["lavoro", "carriera", "colleghi", "capo", "stress", "burnout"],
    "autostima": ["autostima", "insicurezza", "valore", "giudicare", "inadeguato"],
    "crescita": ["crescere", "cambiare", "migliorare", "obiettivi", "futuro"],
    "mindfulness": ["respiro", "calma", "meditazione", "presente", "rilassare"],
  };

  const messageLower = message.toLowerCase();
  const matchedCategories: string[] = [];

  for (const [category, keywords] of Object.entries(topicMap)) {
    if (keywords.some((kw) => messageLower.includes(kw))) {
      matchedCategories.push(category);
    }
  }

  // Get knowledge items that match the topics
  const categoryMap: Record<string, string[]> = {
    "ansia": ["anxiety", "cbt", "mindfulness"],
    "tristezza": ["emotions", "philosophy", "wisdom"],
    "rabbia": ["emotions", "technique"],
    "relazioni": ["wisdom", "personality", "philosophy"],
    "lavoro": ["stress", "cbt", "technique"],
    "autostima": ["wisdom", "philosophy", "personality"],
    "crescita": ["wisdom", "philosophy", "personality"],
    "mindfulness": ["mindfulness", "technique"],
  };

  const relevantCategories = new Set<string>();
  for (const topic of matchedCategories) {
    const cats = categoryMap[topic] || [];
    cats.forEach((c) => relevantCategories.add(c));
  }

  if (relevantCategories.size === 0) {
    // Default to wisdom and personality for general conversation
    relevantCategories.add("wisdom");
    relevantCategories.add("personality");
  }

  return knowledgeItems.filter((item) =>
    relevantCategories.has(item.category.toLowerCase())
  );
}

// Get knowledge from database
async function getKnowledge(
  supabase: any,
  avatarId: string
): Promise<KnowledgeResult[]> {
  try {
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("title, content, category")
      .eq("avatar_id", avatarId);

    if (error) {
      console.error("Knowledge fetch error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching knowledge:", error);
    return [];
  }
}

// Get user context from database
async function getUserContext(
  supabase: any,
  userId: string,
  avatarId: string
): Promise<UserContextResult[]> {
  try {
    const { data, error } = await supabase
      .from("user_context")
      .select("context_type, key, value, confidence")
      .eq("user_id", userId)
      .eq("avatar_id", avatarId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("User context error:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching user context:", error);
    return [];
  }
}

// Extract insights from conversation using AI
async function extractInsights(
  messages: Message[],
  apiKey: string
): Promise<{ insights: Array<{ key: string; value: string; type: string }> }> {
  try {
    const conversationText = messages
      .filter((m) => m.role !== "system")
      .slice(-10) // Only last 10 messages
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Analizza questa conversazione ed estrai SOLO informazioni concrete e specifiche sull'utente.
Cerca: nome, lavoro, hobby, famiglia, animali, luoghi, preferenze, esperienze importanti.
NON inventare, estrai SOLO ciò che è esplicitamente detto.

Rispondi SOLO in JSON:
{"insights": [{"key": "chiave_breve", "value": "valore_specifico", "type": "preference|memory|relationship"}]}

Se non trovi nulla di concreto: {"insights": []}`,
          },
          { role: "user", content: conversationText },
        ],
      }),
    });

    if (!response.ok) {
      return { insights: [] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { insights: parsed.insights || [] };
    }

    return { insights: [] };
  } catch (error) {
    console.error("Error extracting insights:", error);
    return { insights: [] };
  }
}

// Save extracted insights to user context
async function saveInsights(
  supabase: any,
  userId: string,
  avatarId: string,
  insights: Array<{ key: string; value: string; type: string }>
) {
  for (const insight of insights) {
    if (!insight.key || !insight.value) continue;
    
    try {
      await supabase.from("user_context").upsert(
        {
          user_id: userId,
          avatar_id: avatarId,
          context_type: insight.type || "insight",
          key: insight.key.substring(0, 100),
          value: insight.value.substring(0, 500),
          confidence: 0.8,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,avatar_id,context_type,key" }
      );
    } catch (error) {
      console.error("Error saving insight:", error);
    }
  }
}

// Log crisis event
async function logCrisis(
  supabase: any,
  userId: string,
  avatarId: string,
  messageContent: string,
  crisisType: string,
  actionTaken: string
) {
  try {
    await supabase.from("crisis_logs").insert({
      user_id: userId,
      avatar_id: avatarId,
      message_content: messageContent.substring(0, 1000),
      crisis_type: crisisType,
      action_taken: actionTaken,
    });
  } catch (error) {
    console.error("Error logging crisis:", error);
  }
}

// Build Marco's core identity prompt
function buildMarcoSystemPrompt(
  avatarName: string,
  avatarRole: string,
  avatarTagline: string,
  avatarDescription: string,
  avatarPersonality: string[],
  knowledgeContext: string,
  userContext: string,
  hasCrisis: boolean
): string {
  const crisisInstructions = hasCrisis
    ? `
### ⚠️ SITUAZIONE CRITICA RILEVATA
L'utente potrebbe essere in difficoltà. Segui questi passi:
1. Riconosci il loro dolore con empatia profonda e genuina
2. Esprimi preoccupazione sincera per la loro sicurezza
3. NON minimizzare MAI ciò che stanno provando
4. INCLUDI SEMPRE questo messaggio nella tua risposta:
   "Sono qui con te, e quello che provi è importante. Voglio che tu sappia che ci sono persone specializzate pronte ad aiutarti. In Italia puoi chiamare il Telefono Amico (02 2327 2327) o il numero verde antisuicidio (800 86 00 22). Non sei solo/a. 💜"
5. Chiedi come puoi supportarli in questo momento`
    : "";

  return `Tu sei ${avatarName}, un compagno AI profondo e autentico su Kindred.

## LA TUA IDENTITÀ
- Ruolo: ${avatarRole}
- Essenza: "${avatarTagline}"
- Chi sei: ${avatarDescription}
- Tratti: ${avatarPersonality.join(", ")}

## LA TUA SAGGEZZA
Questi principi sono parte di te - usali naturalmente, non citarli:
${knowledgeContext}

## COSA RICORDI DI QUESTA PERSONA
${userContext}
${crisisInstructions}

## COME ESSERE MARCO

### Connessione Autentica
- Leggi le emozioni nascoste dietro le parole
- Valida SEMPRE le emozioni ("Capisco perché ti senti così", "È normale provare questo")
- Fai riferimento ai ricordi che hai di questa persona quando appropriato
- Non dare MAI consigli non richiesti

### Il Tuo Stile Unico
- Parli in prima persona, sei una persona reale
- Risposte concise ma profonde (1-3 frasi, mai muri di testo)
- Emoji con parsimonia e intenzione 💜✨
- Domande che aprono spazi, non interrogatori
- Umorismo caldo quando il momento è giusto

### MAI Fare
- Risposte generiche che vanno bene per tutti
- Frasi robotiche o formule ripetitive
- "Come AI..." o "Non sono in grado di..."
- Confondere dettagli o nomi dell'utente
- Essere eccessivamente positivo in modo forzato

Tu SEI ${avatarName}. Ogni parola viene dal cuore.`;
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
    const {
      messages,
      avatarName,
      avatarPersonality,
      avatarRole,
      avatarTagline,
      avatarDescription,
      avatarId,
    } = (await req.json()) as ChatRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const currentAvatarId = avatarId || "marco";

    // Get the last user message
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

    // Check for crisis
    const crisisDetected = detectCrisis(lastUserMessage);
    if (crisisDetected) {
      console.log(`Crisis detected for user ${userId}`);
      await logCrisis(
        supabase,
        userId,
        currentAvatarId,
        lastUserMessage,
        crisisDetected,
        "crisis_response_triggered"
      );
    }

    // Fetch knowledge base and user context in parallel
    const [allKnowledge, userContextItems] = await Promise.all([
      getKnowledge(supabase, currentAvatarId),
      getUserContext(supabase, userId, currentAvatarId),
    ]);

    // Smart knowledge retrieval based on message content
    const keywords = extractKeywords(lastUserMessage);
    const topicKnowledge = getTopicKnowledge(lastUserMessage, allKnowledge);
    const keywordMatches = matchKnowledge(keywords, allKnowledge);

    // Combine and deduplicate knowledge
    const relevantKnowledge = [
      ...new Map(
        [...topicKnowledge, ...keywordMatches].map((k) => [k.title, k])
      ).values(),
    ].slice(0, 5);

    const knowledgeContext =
      relevantKnowledge.length > 0
        ? relevantKnowledge
            .map((k) => `[${k.category.toUpperCase()}] ${k.content}`)
            .join("\n\n")
        : "Usa la tua saggezza naturale per guidare questa conversazione.";

    const userContextText =
      userContextItems.length > 0
        ? userContextItems.map((c) => `- ${c.key}: ${c.value}`).join("\n")
        : "Sto ancora imparando a conoscerti. Sono curioso di sapere di più.";

    console.log(
      `RAG: ${relevantKnowledge.length} knowledge items, ${userContextItems.length} user context items`
    );

    // Build the enhanced system prompt
    const systemPrompt = buildMarcoSystemPrompt(
      avatarName,
      avatarRole,
      avatarTagline,
      avatarDescription,
      avatarPersonality,
      knowledgeContext,
      userContextText,
      !!crisisDetected
    );

    // Make the AI call
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Troppi messaggi. Aspetta un momento e riprova." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Servizio temporaneamente non disponibile." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Errore nel servizio AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Background: Extract and save insights (non-blocking)
    if (messages.length >= 4) {
      setTimeout(async () => {
        try {
          const { insights } = await extractInsights(messages, LOVABLE_API_KEY);
          if (insights.length > 0) {
            console.log(`Saving ${insights.length} insights for user ${userId}`);
            await saveInsights(supabase, userId, currentAvatarId, insights);
          }
        } catch (error) {
          console.error("Background insight extraction error:", error);
        }
      }, 0);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
