import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

const HEYGEN_API_URL = "https://api.heygen.com";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication
  const { auth, error: authError } = await validateAuth(req);
  if (authError) {
    return authError;
  }

  console.log(`[HeyGen] Authenticated user ${auth!.userId}`);

  try {
    const apiKey = Deno.env.get('HEYGEN_API_KEY');
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY not configured');
    }

    const body = await req.json();
    const { action, sessionId, text, avatarId, voiceId, emotion, gesture, sdp, candidate } = body;

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    };

    let response: Response;
    let data: unknown;

    switch (action) {
      case 'create-session':
        // Create a new streaming session with WebRTC support
        console.log(`[HeyGen] Creating streaming session for avatar: ${avatarId}`);
        
        const sessionBody = {
          quality: 'high',
          avatar_name: avatarId || 'josh_lite3_20230714',
          voice: {
            voice_id: voiceId || 'it-IT-DiegoNeural',
          },
          version: 'v2',
          video_encoding: 'H264',
        };

        console.log('[HeyGen] Session request body:', JSON.stringify(sessionBody));

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.new`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sessionBody),
        });
        
        data = await response.json();
        console.log('[HeyGen] Create session response status:', response.status);
        console.log('[HeyGen] Create session response:', JSON.stringify(data));
        
        if (!response.ok) {
          console.error('[HeyGen] Create session error:', data);
          throw new Error(`Failed to create session: ${JSON.stringify(data)}`);
        }
        
        // Log what we got back
        const sessionData = data as any;
        console.log('[HeyGen] Session created:', {
          session_id: sessionData?.data?.session_id,
          hasSdp: !!sessionData?.data?.sdp,
          hasIceServers: !!sessionData?.data?.ice_servers2,
          hasUrl: !!sessionData?.data?.url,
          hasAccessToken: !!sessionData?.data?.access_token,
        });
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'start-session':
        // Start the streaming session with SDP answer
        console.log(`[HeyGen] Starting session: ${sessionId}`);
        
        const startBody: Record<string, unknown> = {
          session_id: sessionId,
        };
        
        // Include SDP answer if provided (for WebRTC)
        if (sdp) {
          startBody.sdp = sdp;
          console.log('[HeyGen] Including SDP answer in start request');
        }
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.start`, {
          method: 'POST',
          headers,
          body: JSON.stringify(startBody),
        });
        
        data = await response.json();
        console.log('[HeyGen] Start session response status:', response.status);
        console.log('[HeyGen] Start session response:', JSON.stringify(data));
        
        if (!response.ok) {
          console.error('[HeyGen] Start session error:', data);
          throw new Error(`Failed to start session: ${JSON.stringify(data)}`);
        }
        
        console.log('[HeyGen] Session started successfully');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-task':
        // Send text for the avatar to speak
        if (!text?.trim()) {
          console.log('[HeyGen] Empty text, skipping task');
          return new Response(JSON.stringify({ success: true, skipped: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        console.log(`[HeyGen] Sending task: "${text.substring(0, 50)}..."`);
        
        const taskBody: Record<string, unknown> = {
          session_id: sessionId,
          text: text,
          task_type: 'repeat',
        };

        if (emotion) {
          taskBody.emotion = emotion;
        }

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify(taskBody),
        });
        
        data = await response.json();
        console.log('[HeyGen] Task response status:', response.status);
        
        if (!response.ok) {
          console.error('[HeyGen] Task error:', data);
          throw new Error(`Failed to send task: ${JSON.stringify(data)}`);
        }
        
        console.log('[HeyGen] Task sent successfully');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-gesture':
        // Send gesture command
        console.log(`[HeyGen] Sending gesture: ${gesture}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            task_type: 'gesture',
            gesture: gesture || 'nod',
          }),
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'set-emotion':
        // Set avatar emotion
        console.log(`[HeyGen] Setting emotion: ${emotion}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            task_type: 'emotion',
            emotion: emotion || 'neutral',
          }),
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'ice-candidate':
        // Handle WebRTC ICE candidate
        console.log(`[HeyGen] Sending ICE candidate for session: ${sessionId}`);
        
        if (!candidate) {
          return new Response(JSON.stringify({ success: false, error: 'No candidate provided' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.ice`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            candidate: candidate,
          }),
        });
        
        data = await response.json();
        console.log('[HeyGen] ICE candidate response:', response.status);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'interrupt':
        // Interrupt current speech
        console.log(`[HeyGen] Interrupting session: ${sessionId}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.interrupt`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
          }),
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'stop-session':
        // Stop streaming session
        console.log(`[HeyGen] Stopping session: ${sessionId}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.stop`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
          }),
        });
        
        data = await response.json();
        console.log('[HeyGen] Session stopped');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list-avatars':
        // List available streaming avatars
        console.log('[HeyGen] Fetching available avatars');
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.avatar.list`, {
          method: 'GET',
          headers,
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list-voices':
        // List available voices
        console.log('[HeyGen] Fetching available voices');
        
        response = await fetch(`${HEYGEN_API_URL}/v1/voices`, {
          method: 'GET',
          headers,
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[HeyGen] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
