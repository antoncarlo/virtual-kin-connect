/**
 * Mem0 Integration for Kindred AI
 *
 * Mem0 is an intelligent memory layer that enables personalized AI interactions.
 * It extracts facts from conversations, generates embeddings, and provides
 * semantic search capabilities.
 *
 * @see https://github.com/mem0ai/mem0
 */

import { supabase } from "@/integrations/supabase/client";

// Mem0 API configuration
const MEM0_API_URL = "https://api.mem0.ai/v1";

export interface Mem0Config {
  apiKey: string;
  userId: string;
  agentId?: string; // Maps to avatar_id in Kindred AI
  sessionId?: string;
}

export interface Memory {
  id: string;
  content: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  categories?: string[];
  relevance_score?: number;
}

export interface AddMemoryRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userId: string;
  agentId?: string;
  metadata?: Record<string, any>;
}

export interface SearchMemoryRequest {
  query: string;
  userId: string;
  agentId?: string;
  limit?: number;
  threshold?: number;
}

export interface Mem0Response<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Mem0 Client for Kindred AI
 *
 * Provides a unified interface for memory operations that works both
 * with Mem0 cloud API and falls back to local Supabase storage.
 */
export class Mem0Client {
  private apiKey: string | null = null;
  private userId: string;
  private agentId?: string;
  private useCloudApi: boolean = false;

  constructor(config: Partial<Mem0Config> = {}) {
    this.userId = config.userId || "";
    this.agentId = config.agentId;

    // Check for Mem0 API key (can be stored in environment or fetched)
    this.apiKey = import.meta.env?.VITE_MEM0_API_KEY || null;
    this.useCloudApi = !!this.apiKey;
  }

  /**
   * Initialize the client with user context
   */
  async initialize(userId: string, agentId?: string): Promise<void> {
    this.userId = userId;
    this.agentId = agentId;

    // Try to fetch API key from Supabase secrets if not in env
    if (!this.apiKey) {
      try {
        const { data } = await supabase.functions.invoke("get-secret", {
          body: { key: "MEM0_API_KEY" },
        });
        if (data?.value) {
          this.apiKey = data.value;
          this.useCloudApi = true;
        }
      } catch {
        console.log("Mem0 API key not found, using local storage fallback");
      }
    }
  }

  /**
   * Add memories from a conversation
   * Extracts facts and stores them with semantic embeddings
   */
  async addMemories(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    metadata?: Record<string, any>
  ): Promise<Mem0Response<Memory[]>> {
    try {
      if (this.useCloudApi && this.apiKey) {
        return await this.addMemoriesCloud(messages, metadata);
      }
      return await this.addMemoriesLocal(messages, metadata);
    } catch (error) {
      console.error("Mem0 addMemories error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add memories",
      };
    }
  }

  /**
   * Search memories by semantic similarity
   */
  async searchMemories(
    query: string,
    options: { limit?: number; threshold?: number } = {}
  ): Promise<Mem0Response<Memory[]>> {
    try {
      if (this.useCloudApi && this.apiKey) {
        return await this.searchMemoriesCloud(query, options);
      }
      return await this.searchMemoriesLocal(query, options);
    } catch (error) {
      console.error("Mem0 searchMemories error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search memories",
      };
    }
  }

  /**
   * Get all memories for the current user/agent
   */
  async getMemories(
    options: { limit?: number; offset?: number } = {}
  ): Promise<Mem0Response<Memory[]>> {
    try {
      if (this.useCloudApi && this.apiKey) {
        return await this.getMemoriesCloud(options);
      }
      return await this.getMemoriesLocal(options);
    } catch (error) {
      console.error("Mem0 getMemories error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get memories",
      };
    }
  }

  /**
   * Delete a specific memory
   */
  async deleteMemory(memoryId: string): Promise<Mem0Response<void>> {
    try {
      if (this.useCloudApi && this.apiKey) {
        return await this.deleteMemoryCloud(memoryId);
      }
      return await this.deleteMemoryLocal(memoryId);
    } catch (error) {
      console.error("Mem0 deleteMemory error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete memory",
      };
    }
  }

