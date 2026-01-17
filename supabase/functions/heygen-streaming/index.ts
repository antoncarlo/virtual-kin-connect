import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

const HEYGEN_API_URL = "https://api.heygen.com";

interface StreamingConfig {
  avatarId?: string;
  voiceId?: string;
  quality?: "low" | "medium" | "high";
  idleConfig?: {
    enabled: boolean;
    blinkFrequency?: number;
    headMovement?: boolean;
    expressionVariation?: boolean;
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

  console.log(`Authenticated user ${auth!.userId} accessing heygen-streaming`);

  try {
    const apiKey = Deno.env.get('HEYGEN_API_KEY');
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY not configured');
    }

    const { action, sessionId, text, avatarId, voiceId, emotion, idleConfig } = await req.json();

    const headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    };

    let response: Response;
    let data: unknown;

    switch (action) {
      case 'create-session':
        // Create a new streaming session with advanced configuration
        // Using Streaming API v2 for best quality
        console.log(`Creating HeyGen streaming session for avatar: ${avatarId}`);
        
        const sessionBody: Record<string, unknown> = {
          version: 'v2',
          quality: 'high',
          avatar_name: avatarId || 'josh_lite3_20230714',
          voice: {
            voice_id: voiceId || 'it-IT-DiegoNeural',
            provider: 'azure',
          },
          // Enable natural idle movements
          video_encoding: 'H264',
          disable_idle_timeout: false,
        };

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.new`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sessionBody),
        });
        data = await response.json();
        
        if (!response.ok) {
          console.error('HeyGen create session error:', data);
          throw new Error(`Failed to create session: ${JSON.stringify(data)}`);
        }
        
        console.log('HeyGen session created successfully:', (data as any)?.data?.session_id);
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'start-session':
        // Start the streaming session with SDP exchange
        console.log(`Starting HeyGen session: ${sessionId}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.start`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
          }),
        });
        data = await response.json();
        
        if (!response.ok) {
          console.error('HeyGen start session error:', data);
          throw new Error(`Failed to start session: ${JSON.stringify(data)}`);
        }
        
        console.log('HeyGen session started successfully');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-task':
        // Send text for the avatar to speak with emotional context
        console.log(`Sending task to session ${sessionId}: "${text?.substring(0, 50)}..."`);
        
        const taskBody: Record<string, unknown> = {
          session_id: sessionId,
          text: text,
          task_type: 'repeat', // 'repeat' for exact lip-sync
        };

        // Add emotion if provided for emotional sync
        if (emotion) {
          taskBody.emotion = emotion; // e.g., "happy", "sad", "excited", "calm"
        }

        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify(taskBody),
        });
        data = await response.json();
        
        if (!response.ok) {
          console.error('HeyGen send task error:', data);
          throw new Error(`Failed to send task: ${JSON.stringify(data)}`);
        }
        
        console.log('HeyGen task sent successfully');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'send-gesture':
        // Send a gesture command (wave, nod, etc.)
        console.log(`Sending gesture to session ${sessionId}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            task_type: 'gesture',
            gesture: 'wave', // or 'nod', 'smile'
          }),
        });
        data = await response.json();
        
        if (!response.ok) {
          console.error('HeyGen gesture error:', data);
          // Don't throw - gestures are optional
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'set-emotion':
        // Update avatar's emotional state for natural expressions
        console.log(`Setting emotion for session ${sessionId}: ${emotion}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            task_type: 'emotion',
            emotion: emotion || 'neutral', // neutral, happy, sad, surprised, serious
          }),
        });
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'ice-candidate':
        // Handle ICE candidate for WebRTC
        const { candidate } = await req.json();
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.ice`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            candidate: candidate,
          }),
        });
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'stop-session':
        // Stop the streaming session
        console.log(`Stopping HeyGen session: ${sessionId}`);
        
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.stop`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
          }),
        });
        data = await response.json();
        
        console.log('HeyGen session stopped');
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list-avatars':
        // List available streaming avatars
        console.log('Fetching available HeyGen streaming avatars');
        
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
        console.log('Fetching available HeyGen voices');
        
        response = await fetch(`${HEYGEN_API_URL}/v1/voices`, {
          method: 'GET',
          headers,
        });
        data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'interrupt':
        // Interrupt current speech (useful for real conversation)
        console.log(`Interrupting session ${sessionId}`);
        
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

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('HeyGen streaming error:', error);
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
