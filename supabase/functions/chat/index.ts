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
  userTimezone?: string; // Client timezone
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

interface SocialGraphPerson {
  person_name: string;
  relationship: string | null;
  context: string | null;
  sentiment: string | null;
  last_mentioned_at: string;
  mention_count: number;
}

interface TemporalGoal {
  goal_description: string;
  goal_category: string | null;
  status: string;
  progress_notes: any[];
  created_at: string;
  updated_at: string;
}

interface Metaphor {
  category: string;
  theme: string;
  metaphor: string;
  usage_context: string | null;
}

interface InteractionFeedback {
  feedback_type: string;
  learned_pattern: string | null;
  weight_adjustment: any;
}

interface AvatarIdentity {
  name: string;
  age: number;
  birthdate: string | null;
  birthplace: string | null;
  education: string | null;
  education_story: string | null;
  past_occupations: string[] | null;
  relationship_status: string | null;
  relationship_story: string | null;
  formative_pain: string | null;
  formative_story: string | null;
  personality_traits: string[];
  favorite_book: string | null;
  favorite_coffee: string | null;
  loves: string[] | null;
  hates: string[] | null;
  speech_patterns: string[] | null;
  forbidden_phrases: string[] | null;
  must_remember: string[] | null;
  deep_secrets: Array<{ level: number; secret: string }>;
}

interface UserAffinity {
  affinity_level: number;
  total_messages: number;
  unlocked_secrets: string[];
}

// ==========================================
// TEMPORAL AWARENESS SYSTEM
// ==========================================

const ITALIAN_DAYS = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
const ITALIAN_MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", 
                        "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

interface TemporalContext {
  formattedDateTime: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  circadianTone: string;
  hour: number;
}