  /**
   * Get memory history (changes over time)
   */
  async getMemoryHistory(memoryId: string): Promise<Mem0Response<Memory[]>> {
    try {
      if (this.useCloudApi && this.apiKey) {
        return await this.getMemoryHistoryCloud(memoryId);
      }
      // Local storage doesn't support history, return empty
      return { success: true, data: [] };
    } catch (error) {
      console.error("Mem0 getMemoryHistory error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get history",
      };
    }
  }

  // ========== Cloud API Methods ==========

  private async addMemoriesCloud(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    metadata?: Record<string, any>
  ): Promise<Mem0Response<Memory[]>> {
    const response = await fetch(`${MEM0_API_URL}/memories/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        user_id: this.userId,
        agent_id: this.agentId,
        metadata: {
          ...metadata,
          source: "kindred_ai",
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mem0 API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    // Also sync to local storage for redundancy
    await this.syncToLocal(data.results || []);

    return { success: true, data: data.results || [] };
  }

  private async searchMemoriesCloud(
    query: string,
    options: { limit?: number; threshold?: number }
  ): Promise<Mem0Response<Memory[]>> {
    const params = new URLSearchParams({
      query,
      user_id: this.userId,
      ...(this.agentId && { agent_id: this.agentId }),
      ...(options.limit && { limit: options.limit.toString() }),
    });

    const response = await fetch(`${MEM0_API_URL}/memories/search/?${params}`, {
      method: "GET",
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mem0 search error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data.results || [] };
  }

  private async getMemoriesCloud(
    options: { limit?: number; offset?: number }
  ): Promise<Mem0Response<Memory[]>> {
    const params = new URLSearchParams({
      user_id: this.userId,
      ...(this.agentId && { agent_id: this.agentId }),
      ...(options.limit && { limit: options.limit.toString() }),
      ...(options.offset && { offset: options.offset.toString() }),
    });

    const response = await fetch(`${MEM0_API_URL}/memories/?${params}`, {
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mem0 get error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data.results || [] };
  }

  private async deleteMemoryCloud(memoryId: string): Promise<Mem0Response<void>> {
    const response = await fetch(`${MEM0_API_URL}/memories/${memoryId}/`, {
      method: "DELETE",
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mem0 delete error: ${response.status}`);
    }

