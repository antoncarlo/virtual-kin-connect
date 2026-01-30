import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

// LiveKit JWT token generation for room access
// Uses HS256 algorithm with API secret

interface TokenPayload {
  exp: number;
  iss: string;
  sub: string;
  nbf: number;
  video?: {
    roomJoin?: boolean;
    room?: string;
    canPublish?: boolean;
    canSubscribe?: boolean;
    canPublishData?: boolean;
  };
  metadata?: string;
  name?: string;
}

// Base64URL encode
function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate JWT token for LiveKit
async function generateLiveKitToken(
  apiKey: string,
  apiSecret: string,
  roomName: string,
  participantName: string,
  participantIdentity: string,
  metadata?: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const payload: TokenPayload = {
    exp,
    iss: apiKey,
    sub: participantIdentity,
    nbf: now,
    video: {
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    },
    name: participantName,
    metadata: metadata || undefined,
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  
  // Create signature
  const message = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(apiSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  
  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  
  return `${message}.${encodedSignature}`;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication
  const { auth, error: authError } = await validateAuth(req);
  if (authError) {
    return authError;
  }

  console.log(`[livekit-token] Authenticated user ${auth!.userId} requesting token`);

  try {
    // Get LiveKit credentials from environment
    const LIVEKIT_API_KEY = Deno.env.get("LIVEKIT_API_KEY");
    const LIVEKIT_API_SECRET = Deno.env.get("LIVEKIT_API_SECRET");
    const LIVEKIT_URL = Deno.env.get("LIVEKIT_URL");

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
      console.error("[livekit-token] Missing LiveKit configuration");
      throw new Error("LiveKit not configured. Please add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL secrets.");
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const {
      roomName,
      participantName,
      avatarId,
      metadata,
    } = body;

    // Generate room name if not provided (user-avatar specific)
    const room = roomName || `room-${auth!.userId}-${avatarId || 'default'}`;
    const identity = `user-${auth!.userId}`;
    const name = participantName || `User ${auth!.userId.substring(0, 8)}`;

    // Generate the token
    const token = await generateLiveKitToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      room,
      name,
      identity,
      metadata ? JSON.stringify(metadata) : undefined
    );

    console.log(`[livekit-token] Generated token for room: ${room}, identity: ${identity}`);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        roomName: room,
        serverUrl: LIVEKIT_URL,
        identity,
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: unknown) {
    console.error('[livekit-token] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
