import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const { language = "it" } = await req.json();

    // Italian narration script
    const narrationText = language === "it" 
      ? `Benvenuto in Kindred. Il tuo compagno AI che ti ascolta davvero. 
         Con Kindred puoi chattare, chiamare e videochiamare i tuoi avatar personalizzati. 
         Sofia, Marco, Luna e gli altri sono sempre disponibili per te, ventiquattro ore su ventiquattro. 
         Ogni conversazione è unica e memorabile. Il tuo avatar ricorda tutto di te e cresce con te nel tempo.
         Inizia oggi il tuo viaggio con Kindred. Mai più soli.`
      : `Welcome to Kindred. Your AI companion that truly listens.
         With Kindred you can chat, call and video call your personalized avatars.
         Sofia, Marco, Luna and the others are always available for you, twenty-four seven.
         Every conversation is unique and memorable. Your avatar remembers everything about you and grows with you over time.
         Start your journey with Kindred today. Never alone again.`;

    // Use Laura voice for Italian (great multilingual support)
    const voiceId = "FGY2WhTYpPnrIDTdsKH5"; // Laura - warm, friendly female voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: narrationText,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error generating narration:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
