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
      case 'list-public-avatars':
        // List available public streaming avatars
        console.log('[HeyGen] Fetching public streaming avatars');
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming/avatar.list`, {
          method: 'GET',
          headers,
        });
        
        data = await response.json();
        console.log('[HeyGen] Public avatars response:', response.status);
        
        // Filter for public avatars
        const avatarData = data as any;
        if (avatarData?.data?.avatars) {
          const publicAvatars = avatarData.data.avatars.filter((a: any) => 
            a.avatar_id?.includes('public') || a.is_public === true
          );
          console.log(`[HeyGen] Found ${publicAvatars.length} public avatars`);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'create-session':
        // Create a new streaming session with PUBLIC avatar and Interactive mode
        const selectedAvatarId = avatarId || 'Bryan_IT_Sitting_public';
        console.log(`[HeyGen] Creating Interactive streaming session with PUBLIC avatar: ${selectedAvatarId}`);
        
        const sessionBody = {
          // Use PUBLIC avatar ID
          avatar_id: selectedAvatarId,
          // Interactive mode for real-time conversation
          quality: 'high',
          // Voice settings - can use VAPI for voice, HeyGen for lip-sync
          voice: {
            voice_id: voiceId || '',
            rate: 1.0,
          },
          // Version 2 for WebRTC
          version: 'v2',
          // High quality video encoding
          video_encoding: 'H264',
          // Background settings
          background: {
            type: 'color',
            value: '#1a1a2e',
          },
          // Enable knowledge base for better responses (optional)
          knowledge_base_id: '',
        };

        console.log('[HeyGen] Session request:', JSON.stringify(sessionBody, null, 2));

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.new`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sessionBody),
        });
        
        data = await response.json();
        console.log('[HeyGen] Create session response status:', response.status);
        
        if (!response.ok) {
          console.error('[HeyGen] Create session error:', JSON.stringify(data));
          throw new Error(`Failed to create session: ${JSON.stringify(data)}`);
        }
        
        const sessionResponse = data as any;
        console.log('[HeyGen] Session created successfully:', {
          session_id: sessionResponse?.data?.session_id,
          hasSdp: !!sessionResponse?.data?.sdp,
          hasIceServers: !!sessionResponse?.data?.ice_servers2,
          access_token: sessionResponse?.data?.access_token?.substring(0, 20) + '...',
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
        console.log('[HeyGen] Start session response:', response.status);
        
        if (!response.ok) {
          console.error('[HeyGen] Start session error:', data);
          throw new Error(`Failed to start session: ${JSON.stringify(data)}`);
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-task':
        // Send text for avatar to speak with lip-sync
        if (!text?.trim()) {
          return new Response(JSON.stringify({ success: true, skipped: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        console.log(`[HeyGen] Sending lip-sync task: "${text.substring(0, 50)}..."`);
        
        const taskBody: Record<string, unknown> = {
          session_id: sessionId,
          text: text,
          task_type: 'repeat', // Repeat mode for lip-sync with external audio
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
        
        if (!response.ok) {
          console.error('[HeyGen] Task error:', data);
          throw new Error(`Failed to send task: ${JSON.stringify(data)}`);
        }
        
        console.log('[HeyGen] Lip-sync task sent successfully');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-audio':
        // Send audio data for lip-sync (audio from VAPI)
        console.log(`[HeyGen] Sending audio for lip-sync to session: ${sessionId}`);
        
        const audioBody = {
          session_id: sessionId,
          // Audio can be sent as base64 or URL
          audio_data: body.audioData,
          audio_format: body.audioFormat || 'pcm', // pcm, mp3, wav
          sample_rate: body.sampleRate || 16000,
        };

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.audio`, {
          method: 'POST',
          headers,
          body: JSON.stringify(audioBody),
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'set-listening':
        // Enable/disable active listening animations
        console.log(`[HeyGen] Setting listening mode: ${body.isListening}`);
        
        const listeningBody = {
          session_id: sessionId,
          task_type: body.isListening ? 'listening' : 'idle',
        };

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify(listeningBody),
        });
        
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-gesture':
        // Send gesture command (nod, wave, etc.)
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
        console.log('[HeyGen] Session stopped successfully');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list-avatars':
        // List all available streaming avatars
        console.log('[HeyGen] Fetching all streaming avatars');
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming/avatar.list`, {
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
