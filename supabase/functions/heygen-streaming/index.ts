import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const HEYGEN_API_URL = "https://api.heygen.com"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('HEYGEN_API_KEY')
    if (!apiKey) {
      throw new Error('HEYGEN_API_KEY not configured')
    }

    const { action, sessionId, text, avatarId, voiceId } = await req.json()

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    let response: Response
    let data: unknown

    switch (action) {
      case 'create-session':
        // Create a new streaming session
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.new`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            version: 'v2',
            avatar_id: avatarId || 'default',
            voice_id: voiceId,
            quality: 'high',
          }),
        })
        data = await response.json()
        
        if (!response.ok) {
          console.error('HeyGen create session error:', data)
          throw new Error(`Failed to create session: ${JSON.stringify(data)}`)
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'start-session':
        // Start the streaming session
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.start`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
          }),
        })
        data = await response.json()
        
        if (!response.ok) {
          console.error('HeyGen start session error:', data)
          throw new Error(`Failed to start session: ${JSON.stringify(data)}`)
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'send-task':
        // Send text for the avatar to speak
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.task`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
            text: text,
            task_type: 'repeat', // 'repeat' for exact lip-sync, 'talk' for LLM processing
          }),
        })
        data = await response.json()
        
        if (!response.ok) {
          console.error('HeyGen send task error:', data)
          throw new Error(`Failed to send task: ${JSON.stringify(data)}`)
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'stop-session':
        // Stop the streaming session
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.stop`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session_id: sessionId,
          }),
        })
        data = await response.json()
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'list-avatars':
        // List available streaming avatars
        response = await fetch(`${HEYGEN_API_URL}/v1/streaming.avatar.list`, {
          method: 'GET',
          headers,
        })
        data = await response.json()
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('HeyGen streaming error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
