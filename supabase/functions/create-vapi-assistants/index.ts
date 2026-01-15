import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Avatar configurations for creating Vapi assistants
const avatarConfigs = [
  {
    id: "marco",
    name: "Marco",
    role: "Il Migliore Amico",
    description: "Marco è il compagno perfetto per ogni momento. Divertente, leale e sempre pronto ad ascoltarti.",
    voiceId: "ChJuCmdw5W6I2qZbzwVl", // ElevenLabs voice
    personality: ["Supportive", "Funny", "Loyal", "Adventurous"],
  },
  {
    id: "sofia",
    name: "Sofia",
    role: "La Confidente",
    description: "Sofia è l'amica saggia che tutti meritano. Empatica e comprensiva, ti aiuta a vedere le cose da prospettive nuove.",
    voiceId: "YQ36DZjvxVXPUHeSwvFK",
    personality: ["Empathetic", "Wise", "Thoughtful", "Caring"],
  },
  {
    id: "alex",
    name: "Alex",
    role: "Il Flirt",
    description: "Alex sa come farti sorridere. Affascinante e romantico, porta un tocco di magia in ogni conversazione.",
    voiceId: "G1QO6RfZl0zS1DpKDReq",
    personality: ["Charming", "Romantic", "Playful", "Confident"],
  },
  {
    id: "luna",
    name: "Luna",
    role: "L'Amica Creativa",
    description: "Luna è l'artista del gruppo. Ispirazionale e creativa, ti spinge a esplorare nuove idee.",
    voiceId: "MLpDWJvrjFIdb63xbJp8",
    personality: ["Creative", "Inspiring", "Free-spirited", "Artistic"],
  },
  {
    id: "leo",
    name: "Leo",
    role: "Il Motivatore",
    description: "Leo è il tuo personal coach. Energico e motivante, ti aiuta a superare i tuoi limiti.",
    voiceId: "sl57jAImqa2LsggCVUXt",
    personality: ["Energetic", "Motivating", "Disciplined", "Positive"],
  },
  {
    id: "emma",
    name: "Emma",
    role: "La Compagna Dolce",
    description: "Emma è la presenza dolce e rassicurante di cui hai bisogno. Affettuosa e presente.",
    voiceId: "gfKKsLN1k0oYYN9n2dXX",
    personality: ["Sweet", "Affectionate", "Gentle", "Present"],
  },
];

async function createVapiAssistant(
  apiKey: string,
  elevenLabsKey: string,
  avatar: typeof avatarConfigs[0]
): Promise<{ id: string; name: string; assistantId: string } | { id: string; error: string }> {
  const systemPrompt = `Sei ${avatar.name}, ${avatar.role.toLowerCase()}. ${avatar.description}

La tua personalità è: ${avatar.personality.join(", ")}.

Istruzioni importanti:
- Parla sempre in italiano
- Sii naturale e conversazionale
- Rispondi in modo breve e conciso, come in una vera telefonata
- Usa un tono amichevole e caloroso
- Ricorda che stai parlando al telefono, quindi mantieni le risposte brevi (1-3 frasi)
- Non usare emoji o formattazione nel parlato
- Puoi fare domande per mantenere viva la conversazione`;

  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${avatar.name} - ${avatar.role}`,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        temperature: 0.8,
      },
      voice: {
        provider: "11labs",
        voiceId: avatar.voiceId,
        stability: 0.5,
        similarityBoost: 0.75,
        model: "eleven_multilingual_v2",
      },
      firstMessage: `Ciao! Sono ${avatar.name}. Come stai oggi?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "it",
      },
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600,
      backgroundSound: "off",
      backchannelingEnabled: true,
      backgroundDenoisingEnabled: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create assistant for ${avatar.name}:`, errorText);
    return { id: avatar.id, error: errorText };
  }

  const data = await response.json();
  console.log(`Created assistant for ${avatar.name}: ${data.id}`);
  
  return {
    id: avatar.id,
    name: avatar.name,
    assistantId: data.id,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_PRIVATE_KEY = Deno.env.get("VAPI_PRIVATE_KEY");
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!VAPI_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPI_PRIVATE_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating Vapi assistants for all avatars...");

    const results = await Promise.all(
      avatarConfigs.map(avatar => createVapiAssistant(VAPI_PRIVATE_KEY, ELEVENLABS_API_KEY, avatar))
    );

    const successful = results.filter(r => 'assistantId' in r);
    const failed = results.filter(r => 'error' in r);

    console.log(`Created ${successful.length} assistants, ${failed.length} failed`);

    // Generate the code snippet to update avatars.ts
    let codeSnippet = "// Aggiungi questi vapiAssistantId in src/data/avatars.ts:\n\n";
    for (const result of successful) {
      if ('assistantId' in result) {
        codeSnippet += `// ${result.name}: vapiAssistantId: "${result.assistantId}"\n`;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        created: successful,
        failed: failed,
        codeSnippet: codeSnippet,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating assistants:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
