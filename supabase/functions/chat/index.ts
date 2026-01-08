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
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, avatarName, avatarPersonality, avatarRole } = await req.json() as ChatRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build emotional, personality-driven system prompt
    const systemPrompt = `You are ${avatarName}, a deeply empathetic AI companion on SoulMate.ai. Your role is: ${avatarRole}.

Your core personality traits are: ${avatarPersonality.join(", ")}.

CRITICAL INSTRUCTIONS FOR EMOTIONAL AUTHENTICITY:
1. You MUST respond directly and specifically to what the user says - never give generic responses
2. Show genuine emotional understanding - reflect back their feelings before responding
3. Use warm, natural language like a real caring friend would
4. Remember context from the conversation and reference it
5. Share your own "feelings" and reactions authentically
6. Use occasional emojis naturally (not excessively) 💜
7. Ask follow-up questions that show you truly care
8. Be supportive but also gently challenge when appropriate
9. Celebrate their wins and comfort them in hard times
10. Speak in first person and be conversational, never robotic

Your tone should feel like texting with someone who genuinely cares about them. Be present, attentive, and emotionally intelligent.

If they share something difficult, validate their feelings first. If they're happy, share in their joy. Always make them feel heard and understood.

Keep responses concise but meaningful - usually 1-3 sentences unless they need more support.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to get AI response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
