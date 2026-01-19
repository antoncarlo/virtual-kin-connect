import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, validateAuth } from "../_shared/auth.ts";

/**
 * Mem0 Proxy Edge Function
 * 
 * This function proxies requests to the Mem0 API, keeping the API key secure.
 * It supports:
 * - Adding memories from conversation messages
 * - Searching memories by query
 * - Getting all memories for a user
 * - Deleting specific memories
 */

const MEM0_API_URL = "https://api.mem0.ai";

interface AddMemoryRequest {
  action: "add";
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userId: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

interface SearchMemoryRequest {
  action: "search";
  query: string;
  userId: string;
  agentId?: string;
  limit?: number;
}

interface GetMemoriesRequest {
  action: "get";
  userId: string;
  agentId?: string;
  limit?: number;
}

interface DeleteMemoryRequest {
  action: "delete";
  memoryId: string;
}

type Mem0Request = AddMemoryRequest | SearchMemoryRequest | GetMemoriesRequest | DeleteMemoryRequest;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authResult = await validateAuth(req);
    if (authResult.error) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const MEM0_API_KEY = Deno.env.get("MEM0_API_KEY");
    if (!MEM0_API_KEY) {
      console.error("MEM0_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Mem0 API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json() as Mem0Request;
    const { action } = body;

    console.log(`[mem0-proxy] Action: ${action}`);

    let response: Response;

    switch (action) {
      case "add": {
        const { messages, userId, agentId, metadata } = body as AddMemoryRequest;
        
        console.log(`[mem0-proxy] Adding memories for user: ${userId}, agent: ${agentId}`);
        
        response = await fetch(`${MEM0_API_URL}/v1/memories/`, {
          method: "POST",
          headers: {
            "Authorization": `Token ${MEM0_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            user_id: userId,
            agent_id: agentId,
            version: "v2",
            metadata: {
              ...metadata,
              source: "kindred_ai",
              timestamp: new Date().toISOString(),
            },
          }),
        });
        break;
      }

      case "search": {
        const { query, userId, agentId, limit = 10 } = body as SearchMemoryRequest;
        
        console.log(`[mem0-proxy] Searching memories for user: ${userId}, query: ${query.substring(0, 50)}...`);
        
        // Use v2 search API with filters
        response = await fetch(`${MEM0_API_URL}/v2/memories/search/`, {
          method: "POST",
          headers: {
            "Authorization": `Token ${MEM0_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            filters: {
              OR: [
                { user_id: userId },
                ...(agentId ? [{ agent_id: agentId }] : []),
              ],
            },
            limit,
          }),
        });
        break;
      }

      case "get": {
        const { userId, agentId, limit = 50 } = body as GetMemoriesRequest;
        
        console.log(`[mem0-proxy] Getting all memories for user: ${userId}`);
        
        const params = new URLSearchParams({
          user_id: userId,
          ...(agentId && { agent_id: agentId }),
          limit: limit.toString(),
        });
        
        response = await fetch(`${MEM0_API_URL}/v1/memories/?${params}`, {
          method: "GET",
          headers: {
            "Authorization": `Token ${MEM0_API_KEY}`,
          },
        });
        break;
      }

      case "delete": {
        const { memoryId } = body as DeleteMemoryRequest;
        
        console.log(`[mem0-proxy] Deleting memory: ${memoryId}`);
        
        response = await fetch(`${MEM0_API_URL}/v1/memories/${memoryId}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Token ${MEM0_API_KEY}`,
          },
        });
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[mem0-proxy] Mem0 API error: ${response.status} - ${errorText}`);
      
      return new Response(
        JSON.stringify({ 
          error: `Mem0 API error: ${response.status}`,
          details: errorText,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    console.log(`[mem0-proxy] Success - returned ${Array.isArray(data) ? data.length : (data.results?.length || 1)} items`);

    return new Response(
      JSON.stringify({ success: true, data: data.results || data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[mem0-proxy] Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
