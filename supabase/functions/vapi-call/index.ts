import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VAPI_PRIVATE_KEY = Deno.env.get("VAPI_PRIVATE_KEY");
    
    if (!VAPI_PRIVATE_KEY) {
      throw new Error("VAPI_PRIVATE_KEY not configured");
    }

    const { action, assistantId, phoneNumber, customerId, metadata } = await req.json();

    // Base URL for Vapi API
    const VAPI_BASE_URL = "https://api.vapi.ai";

    if (action === "create-call") {
      // Create an outbound call
      const response = await fetch(`${VAPI_BASE_URL}/call`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId,
          customer: phoneNumber ? { number: phoneNumber } : undefined,
          metadata: {
            ...metadata,
            customerId,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vapi API error: ${error}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, call: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "create-web-call") {
      // Create a web call token for browser-based calls
      const response = await fetch(`${VAPI_BASE_URL}/call/web`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistantId,
          metadata: {
            ...metadata,
            customerId,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vapi API error: ${error}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, webCall: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "get-call") {
      const { callId } = await req.json();
      
      const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vapi API error: ${error}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, call: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "end-call") {
      const { callId } = await req.json();
      
      const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vapi API error: ${error}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Call ended" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "list-assistants") {
      const response = await fetch(`${VAPI_BASE_URL}/assistant`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${VAPI_PRIVATE_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vapi API error: ${error}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, assistants: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
