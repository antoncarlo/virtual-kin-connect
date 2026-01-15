import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate authentication
  const { auth, error: authError } = await validateAuth(req);
  if (authError) {
    return authError;
  }

  console.log(`Authenticated user ${auth!.userId} accessing vapi-public-key`);

  try {
    const VAPI_PUBLIC_KEY = Deno.env.get("VAPI_PUBLIC_KEY");
    
    if (!VAPI_PUBLIC_KEY) {
      throw new Error("VAPI_PUBLIC_KEY not configured");
    }

    return new Response(
      JSON.stringify({ publicKey: VAPI_PUBLIC_KEY }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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
