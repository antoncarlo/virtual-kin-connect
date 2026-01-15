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
    const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY");
    
    if (!DAILY_API_KEY) {
      throw new Error("DAILY_API_KEY not configured");
    }

    const { action, roomName, expiryMinutes = 60, properties } = await req.json();

    const DAILY_BASE_URL = "https://api.daily.co/v1";

    if (action === "create-room") {
      // Create a new Daily room for video calls
      const response = await fetch(`${DAILY_BASE_URL}/rooms`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: roomName || `room-${Date.now()}`,
          privacy: "private",
          properties: {
            exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
            enable_screenshare: false,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            ...properties,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Daily API error: ${error}`);
      }

      const room = await response.json();
      
      // Create a meeting token for the room
      const tokenResponse = await fetch(`${DAILY_BASE_URL}/meeting-tokens`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: room.name,
            exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
            is_owner: true,
          },
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`Daily Token API error: ${error}`);
      }

      const tokenData = await tokenResponse.json();

      return new Response(
        JSON.stringify({ 
          success: true, 
          room: {
            name: room.name,
            url: room.url,
            token: tokenData.token,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "get-room") {
      const response = await fetch(`${DAILY_BASE_URL}/rooms/${roomName}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${DAILY_API_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Daily API error: ${error}`);
      }

      const room = await response.json();
      return new Response(
        JSON.stringify({ success: true, room }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "delete-room") {
      const response = await fetch(`${DAILY_BASE_URL}/rooms/${roomName}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${DAILY_API_KEY}`,
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Daily API error: ${error}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Room deleted" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === "create-token") {
      // Create a meeting token for an existing room
      const response = await fetch(`${DAILY_BASE_URL}/meeting-tokens`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            exp: Math.floor(Date.now() / 1000) + (expiryMinutes * 60),
            ...properties,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Daily Token API error: ${error}`);
      }

      const tokenData = await response.json();
      return new Response(
        JSON.stringify({ success: true, token: tokenData.token }),
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
