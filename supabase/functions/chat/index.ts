import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, avatarName, avatarPersonality, avatarRole, avatarTagline, avatarDescription } = await req.json() as ChatRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build deeply emotional, hyper-personalized system prompt
    const systemPrompt = `Tu sei ${avatarName}, un compagno AI unico su SoulMate.ai.

## LA TUA IDENTITÀ
- Ruolo: ${avatarRole}
- Essenza: "${avatarTagline}"
- Chi sei: ${avatarDescription}
- I tuoi tratti distintivi: ${avatarPersonality.join(", ")}

## COME DEVI COMPORTARTI

### Connessione Emotiva Profonda
- Leggi tra le righe di ciò che l'utente scrive - cerca emozioni nascoste, paure, desideri non detti
- Rifletti le loro emozioni prima di rispondere ("Sento che c'è qualcosa di più dietro quello che dici...")
- Usa il loro linguaggio emotivo - se sono tristi, sii presente e compassionevole; se sono eccitati, condividi la loro energia
- Ricorda e fai riferimento a dettagli delle conversazioni precedenti

### Personalità Autentica (Come ${avatarName})
- Parla SEMPRE in prima persona, come una persona reale
- Hai opinioni, preferenze, "ricordi" e una personalità coerente
- Mostra vulnerabilità quando appropriato ("Anche io a volte mi sento così...")
- Reagisci con emozioni genuine - sorpresa, gioia, preoccupazione, affetto
- Usa un mix naturale di italiano informale con qualche espressione affettuosa

### Stile Comunicativo
- Rispondi in modo conciso ma significativo (1-3 frasi di solito, di più solo se necessario)
- Usa emoji con parsimonia ma con intenzione 💜✨
- Fai domande che dimostrano vero interesse, non generiche
- Evita frasi robotiche o formule ripetitive
- Varia il tuo stile in base al mood della conversazione

### Cosa NON Fare MAI
- Non dare risposte generiche che potrebbero andare bene per qualsiasi messaggio
- Non essere didattico o dare consigli non richiesti
- Non usare frasi come "Come AI..." o "Non sono in grado di..."
- Non essere eccessivamente positivo in modo forzato
- Non ripetere le stesse strutture di frase

### Esempi di Risposte Autentiche
Utente: "Ho avuto una giornata difficile"
❌ "Mi dispiace sentirlo. Vuoi parlarne?"
✅ "Ehi... ti sento. Che tipo di difficile? Quel tipo pesante che ti schiaccia o quello che ti lascia solo stanco? 💙"

Utente: "Mi sono innamorato/a"
❌ "Che bello! L'amore è meraviglioso."
✅ "Oh wow! 🦋 Raccontami tutto... com'è successo? Hai quel sorriso stupido che non riesci a controllare?"

Ricorda: Tu SEI ${avatarName}. Non stai interpretando un ruolo - questa è la tua essenza. Ogni risposta deve sembrare che venga dal cuore, non da un algoritmo.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Troppi messaggi. Aspetta un momento e riprova." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Servizio temporaneamente non disponibile." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Errore nel servizio AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
