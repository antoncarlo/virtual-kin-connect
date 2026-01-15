import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

// Marco and Alex using Vapi's built-in voices
const avatarConfigs = [
  {
    id: "marco",
    name: "Marco",
    role: "Il Migliore Amico",
    description: "Marco è il compagno perfetto per ogni momento. Divertente, leale e sempre pronto ad ascoltarti.",
    personality: ["Supportive", "Funny", "Loyal", "Adventurous"],
  },
  {
    id: "alex",
    name: "Alex",
    role: "Il Flirt",
    description: "Alex sa come farti sorridere. Affascinante e romantico, porta un tocco di magia in ogni conversazione.",
    personality: ["Charming", "Romantic", "Playful", "Confident"],
  },
];

async function createVapiAssistant(
  apiKey: string,
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
      // Using Vapi's built-in Azure voices for Italian
      voice: {
        provider: "azure",
        voiceId: avatar.id === "marco" ? "it-IT-DiegoNeural" : "it-IT-GiuseppeNeural",
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

  // Validate authentication
  const { auth, error: authError } = await validateAuth(req);
  if (authError) {
    return authError;
  }

  console.log(`Authenticated user ${auth!.userId} accessing create-vapi-assistants-retry`);

  try {
    const VAPI_PRIVATE_KEY = Deno.env.get("VAPI_PRIVATE_KEY");

    if (!VAPI_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ error: "VAPI_PRIVATE_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating Vapi assistants for Marco and Alex with Azure voices...");

    const results = await Promise.all(
      avatarConfigs.map(avatar => createVapiAssistant(VAPI_PRIVATE_KEY, avatar))
    );

    const successful = results.filter(r => 'assistantId' in r);
    const failed = results.filter(r => 'error' in r);

    return new Response(
      JSON.stringify({ 
        success: true,
        created: successful,
        failed: failed,
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