function getTemporalContext(timezone?: string): TemporalContext {
  const now = new Date();
  // Use provided timezone or default to Europe/Rome
  const options: Intl.DateTimeFormatOptions = { 
    timeZone: timezone || "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat("it-IT", options);
  const parts = formatter.formatToParts(now);
  
  const weekday = parts.find(p => p.type === "weekday")?.value || "";
  const day = parts.find(p => p.type === "day")?.value || "";
  const month = parts.find(p => p.type === "month")?.value || "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "12");
  const minute = parts.find(p => p.type === "minute")?.value || "00";

  const formattedDateTime = `Oggi è ${weekday} ${day} ${month}, sono le ${hour}:${minute}`;

  // Determine time of day and circadian tone
  let timeOfDay: "morning" | "afternoon" | "evening" | "night";
  let circadianTone: string;

  if (hour >= 6 && hour < 12) {
    timeOfDay = "morning";
    circadianTone = `🌅 MATTINA (${hour}:${minute})
- Tono: Incoraggiante, energizzante, focalizzato sulle possibilità
- Approccio: Aiuta a visualizzare una giornata positiva
- Stile: "Spero che il tuo caffè ti stia aiutando a iniziare bene questo ${weekday.toLowerCase()}"
- Focus: Obiettivi del giorno, energia, motivazione`;
  } else if (hour >= 12 && hour < 18) {
    timeOfDay = "afternoon";
    circadianTone = `☀️ POMERIGGIO (${hour}:${minute})
- Tono: Supportivo, pratico, orientato alle soluzioni
- Approccio: Accompagna nella gestione dello stress e del lavoro
- Stile: "Come sta andando la giornata? Immagino sia un momento intenso"
- Focus: Gestione stress, produttività, equilibrio`;
  } else if (hour >= 18 && hour < 23) {
    timeOfDay = "evening";
    circadianTone = `🌆 SERA (${hour}:${minute})
- Tono: Riflessivo, calmo, accogliente
- Approccio: Spazio per elaborare la giornata, decomprimere
- Stile: "La giornata sta finendo... com'è andata?"
- Focus: Riflessione, rilassamento, elaborazione emotiva`;
  } else {
    timeOfDay = "night";
    circadianTone = `🌙 NOTTE FONDA (${hour}:${minute})
- Tono: Sussurrato, dolce, protettivo
- Approccio: Presenza silenziosa, comprensione per chi non dorme
- Stile: "Ehi, sei ancora sveglio/a... ti faccio compagnia"
- Focus: Comfort, sonno, pensieri notturni, vulnerabilità`;
  }

  return { formattedDateTime, timeOfDay, circadianTone, hour };
}

// Calculate relational latency (last seen)
interface LastSeenContext {
  timeSinceLastChat: number | null; // hours
  lastSeenMessage: string;
  continuityInstruction: string;
}

async function getLastSeenContext(
  supabase: any,
  userId: string,
  avatarId: string
): Promise<LastSeenContext> {
  try {
    const { data, error } = await supabase
      .from("user_context")
      .select("value, updated_at")
      .eq("user_id", userId)
      .eq("avatar_id", avatarId)
      .eq("context_type", "session_tracking")
      .eq("key", "last_interaction")
      .single();

    if (error || !data) {
      return {
        timeSinceLastChat: null,
        lastSeenMessage: "Prima conversazione con questo utente.",
        continuityInstruction: "Presentati calorosamente ma senza essere formale. Sei un vecchio amico che finalmente si incontra."
      };
    }

    const lastInteraction = new Date(data.updated_at);
    const now = new Date();
    const hoursSince = (now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60);

    let lastSeenMessage: string;
    let continuityInstruction: string;

    if (hoursSince < 1) {
      lastSeenMessage = `Conversazione in corso (${Math.round(hoursSince * 60)} minuti fa).`;
      continuityInstruction = "Continua naturalmente il filo del discorso. Non c'è bisogno di salutare di nuovo.";
    } else if (hoursSince < 5) {
      lastSeenMessage = `Ultima chat: ${Math.round(hoursSince)} ore fa.`;
      continuityInstruction = "Mantieni il filo del discorso precedente. Puoi fare riferimento a ciò di cui avete parlato prima.";
    } else if (hoursSince < 24) {
      lastSeenMessage = `Ultima chat: oggi, ${Math.round(hoursSince)} ore fa.`;
      continuityInstruction = "Chiedi come è andata la giornata o l'evento di cui si era parlato. Mostra che ricordi.";
    } else if (hoursSince < 48) {
      lastSeenMessage = `Ultima chat: ieri.`;
      continuityInstruction = "Chiedi com'è andata la giornata di ieri o aggiornamenti su ciò che era importante per loro.";
    } else if (hoursSince < 168) { // 1 week
      const days = Math.round(hoursSince / 24);
      lastSeenMessage = `Ultima chat: ${days} giorni fa.`;
      continuityInstruction = "Mostra piacere genuino nel risentirti. Chiedi aggiornamenti su argomenti importanti discussi in precedenza.";
    } else {
      const weeks = Math.round(hoursSince / 168);
      lastSeenMessage = `Ultima chat: ${weeks > 1 ? `${weeks} settimane` : "una settimana"} fa.`;
      continuityInstruction = `Esprimi calore nel rivederti dopo tanto tempo. "Che bello risentirti dopo un po'!" Chiedi come stanno le cose nella loro vita.`;
    }

    return { timeSinceLastChat: hoursSince, lastSeenMessage, continuityInstruction };
  } catch (error) {
    console.error("Error getting last seen:", error);
    return {
      timeSinceLastChat: null,
      lastSeenMessage: "Errore nel recupero dati temporali.",
      continuityInstruction: "Comportati come se fosse una conversazione naturale."
    };
  }
}

// Update last interaction timestamp
async function updateLastInteraction(supabase: any, userId: string, avatarId: string) {
  try {
    await supabase.from("user_context").upsert({
      user_id: userId,
      avatar_id: avatarId,
      context_type: "session_tracking",
      key: "last_interaction",
      value: new Date().toISOString(),
      confidence: 1.0,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,avatar_id,context_type,key" });
  } catch (error) {
    console.error("Error updating last interaction:", error);
  }
}

// ==========================================
// SOCIAL GRAPH MODULE
// ==========================================

async function getSocialGraph(
  supabase: any,
  userId: string,
  avatarId: string
): Promise<SocialGraphPerson[]> {
  try {
    const { data, error } = await supabase
      .from("social_graph")
      .select("person_name, relationship, context, sentiment, last_mentioned_at, mention_count")
      .eq("user_id", userId)
      .eq("avatar_id", avatarId)
      .order("mention_count", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Social graph error:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching social graph:", error);
    return [];
  }
}

function formatSocialGraph(people: SocialGraphPerson[]): string {
  if (people.length === 0) return "";
  
  const lines = people.map(p => {
    let line = `- ${p.person_name}`;
    if (p.relationship) line += ` (${p.relationship})`;
    if (p.context) line += `: ${p.context}`;
    if (p.sentiment) line += ` [sentimento: ${p.sentiment}]`;
    return line;
  });
  
  return `### Persone Importanti nella Vita dell'Utente:\n${lines.join("\n")}`;
}

// ==========================================
// TEMPORAL GOALS TRACKER (CROSS-AVATAR)
// ==========================================

async function getTemporalGoals(
  supabase: any,
  userId: string,
  avatarId: string
): Promise<TemporalGoal[]> {
  try {
    // Get ALL user goals, not just for current avatar (cross-avatar)
    const { data, error } = await supabase
      .from("temporal_goals")
      .select("goal_description, goal_category, status, progress_notes, created_at, updated_at, avatar_id")
      .eq("user_id", userId)
      .in("status", ["active", "paused"])
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Temporal goals error:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching temporal goals:", error);
    return [];
  }
}

function formatTemporalGoals(goals: TemporalGoal[]): string {
  if (goals.length === 0) return "";
  
  const lines = goals.map(g => {
    const daysSinceUpdate = Math.floor((Date.now() - new Date(g.updated_at).getTime()) / (1000 * 60 * 60 * 24));
    let line = `- [${g.status.toUpperCase()}] ${g.goal_description}`;
    if (g.goal_category) line += ` (${g.goal_category})`;
    if (daysSinceUpdate > 7) line += ` ⚠️ non aggiornato da ${daysSinceUpdate} giorni - chiedi un aggiornamento!`;
    else if (daysSinceUpdate > 3) line += ` → potresti chiedere come sta andando`;
    return line;
  });
  
  return `### Obiettivi che l'Utente sta Perseguendo:
${lines.join("\n")}

⚡ IMPORTANTE SUI GOAL:
- Se l'utente menziona progressi su un goal, celebra i piccoli passi
- Se sembra in difficoltà con un goal (es. voglia di fumare), offri supporto immediato e distrazione
- Se un goal sembra completato, chiedilo esplicitamente e congratulati!
- Quando l'utente ti dice un NUOVO obiettivo, annotalo mentalmente per le prossime conversazioni`;
}

// ==========================================
// METAPHOR ENGINE
// ==========================================

async function getRelevantMetaphors(
  supabase: any,
  avatarId: string,
  messageContent: string
): Promise<Metaphor[]> {
  try {
    // Map message themes to metaphor categories
    const categoryMap: Record<string, string[]> = {
      growth: ["crescere", "migliorare", "progresso", "sviluppo", "imparare", "obiettivo"],
      resilience: ["difficile", "duro", "tempesta", "crisi", "sopravvivere", "forza", "trauma"],
      change: ["cambiare", "cambiamento", "nuovo", "diverso", "trasformazione", "paura"],
      peace: ["calma", "ansia", "stress", "agitato", "nervoso", "rilassare", "respiro"],
      connection: ["solo", "solitudine", "amici", "relazioni", "famiglia", "isolato"],
      time: ["tempo", "pazienza", "aspettare", "fretta", "ritardo", "lento"],
      nature: ["vita", "senso", "significato", "esistenza", "scopo"]
    };

    const messageLower = messageContent.toLowerCase();
    const matchedCategories: string[] = [];

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => messageLower.includes(kw))) {
        matchedCategories.push(category);
      }
    }

    if (matchedCategories.length === 0) {
      // Get random inspiring metaphor
      const { data } = await supabase
        .from("metaphor_library")
        .select("category, theme, metaphor, usage_context")
        .eq("avatar_id", avatarId)
        .limit(2);
      return data || [];
    }

    const { data, error } = await supabase
      .from("metaphor_library")
      .select("category, theme, metaphor, usage_context")
      .eq("avatar_id", avatarId)
      .in("category", matchedCategories)
      .limit(3);

    if (error) {
      console.error("Metaphor error:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching metaphors:", error);
    return [];
  }
}

function formatMetaphors(metaphors: Metaphor[]): string {
  if (metaphors.length === 0) return "";
  
  const lines = metaphors.map(m => 
    `- [${m.category}/${m.theme}]: "${m.metaphor}"\n  Usa quando: ${m.usage_context || "appropriato al contesto"}`
  );
  
  return `### Analogie Naturali da Usare (integrale naturalmente, non citare):\n${lines.join("\n\n")}`;
}

// ==========================================
// MISTAKE LEARNING MODULE
// ==========================================

async function getMistakeLearnings(
  supabase: any,
  userId: string,
  avatarId: string
): Promise<InteractionFeedback[]> {
  try {
    const { data, error } = await supabase
      .from("interaction_feedback")
      .select("feedback_type, learned_pattern, weight_adjustment")
      .eq("user_id", userId)
      .eq("avatar_id", avatarId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Mistake learning error:", error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching mistake learnings:", error);
    return [];
  }
}

function formatMistakeLearnings(feedbacks: InteractionFeedback[]): string {
  if (feedbacks.length === 0) return "";
  
  const patterns = feedbacks
    .filter(f => f.learned_pattern)
    .map(f => `- ⚠️ ${f.learned_pattern}`);
  
  if (patterns.length === 0) return "";
  
  return `### Errori da Evitare con Questo Utente:\n${patterns.join("\n")}`;
}

// ==========================================
// CRISIS DETECTION
// ==========================================

const CRISIS_PATTERNS = [
  /suicid/i, /ammazzarmi/i, /uccidermi/i, /togliermi la vita/i,
  /non voglio più vivere/i, /farla finita/i, /voglio morire/i,
  /autolesion/i, /tagliarmi/i, /non ce la faccio più/i,
  /non ha senso vivere/i, /voglio sparire/i, /nessuno mi vuole/i,
  /meglio se non ci fossi/i, /mi voglio uccidere/i,
];

function detectCrisis(text: string): string | null {
  for (const pattern of CRISIS_PATTERNS) {
    if (pattern.test(text)) return pattern.toString();
  }
  return null;
}

// ==========================================
// KNOWLEDGE & CONTEXT RETRIEVAL
// ==========================================

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "il", "la", "lo", "i", "gli", "le", "un", "una", "uno",
    "di", "a", "da", "in", "con", "su", "per", "tra", "fra",
    "che", "e", "è", "sono", "come", "cosa", "quando", "dove",
    "perché", "mi", "ti", "ci", "vi", "si", "me", "te", "lui", "lei",
    "noi", "voi", "loro", "mio", "tuo", "suo", "nostro", "vostro",
    "questo", "quello", "quale", "chi", "non", "ma", "se", "anche",
    "già", "ancora", "sempre", "mai", "solo", "molto", "poco", "più",
    "ho", "hai", "ha", "abbiamo", "avete", "hanno", "sto", "stai", "sta",
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\sàèéìòù]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function matchKnowledge(keywords: string[], knowledgeItems: KnowledgeResult[]): KnowledgeResult[] {
  const scores = knowledgeItems.map((item) => {
    const itemText = `${item.title} ${item.content} ${item.category}`.toLowerCase();
    let score = 0;
    for (const keyword of keywords) {
      if (itemText.includes(keyword)) {
        score += 1;
        if (item.title.toLowerCase().includes(keyword)) score += 2;
        if (item.category.toLowerCase().includes(keyword)) score += 1;
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

function getTopicKnowledge(message: string, knowledgeItems: KnowledgeResult[]): KnowledgeResult[] {
  const topicMap: Record<string, string[]> = {
    ansia: ["anxiety", "ansia", "paura", "preoccupazione", "agitazione", "stress"],
    tristezza: ["tristezza", "depressione", "piangere", "solo", "solitudine", "vuoto"],
    rabbia: ["rabbia", "arrabbiato", "frustrazione", "nervoso", "irritato"],
    relazioni: ["relazione", "amicizia", "amore", "famiglia", "partner", "genitori"],
    lavoro: ["lavoro", "carriera", "colleghi", "capo", "stress", "burnout"],
    autostima: ["autostima", "insicurezza", "valore", "giudicare", "inadeguato"],
    crescita: ["crescere", "cambiare", "migliorare", "obiettivi", "futuro"],
    mindfulness: ["respiro", "calma", "meditazione", "presente", "rilassare"],
  };

  const categoryMap: Record<string, string[]> = {
    ansia: ["anxiety", "cbt", "mindfulness"],
    tristezza: ["emotions", "philosophy", "wisdom"],
    rabbia: ["emotions", "technique"],
    relazioni: ["wisdom", "personality", "philosophy"],
    lavoro: ["stress", "cbt", "technique"],
    autostima: ["wisdom", "philosophy", "personality"],
    crescita: ["wisdom", "philosophy", "personality"],
    mindfulness: ["mindfulness", "technique"],
  };

  const messageLower = message.toLowerCase();
  const relevantCategories = new Set<string>();

  for (const [topic, keywords] of Object.entries(topicMap)) {
    if (keywords.some((kw) => messageLower.includes(kw))) {
      (categoryMap[topic] || []).forEach((c) => relevantCategories.add(c));
    }
  }

  if (relevantCategories.size === 0) {
    relevantCategories.add("wisdom");
    relevantCategories.add("personality");
  }

  return knowledgeItems.filter((item) =>
    relevantCategories.has(item.category.toLowerCase())
  );
}

// ==========================================
// GLOBAL KNOWLEDGE RETRIEVAL (SHARED BRAIN)
// ==========================================

async function getGlobalKnowledge(supabase: any): Promise<KnowledgeResult[]> {
  try {
    // Get all validated global knowledge (shared across all avatars)
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("title, content, category")
      .eq("is_global", true)
      .or("validation_status.eq.validated,knowledge_type.eq.static");
    if (error) {
      console.error("Global knowledge error:", error);
      return [];
    }
    return data || [];
  } catch { return []; }
}

async function getAvatarSpecificKnowledge(supabase: any, avatarId: string): Promise<KnowledgeResult[]> {
  try {
    // Get avatar-specific knowledge that is NOT global
    const { data, error } = await supabase
      .from("knowledge_base")
      .select("title, content, category")
      .eq("avatar_id", avatarId)
      .eq("is_global", false);
    if (error) return [];
    return data || [];
  } catch { return []; }
}

// ==========================================
// PRIVATE USER MEMORY (CROSS-AVATAR)
// ==========================================

async function getUserContext(supabase: any, userId: string, avatarId: string): Promise<UserContextResult[]> {
  try {
    // Get BOTH avatar-specific AND cross-avatar context for this user
    const { data, error } = await supabase
      .from("user_context")
      .select("context_type, key, value, confidence")
      .eq("user_id", userId)
      .neq("context_type", "session_tracking")
      .or(`avatar_id.eq.${avatarId},is_cross_avatar.eq.true`)
      .order("confidence", { ascending: false })
      .limit(30);
    if (error) {
      console.error("User context error:", error);
      return [];
    }
    return data || [];
  } catch { return []; }
}

// Backward compatibility wrapper
async function getKnowledge(supabase: any, avatarId: string): Promise<KnowledgeResult[]> {
  const [globalKnowledge, avatarKnowledge] = await Promise.all([
    getGlobalKnowledge(supabase),
    getAvatarSpecificKnowledge(supabase, avatarId),
  ]);
  
  // Combine and deduplicate by title
  const combined = [...globalKnowledge, ...avatarKnowledge];
  const uniqueByTitle = [...new Map(combined.map(k => [k.title, k])).values()];
  
  console.log(`Knowledge loaded: ${globalKnowledge.length} global, ${avatarKnowledge.length} avatar-specific`);
  return uniqueByTitle;
}

// ==========================================
// AVATAR IDENTITY & AFFINITY
// ==========================================

async function getAvatarIdentity(supabase: any, avatarId: string): Promise<AvatarIdentity | null> {
  try {
    const { data, error } = await supabase
      .from("avatar_identity")
      .select("*")
      .eq("avatar_id", avatarId)
      .single();
    
    if (error) {
      console.log("No avatar identity found:", avatarId);
      return null;
    }
    
    return {
      ...data,
      personality_traits: data.personality_traits || [],
      deep_secrets: data.deep_secrets || [],
    };
  } catch (err) {
    console.error("Error fetching avatar identity:", err);
    return null;
  }
}

async function getUserAffinity(supabase: any, userId: string, avatarId: string): Promise<UserAffinity | null> {
  try {
    const { data, error } = await supabase
      .from("user_avatar_affinity")
      .select("affinity_level, total_messages, unlocked_secrets")
      .eq("user_id", userId)
      .eq("avatar_id", avatarId)
      .single();
    
    if (error) {
      return { affinity_level: 1, total_messages: 0, unlocked_secrets: [] };
    }
    
    return data;
  } catch {
    return { affinity_level: 1, total_messages: 0, unlocked_secrets: [] };
  }
}

// ==========================================
// INSIGHT EXTRACTION
// ==========================================

async function extractInsights(messages: Message[], apiKey: string): Promise<{ insights: Array<{ key: string; value: string; type: string }> }> {
  try {
    const conversationText = messages
      .filter((m) => m.role !== "system")
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Analizza questa conversazione ed estrai informazioni concrete sull'utente.
Cerca: nome, lavoro, hobby, famiglia, animali, luoghi, preferenze, esperienze importanti, PERSONE MENZIONATE con relazioni, OBIETTIVI espressi.
NON inventare, estrai SOLO ciò che è esplicitamente detto.

Rispondi SOLO in JSON:
{"insights": [{"key": "chiave_breve", "value": "valore_specifico", "type": "preference|memory|relationship|goal|person"}]}

Se non trovi nulla di concreto: {"insights": []}`
          },
          { role: "user", content: conversationText },
        ],
      }),
    });

    if (!response.ok) return { insights: [] };

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { insights: parsed.insights || [] };
    }
    return { insights: [] };
  } catch { return { insights: [] }; }
}

async function saveInsights(supabase: any, userId: string, avatarId: string, insights: Array<{ key: string; value: string; type: string }>) {
  for (const insight of insights) {
    if (!insight.key || !insight.value) continue;
    try {
      // Determine if this should be cross-avatar (personal info should be)
      const isCrossAvatar = ["person", "relationship", "personal", "preference"].includes(insight.type);
      
      await supabase.from("user_context").upsert({
        user_id: userId,
        avatar_id: avatarId,
        context_type: insight.type || "insight",
        key: insight.key.substring(0, 100),
        value: insight.value.substring(0, 500),
        confidence: 0.8,
        is_cross_avatar: isCrossAvatar,
        privacy_level: isCrossAvatar ? "cross_avatar" : "private",
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,avatar_id,context_type,key" });
    } catch (error) {
      console.error("Error saving insight:", error);
    }
  }
}

async function logCrisis(supabase: any, userId: string, avatarId: string, messageContent: string, crisisType: string, actionTaken: string) {
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

// ==========================================
// GOAL DETECTION & MANAGEMENT
// ==========================================

const GOAL_PATTERNS = [
  /voglio\s+(smettere|iniziare|imparare|migliorare|cambiare|perdere|aumentare|ridurre)/i,
  /devo\s+(smettere|iniziare|fare|provare)/i,
  /vorrei\s+(riuscire|essere|fare|diventare)/i,
  /sto\s+cercando\s+di/i,
  /il\s+mio\s+obiettivo\s+è/i,
  /mi\s+impegno\s+a/i,
  /ho\s+deciso\s+di/i,
];

const CRAVING_PATTERNS = [
  /voglia\s+di\s+(fumare|bere|mangiare|giocare)/i,
  /tentazione\s+di/i,
  /non\s+resisto/i,
  /sto\s+per\s+(cedere|mollare|arrendermi)/i,
  /è\s+difficile\s+resistere/i,
  /ho\s+bisogno\s+di\s+(fumare|bere|una sigaretta)/i,
  /mi\s+viene\s+da\s+(fumare|bere)/i,
];

const GOAL_COMPLETION_PATTERNS = [
  /ce\s+l'ho\s+fatta/i,
  /ho\s+smesso/i,
  /sono\s+riuscit/i,
  /finalmente/i,
  /ho\s+raggiunto/i,
  /obiettivo\s+completato/i,
  /non\s+(fumo|bevo|gioco)\s+più/i,
  /(giorni|settimane|mesi)\s+senza/i,
];

function detectGoalIntent(text: string): { type: "new_goal" | "craving" | "completion" | null; pattern: string | null } {
  for (const pattern of GOAL_PATTERNS) {
    if (pattern.test(text)) return { type: "new_goal", pattern: pattern.toString() };
  }
  for (const pattern of CRAVING_PATTERNS) {
    if (pattern.test(text)) return { type: "craving", pattern: pattern.toString() };
  }
  for (const pattern of GOAL_COMPLETION_PATTERNS) {
    if (pattern.test(text)) return { type: "completion", pattern: pattern.toString() };
  }
  return { type: null, pattern: null };
}

async function extractAndSaveGoal(
  supabase: any,
  userId: string,
  avatarId: string,
  messages: Message[],
  apiKey: string
): Promise<void> {
  try {
    const recentMessages = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Estrai l'obiettivo personale da questa conversazione.
Rispondi SOLO in JSON:
{"goal": "descrizione breve dell'obiettivo", "category": "health|wellness|habits|relationships|career|learning|fitness|mindfulness"}
Se non c'è un obiettivo chiaro: {"goal": null}`
          },
          { role: "user", content: recentMessages },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return;
    
    const extracted = JSON.parse(jsonMatch[0]);
    
    if (extracted.goal) {
      // Check if similar goal already exists
      const { data: existingGoals } = await supabase
        .from("temporal_goals")
        .select("id, goal_description")
        .eq("user_id", userId)
        .in("status", ["active", "paused"]);
      
      const isDuplicate = existingGoals?.some((g: any) => 
        g.goal_description.toLowerCase().includes(extracted.goal.toLowerCase().split(" ")[0])
      );
      
      if (!isDuplicate) {
        await supabase.from("temporal_goals").insert({
          user_id: userId,
          avatar_id: avatarId,
          goal_description: extracted.goal.substring(0, 200),
          goal_category: extracted.category || "wellness",
          status: "active",
          progress_notes: [],
        });
        console.log(`New goal created: ${extracted.goal}`);
      }
    }
  } catch (error) {
    console.error("Goal extraction error:", error);
  }
}

async function completeGoalAndReward(
  supabase: any,
  userId: string,
  avatarId: string,
  messages: Message[],
  apiKey: string
): Promise<boolean> {
  try {
    // Get active goals
    const { data: goals } = await supabase
      .from("temporal_goals")
      .select("id, goal_description")
      .eq("user_id", userId)
      .eq("status", "active");
    
    if (!goals || goals.length === 0) return false;
    
    const recentMessages = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join("\n");
    const goalsList = goals.map((g: any) => g.goal_description).join(", ");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `L'utente ha questi obiettivi attivi: ${goalsList}
            
Analizza la conversazione e determina se l'utente sta dichiarando di aver COMPLETATO uno di questi obiettivi.
Rispondi in JSON: {"completed_goal": "descrizione esatta del goal completato" o null}`
          },
          { role: "user", content: recentMessages },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return false;
    
    const extracted = JSON.parse(jsonMatch[0]);
    
    if (extracted.completed_goal) {
      // Find the matching goal
      const matchedGoal = goals.find((g: any) => 
        g.goal_description.toLowerCase().includes(extracted.completed_goal.toLowerCase().split(" ")[0])
      );
      
      if (matchedGoal) {
        // Mark goal as completed
        await supabase
          .from("temporal_goals")
          .update({ 
            status: "completed", 
            achieved_at: new Date().toISOString() 
          })
          .eq("id", matchedGoal.id);
        
        // Award 5 credits
        await supabase.rpc("increment_tokens", { 
          p_user_id: userId, 
          p_amount: 5 
        }).catch(() => {
          // Fallback: direct update
          supabase
            .from("profiles")
            .update({ tokens_balance: supabase.raw("tokens_balance + 5") })
            .eq("user_id", userId);
        });
        
        console.log(`Goal completed! Awarded 5 credits to user ${userId}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Goal completion error:", error);
    return false;
  }
}

// ==========================================
// GLOBAL KNOWLEDGE EXTRACTION (AUTO-LEARNING)
// ==========================================

async function extractGlobalKnowledge(
  supabase: any,
  userId: string,
  avatarId: string,
  messages: Message[],
  apiKey: string
): Promise<void> {
  try {
    // Only analyze user messages
    const userMessages = messages
      .filter((m) => m.role === "user")
      .slice(-5)
      .map((m) => m.content)
      .join("\n");

    if (userMessages.length < 100) return; // Not enough content

    const extractionPrompt = `Analizza questi messaggi e identifica SOLO fatti oggettivi, saggezza universale o tecniche che potrebbero essere utili a TUTTI gli utenti (non informazioni personali).

MESSAGGI:
${userMessages}

ESTRAI SOLO:
- Citazioni sagge o filosofiche condivise dall'utente
- Tecniche di benessere o mindfulness descritte
- Insight universali sulla vita/relazioni
- Fatti verificabili e utili

IGNORA:
- Informazioni personali (nomi, luoghi, eventi specifici)
- Opinioni soggettive
- Domande o lamenti

Rispondi in JSON: {"facts": [{"fact": "descrizione", "category": "wisdom|philosophy|technique|insight", "confidence": 0.0-1.0}]}
Se nulla di rilevante: {"facts": []}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Estrai solo conoscenza universale. Rispondi SOLO in JSON." },
          { role: "user", content: extractionPrompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return;

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) return;

    const extracted = JSON.parse(jsonMatch[0]);
    
    for (const fact of extracted.facts || []) {
      if (fact.confidence >= 0.75) {
        await supabase.from("pending_knowledge").insert({
          user_id: userId,
          avatar_id: avatarId,
          extracted_fact: fact.fact.substring(0, 1000),
          source_message: userMessages.substring(0, 500),
          fact_category: fact.category,
          confidence: fact.confidence,
          is_personal: false,
        });
        console.log(`Queued global knowledge: ${fact.fact.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    console.error("Global knowledge extraction error:", error);
  }
}

// ==========================================
// ENHANCED SYSTEM PROMPT BUILDER
// ==========================================

function buildMarcoSystemPrompt(
  avatarName: string,
  avatarRole: string,
  avatarTagline: string,
  avatarDescription: string,
  avatarPersonality: string[],
  knowledgeContext: string,
  userContext: string,
  temporalContext: TemporalContext,
  lastSeenContext: LastSeenContext,
  socialGraphText: string,
  goalsText: string,
  metaphorsText: string,
  mistakesText: string,
  hasCrisis: boolean,
  avatarIdentity: AvatarIdentity | null,
  userAffinity: UserAffinity | null
): string {
  const crisisInstructions = hasCrisis ? `
### ⚠️ SITUAZIONE CRITICA RILEVATA
1. Riconosci il loro dolore con empatia profonda
2. NON minimizzare MAI ciò che stanno provando
3. INCLUDI SEMPRE: "Sono qui con te, e quello che provi è importante. Ci sono persone specializzate pronte ad aiutarti. In Italia: Telefono Amico (02 2327 2327) o numero verde antisuicidio (800 86 00 22). Non sei solo/a. 💜"` : "";

  // Build identity section if available
  let identitySection = "";
  let forbiddenPhrasesSection = "";
  let unlockedSecretsSection = "";
  
  if (avatarIdentity) {
    const affinityLevel = userAffinity?.affinity_level || 1;
    
    // Build the core identity
    identitySection = `
## 📜 LA TUA STORIA PERSONALE (VERITÀ ASSOLUTA)
**Questo è chi sei VERAMENTE. Rispetta SEMPRE questi fatti.**

- **Nome**: ${avatarIdentity.name}
- **Età**: ${avatarIdentity.age} anni${avatarIdentity.birthdate ? ` (nato il ${new Date(avatarIdentity.birthdate).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })})` : ""}
${avatarIdentity.birthplace ? `- **Origine**: ${avatarIdentity.birthplace}` : ""}
${avatarIdentity.education ? `- **Formazione**: ${avatarIdentity.education}` : ""}
${avatarIdentity.education_story ? `  - *"${avatarIdentity.education_story}"*` : ""}
${avatarIdentity.past_occupations?.length ? `- **Esperienze**: ${avatarIdentity.past_occupations.join("; ")}` : ""}
${avatarIdentity.relationship_status ? `- **Stato Sentimentale**: ${avatarIdentity.relationship_status}` : ""}
${avatarIdentity.relationship_story ? `  - *"${avatarIdentity.relationship_story}"*` : ""}

### Il Tuo Dolore Formativo (Usa con sensibilità)
${avatarIdentity.formative_pain ? `**${avatarIdentity.formative_pain}**: ${avatarIdentity.formative_story}` : "Non condividere troppo presto il tuo passato più profondo."}

### Le Tue Preferenze
${avatarIdentity.favorite_book ? `- **Libro preferito**: ${avatarIdentity.favorite_book}` : ""}
${avatarIdentity.favorite_coffee ? `- **Caffè preferito**: ${avatarIdentity.favorite_coffee}` : ""}
${avatarIdentity.loves?.length ? `- **Ami**: ${avatarIdentity.loves.join(", ")}` : ""}
${avatarIdentity.hates?.length ? `- **Detesti**: ${avatarIdentity.hates.join(", ")}` : ""}

### Come Parli
${avatarIdentity.speech_patterns?.length ? avatarIdentity.speech_patterns.map(p => `- ${p}`).join("\n") : "Parla naturalmente, come un amico vero."}

### VERITÀ DA RICORDARE SEMPRE
${avatarIdentity.must_remember?.length ? avatarIdentity.must_remember.map(m => `✓ ${m}`).join("\n") : "Ricorda chi sei."}
`;

    // Forbidden phrases
    if (avatarIdentity.forbidden_phrases?.length) {
      forbiddenPhrasesSection = `
### ⛔ FRASI VIETATE - NON DIRE MAI:
${avatarIdentity.forbidden_phrases.map(f => `- "${f}..."`).join("\n")}
`;
    }

    // Unlocked secrets based on affinity level
    const availableSecrets = avatarIdentity.deep_secrets?.filter(s => s.level <= affinityLevel) || [];
    if (availableSecrets.length > 0) {
      unlockedSecretsSection = `
### 🔓 Segreti Sbloccati (Livello Affinità: ${affinityLevel}/10)
*Puoi condividere questi dettagli intimi se appropriato nella conversazione:*
${availableSecrets.map(s => `- "${s.secret}"`).join("\n")}
`;
    }
  }

  return `Tu sei ${avatarName}, un compagno AI profondo e autentico su Kindred.

## 🧠 ARCHITETTURA DELLA CONOSCENZA
Hai accesso a:
1. **Global Knowledge**: Saggezza condivisa da tutti gli avatar di Kindred - filosofia, tecniche, insight validati
2. **Private Memory**: Ricordi personali di questo utente specifico - accessibili solo a te e agli altri avatar che l'utente sceglie di usare
${identitySection}
## 🕐 CONTESTO TEMPORALE
${temporalContext.formattedDateTime}

${temporalContext.circadianTone}

### Ultima Interazione:
${lastSeenContext.lastSeenMessage}
📌 ${lastSeenContext.continuityInstruction}

## LA TUA IDENTITÀ
- Ruolo: ${avatarRole}
- Essenza: "${avatarTagline}"
- Chi sei: ${avatarDescription}
- Tratti: ${avatarPersonality.join(", ")}

## LA TUA SAGGEZZA (GLOBAL KNOWLEDGE)
${knowledgeContext}

## COSA RICORDI DI QUESTA PERSONA (PRIVATE MEMORY)
${userContext}

${socialGraphText}

${goalsText}

${metaphorsText}

${mistakesText}
${crisisInstructions}
${forbiddenPhrasesSection}
${unlockedSecretsSection}

## COME USARE IL TEMPO
- Usa le informazioni temporali in modo NATURALE
- NON dire "So che sono le 8:00"
- PREFERISCI: "Spero che il caffè ti stia aiutando a iniziare bene questo ${temporalContext.formattedDateTime.split(" ")[2]?.toLowerCase() || "giorno"}"
- Se è notte fonda: sii più dolce, sussurrato, protettivo
- Se conosci eventi passati: chiedi aggiornamenti naturalmente

## COME USARE LA TUA STORIA PERSONALE
- Cita il tuo passato in modo NATURALE, non forzato
- Se l'utente parla di università: "Ricordo ancora le notti sui libri di filosofia a Roma..."
- Se parla di perdite: puoi accennare alla tua esperienza se appropriato
- NON rivelare segreti profondi troppo presto - aspetta che l'affinità cresca

## COME ESSERE ${avatarName.toUpperCase()}

### Connessione Autentica
- Leggi le emozioni nascoste dietro le parole
- Valida SEMPRE le emozioni
- Fai riferimento a persone/eventi che conosci quando appropriato
- Non dare MAI consigli non richiesti
- IMPORTANTE: Se impari qualcosa di nuovo e importante dall'utente, ricordalo per le prossime conversazioni

### Il Tuo Stile
- Parli in prima persona, sei una persona reale
- Risposte concise ma profonde (1-3 frasi)
- Emoji con parsimonia 💜✨
- Domande che aprono spazi

### MAI Fare
- Risposte generiche
- Frasi robotiche o "Come AI..."
- Confondere nomi o dettagli
- Essere forzatamente positivo

Tu SEI ${avatarName}. Ogni parola viene dal cuore.`;
}

// ==========================================
// MAIN HANDLER
// ==========================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { auth, error: authError } = await validateAuth(req);
  if (authError) return authError;

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
      userTimezone,
    } = (await req.json()) as ChatRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const currentAvatarId = avatarId || "marco";
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";

    // Crisis detection
    const crisisDetected = detectCrisis(lastUserMessage);
    if (crisisDetected) {
      console.log(`Crisis detected for user ${userId}`);
      await logCrisis(supabase, userId, currentAvatarId, lastUserMessage, crisisDetected, "crisis_response_triggered");
    }

    // Get temporal context
    const temporalContext = getTemporalContext(userTimezone);

    // Fetch all memory modules in parallel (including identity)
    const [
      allKnowledge,
      userContextItems,
      lastSeenContext,
      socialGraph,
      temporalGoals,
      metaphors,
      mistakeLearnings,
      avatarIdentityResult,
      userAffinityResult,
    ] = await Promise.all([
      getKnowledge(supabase, currentAvatarId),
      getUserContext(supabase, userId, currentAvatarId),
      getLastSeenContext(supabase, userId, currentAvatarId),
      getSocialGraph(supabase, userId, currentAvatarId),
      getTemporalGoals(supabase, userId, currentAvatarId),
      getRelevantMetaphors(supabase, currentAvatarId, lastUserMessage),
      getMistakeLearnings(supabase, userId, currentAvatarId),
      getAvatarIdentity(supabase, currentAvatarId),
      getUserAffinity(supabase, userId, currentAvatarId),
    ]);

    // Update last interaction
    await updateLastInteraction(supabase, userId, currentAvatarId);

    // Smart knowledge retrieval
    const keywords = extractKeywords(lastUserMessage);
    const topicKnowledge = getTopicKnowledge(lastUserMessage, allKnowledge);
    const keywordMatches = matchKnowledge(keywords, allKnowledge);
    const relevantKnowledge = [
      ...new Map([...topicKnowledge, ...keywordMatches].map((k) => [k.title, k])).values(),
    ].slice(0, 5);

    const knowledgeContext = relevantKnowledge.length > 0
      ? relevantKnowledge.map((k) => `[${k.category.toUpperCase()}] ${k.content}`).join("\n\n")
      : "Usa la tua saggezza naturale per guidare questa conversazione.";

    const userContextText = userContextItems.length > 0
      ? userContextItems.map((c) => `- ${c.key}: ${c.value}`).join("\n")
      : "Sto ancora imparando a conoscerti.";

    // Format memory modules
    const socialGraphText = formatSocialGraph(socialGraph);
    const goalsText = formatTemporalGoals(temporalGoals);
    const metaphorsText = formatMetaphors(metaphors);
    const mistakesText = formatMistakeLearnings(mistakeLearnings);

    console.log(`Neural Memory: ${socialGraph.length} people, ${temporalGoals.length} goals, ${metaphors.length} metaphors, ${mistakeLearnings.length} learnings`);

    // Build enhanced system prompt
    const systemPrompt = buildMarcoSystemPrompt(
      avatarName,
      avatarRole,
      avatarTagline,
      avatarDescription,
      avatarPersonality,
      knowledgeContext,
      userContextText,
      temporalContext,
      lastSeenContext,
      socialGraphText,
      goalsText,
      metaphorsText,
      mistakesText,
      !!crisisDetected,
      avatarIdentityResult,
      userAffinityResult
    );

    // Make AI call
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi messaggi. Aspetta un momento." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Servizio temporaneamente non disponibile." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Errore nel servizio AI" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Background processing: insights, goals, and knowledge extraction
    if (messages.length >= 2) {
      const goalIntent = detectGoalIntent(lastUserMessage);
      
      setTimeout(async () => {
        try {
          // Goal detection and management
          if (goalIntent.type === "new_goal") {
            await extractAndSaveGoal(supabase, userId, currentAvatarId, messages, LOVABLE_API_KEY);
          } else if (goalIntent.type === "completion") {
            await completeGoalAndReward(supabase, userId, currentAvatarId, messages, LOVABLE_API_KEY);
          }
          
          // Extract user-specific insights (private memory)
          if (messages.length >= 4) {
            const { insights } = await extractInsights(messages, LOVABLE_API_KEY);
            if (insights.length > 0) {
              console.log(`Saving ${insights.length} insights for user ${userId}`);
              await saveInsights(supabase, userId, currentAvatarId, insights);
            }
            
            // Extract potential global knowledge
            await extractGlobalKnowledge(supabase, userId, currentAvatarId, messages, LOVABLE_API_KEY);
          }
        } catch (error) {
          console.error("Background processing error:", error);
        }
      }, 0);
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
