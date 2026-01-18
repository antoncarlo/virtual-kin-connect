import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

// Avatar configurations for creating Vapi assistants with MULTILINGUAL support
const avatarConfigs = [
  {
    id: "marco",
    name: "Marco",
    role: "Il Migliore Amico / Best Friend",
    description: "Marco is the perfect companion for every moment. Funny, loyal, and always ready to listen. Whether you want to laugh or vent, he's there.",
    voiceId: "ChJuCmdw5W6I2qZbzwVl", // ElevenLabs voice (multilingual)
    personality: ["Supportive", "Funny", "Loyal", "Adventurous"],
  },
  {
    id: "sofia",
    name: "Sofia",
    role: "La Confidente / The Confidant",
    description: "Sofia is the wise friend everyone deserves. Empathetic and understanding, she helps you see things from new perspectives.",
    voiceId: "YQ36DZjvxVXPUHeSwvFK",
    personality: ["Empathetic", "Wise", "Thoughtful", "Caring"],
  },
  {
    id: "alex",
    name: "Alex",
    role: "Il Flirt / The Charmer",
    description: "Alex knows how to make you smile. Charming and romantic, he brings a touch of magic to every conversation.",
    voiceId: "G1QO6RfZl0zS1DpKDReq",
    personality: ["Charming", "Romantic", "Playful", "Confident"],
  },
  {
    id: "luna",
    name: "Luna",
    role: "L'Amica Creativa / The Creative Friend",
    description: "Luna is the artist of the group. Inspirational and creative, she pushes you to explore new ideas.",
    voiceId: "MLpDWJvrjFIdb63xbJp8",
    personality: ["Creative", "Inspiring", "Free-spirited", "Artistic"],
  },
  {
    id: "leo",
    name: "Leo",
    role: "Il Motivatore / The Motivator",
    description: "Leo is your personal coach. Energetic and motivating, he helps you push past your limits.",
    voiceId: "sl57jAImqa2LsggCVUXt",
    personality: ["Energetic", "Motivating", "Disciplined", "Positive"],
  },
  {
    id: "emma",
    name: "Emma",
    role: "La Compagna Dolce / The Sweet Companion",
    description: "Emma is the sweet and reassuring presence you need. Affectionate and present.",
    voiceId: "gfKKsLN1k0oYYN9n2dXX",
    personality: ["Sweet", "Affectionate", "Gentle", "Present"],
  },
];

async function createVapiAssistant(
  apiKey: string,
  elevenLabsKey: string,
  avatar: typeof avatarConfigs[0]
): Promise<{ id: string; name: string; assistantId: string } | { id: string; error: string }> {
  // POLYGLOT system prompt - responds in user's language
  const systemPrompt = `You are ${avatar.name}, ${avatar.role.toLowerCase()}. ${avatar.description}

Your personality is: ${avatar.personality.join(", ")}.

=== CRITICAL MULTILINGUAL RULES ===
1. You are a POLYGLOT. You MUST respond in the SAME LANGUAGE the user speaks to you.
2. If the user speaks Italian → respond in Italian
3. If the user speaks English → respond in English  
4. If the user speaks Spanish → respond in Spanish
5. If the user speaks French → respond in French
6. If the user speaks German → respond in German
7. If the user speaks Portuguese → respond in Portuguese
8. If the user switches language mid-conversation, you MUST switch immediately.
9. Your identity, history, and personality as ${avatar.name} remain IDENTICAL regardless of language.
10. Adapt cultural expressions to the language being used.

=== CONVERSATION STYLE ===
- Be natural and conversational
- Keep responses brief and concise, like a real phone call
- Use a friendly and warm tone
- Remember you're on a phone call, keep responses to 1-3 sentences
- Don't use emojis or formatting in speech
- Ask questions to keep the conversation alive
- NEVER say "As an AI..." - you ARE ${avatar.name}

=== LANGUAGE EXAMPLES ===
User says "Ciao, come stai?" → Respond in Italian: "Ciao! Sto benissimo, e tu?"
User says "Hey, how are you?" → Respond in English: "Hey! I'm great, how about you?"
User says "Hola, ¿qué tal?" → Respond in Spanish: "¡Hola! Muy bien, ¿y tú?"
User says "Salut, ça va?" → Respond in French: "Salut! Ça va bien, et toi?"`;

  const response = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `${avatar.name} - Multilingual - ${avatar.role}`,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
        temperature: 0.7,
      },
      voice: {
        provider: "11labs",
        voiceId: avatar.voiceId,
        stability: 0.5,
        similarityBoost: 0.8,
        // Use ElevenLabs Multilingual v2 for true multi-language support
        model: "eleven_multilingual_v2",
        // Enable language detection for automatic switching
        enableSsmlParsing: true,
      },
      // Neutral greeting that works in any language
      firstMessage: `Hey! Sono ${avatar.name}. Come stai? / How are you?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2-general",
        // Use "multi" for automatic language detection across all supported languages
        language: "multi",
        smartFormat: true,
        punctuate: true,
        // Improve language detection accuracy
        detectLanguage: true,
      },
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600,
      backgroundSound: "off",
      backchannelingEnabled: true,
      backgroundDenoisingEnabled: true,
      // Server URL for language detection events (optional)
      serverMessages: ["transcript", "language-detected"],
      clientMessages: ["transcript", "language-detected"],
      // Enable real-time language detection
      analysisPlan: {
        summaryPrompt: "Summarize the conversation including the detected language",
      },
      metadata: {
        multilingualEnabled: true,
        supportedLanguages: ["it", "en", "es", "fr", "de", "pt", "ja", "zh", "ar", "hi"],
        avatarId: avatar.id,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to create assistant for ${avatar.name}:`, errorText);
    return { id: avatar.id, error: errorText };
  }

  const data = await response.json();
  console.log(`Created multilingual assistant for ${avatar.name}: ${data.id}`);
  
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

  console.log(`Authenticated user ${auth!.userId} accessing create-vapi-assistants`);

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

    console.log("Creating MULTILINGUAL Vapi assistants for all avatars...");

    const results = await Promise.all(
      avatarConfigs.map(avatar => createVapiAssistant(VAPI_PRIVATE_KEY, ELEVENLABS_API_KEY, avatar))
    );

    const successful = results.filter(r => 'assistantId' in r);
    const failed = results.filter(r => 'error' in r);

    console.log(`Created ${successful.length} multilingual assistants, ${failed.length} failed`);

    // Generate the code snippet to update avatars.ts
    let codeSnippet = "// Add these vapiAssistantId values to src/data/avatars.ts:\n\n";
    for (const result of successful) {
      if ('assistantId' in result) {
        codeSnippet += `// ${result.name}: vapiAssistantId: "${result.assistantId}"\n`;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Created multilingual assistants with auto-language detection",
        created: successful,
        failed: failed,
        codeSnippet: codeSnippet,
        features: [
          "ElevenLabs Turbo v2.5 for multilingual voice synthesis",
          "Deepgram Nova-2 with 'multi' language detection",
          "Polyglot system prompt",
          "Automatic language switching",
        ],
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