    return { success: true };
  }

  private async getMemoryHistoryCloud(memoryId: string): Promise<Mem0Response<Memory[]>> {
    const response = await fetch(`${MEM0_API_URL}/memories/${memoryId}/history/`, {
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Mem0 history error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data: data.results || [] };
  }

  // ========== Local Storage Fallback Methods ==========

  private async addMemoriesLocal(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    metadata?: Record<string, any>
  ): Promise<Mem0Response<Memory[]>> {
    // Call existing knowledge-extractor function
    const { data, error } = await supabase.functions.invoke("knowledge-extractor", {
      body: {
        messages,
        avatarId: this.agentId || "default",
      },
    });

    if (error) {
      throw error;
    }

    // Extract facts using local AI and store in user_context
    const memories: Memory[] = [];

    // Also call session-analysis for richer extraction
    if (messages.length >= 4) {
      await supabase.functions.invoke("session-analysis", {
        body: {
          messages,
          avatarId: this.agentId || "default",
        },
      });
    }

    return { success: true, data: memories };
  }

  private async searchMemoriesLocal(
    query: string,
    options: { limit?: number; threshold?: number }
  ): Promise<Mem0Response<Memory[]>> {
    const limit = options.limit || 10;

    // Search user_context table
    const { data: contextData, error: contextError } = await supabase
      .from("user_context")
      .select("*")
      .eq("user_id", this.userId)
      .ilike("value", `%${query}%`)
      .limit(limit);

    if (contextError) {
      throw contextError;
    }

    // Search knowledge_base
    const { data: kbData, error: kbError } = await supabase
      .from("knowledge_base")
      .select("*")
      .ilike("content", `%${query}%`)
      .limit(limit);

    if (kbError) {
      throw kbError;
    }

    // Convert to Memory format
    const memories: Memory[] = [
      ...(contextData || []).map((ctx: any) => ({
        id: ctx.id,
        content: typeof ctx.value === "string" ? ctx.value : JSON.stringify(ctx.value),
        metadata: {
          type: ctx.context_type,
          key: ctx.key,
          confidence: ctx.confidence,
          avatar_id: ctx.avatar_id,
        },
        created_at: ctx.created_at,
        updated_at: ctx.updated_at,
        categories: [ctx.context_type],
      })),
      ...(kbData || []).map((kb: any) => ({
        id: kb.id,
        content: kb.content,
        metadata: {
          type: "knowledge",
          category: kb.category,
          source: kb.source_type,
        },
        created_at: kb.created_at,
        updated_at: kb.updated_at,
        categories: [kb.category],
      })),
    ];

    return { success: true, data: memories };
  }

  private async getMemoriesLocal(
    options: { limit?: number; offset?: number }
  ): Promise<Mem0Response<Memory[]>> {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const { data, error } = await supabase
      .from("user_context")
      .select("*")
      .eq("user_id", this.userId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const memories: Memory[] = (data || []).map((ctx: any) => ({
      id: ctx.id,
      content: typeof ctx.value === "string" ? ctx.value : JSON.stringify(ctx.value),
      metadata: {
        type: ctx.context_type,
        key: ctx.key,
        confidence: ctx.confidence,
        avatar_id: ctx.avatar_id,
      },
      created_at: ctx.created_at,
      updated_at: ctx.updated_at,
      categories: [ctx.context_type],
    }));

    return { success: true, data: memories };
  }

  private async deleteMemoryLocal(memoryId: string): Promise<Mem0Response<void>> {
    const { error } = await supabase
      .from("user_context")
      .delete()
      .eq("id", memoryId)
      .eq("user_id", this.userId);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /**
   * Sync cloud memories to local storage for redundancy
   */
  private async syncToLocal(memories: Memory[]): Promise<void> {
    for (const memory of memories) {
      try {
        await supabase.from("user_context").upsert({
          user_id: this.userId,
          avatar_id: this.agentId || "default",
          context_type: memory.categories?.[0] || "mem0",
          key: `mem0_${memory.id}`,
          value: memory.content,
          confidence: memory.relevance_score || 0.8,
          is_cross_avatar: true,
          privacy_level: "cross_avatar",
          updated_at: memory.updated_at,
        }, { onConflict: "user_id,avatar_id,context_type,key" });
      } catch (err) {
        console.error("Failed to sync memory to local:", err);
      }
    }
  }
}

// Singleton instance
let mem0Instance: Mem0Client | null = null;

/**
 * Get or create Mem0 client instance
 */
export function getMem0Client(config?: Partial<Mem0Config>): Mem0Client {
  if (!mem0Instance) {
    mem0Instance = new Mem0Client(config);
  }
  return mem0Instance;
}

/**
 * Format memories for LLM context injection
 */
export function formatMemoriesForContext(memories: Memory[]): string {
  if (memories.length === 0) return "";

  const sections: Record<string, string[]> = {
    personal: [],
    preference: [],
    emotional_state: [],
    memory_anchor: [],
    other: [],
  };

  for (const memory of memories) {
    const category = memory.categories?.[0] || "other";
    const section = sections[category] || sections.other;
    section.push(`- ${memory.content}`);
  }

  let context = "## Ricordi dell'utente:\n\n";

  if (sections.personal.length > 0) {
    context += "### Informazioni personali:\n" + sections.personal.join("\n") + "\n\n";
  }
  if (sections.preference.length > 0) {
    context += "### Preferenze:\n" + sections.preference.join("\n") + "\n\n";
  }
  if (sections.emotional_state.length > 0) {
    context += "### Stato emotivo recente:\n" + sections.emotional_state.join("\n") + "\n\n";
  }
  if (sections.memory_anchor.length > 0) {
    context += "### Eventi e persone importanti:\n" + sections.memory_anchor.join("\n") + "\n\n";
  }
  if (sections.other.length > 0) {
    context += "### Altri ricordi:\n" + sections.other.join("\n") + "\n\n";
  }

  return context;
}
