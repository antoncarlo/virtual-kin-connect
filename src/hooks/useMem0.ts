/**
 * useMem0 Hook
 *
 * React hook for interacting with Mem0 memory system.
 * Provides memory operations with automatic user context.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import {
  getMem0Client,
  Mem0Client,
  Memory,
  formatMemoriesForContext,
} from "@/lib/mem0";

interface UseMem0Options {
  avatarId?: string;
  autoLoad?: boolean;
  cacheTime?: number; // Cache memories for this many ms
}

interface UseMem0Return {
  // State
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  memories: Memory[];

  // Formatted context for LLM
  memoryContext: string;

  // Actions
  addMemories: (
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    metadata?: Record<string, any>
  ) => Promise<Memory[]>;
  searchMemories: (
    query: string,
    options?: { limit?: number; threshold?: number }
  ) => Promise<Memory[]>;
  refreshMemories: () => Promise<void>;
  deleteMemory: (memoryId: string) => Promise<boolean>;
  getRelevantContext: (query: string, limit?: number) => Promise<string>;
}

export function useMem0(options: UseMem0Options = {}): UseMem0Return {
  const { avatarId, autoLoad = true, cacheTime = 60000 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryContext, setMemoryContext] = useState("");

  const clientRef = useRef<Mem0Client | null>(null);
  const lastLoadRef = useRef<number>(0);
  const userIdRef = useRef<string | null>(null);

  // Initialize Mem0 client
  useEffect(() => {
    const initializeClient = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id) {
          return;
        }

        userIdRef.current = session.user.id;

        const client = getMem0Client({
          userId: session.user.id,
          agentId: avatarId,
        });

        await client.initialize(session.user.id, avatarId);
        clientRef.current = client;
        setIsInitialized(true);

        if (autoLoad) {
          await loadMemories();
        }
      } catch (err) {
        console.error("Failed to initialize Mem0:", err);
        setError(err instanceof Error ? err : new Error("Failed to initialize"));
      }
    };

    initializeClient();
  }, [avatarId, autoLoad]);

  // Load memories from Mem0
  const loadMemories = useCallback(async () => {
    if (!clientRef.current || !userIdRef.current) return;

    // Check cache
    const now = Date.now();
    if (now - lastLoadRef.current < cacheTime && memories.length > 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await clientRef.current.getMemories({ limit: 100 });

      if (result.success && result.data) {
        setMemories(result.data);
        setMemoryContext(formatMemoriesForContext(result.data));
        lastLoadRef.current = now;
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error("Failed to load memories:", err);
      setError(err instanceof Error ? err : new Error("Failed to load memories"));
    } finally {
      setIsLoading(false);
    }
  }, [cacheTime, memories.length]);

  // Add memories from conversation
  const addMemories = useCallback(
    async (
      messages: Array<{ role: "user" | "assistant"; content: string }>,
      metadata?: Record<string, any>
    ): Promise<Memory[]> => {
      if (!clientRef.current) {
        throw new Error("Mem0 client not initialized");
      }

      setIsLoading(true);

      try {
        const result = await clientRef.current.addMemories(messages, {
          ...metadata,
          avatar_id: avatarId,
        });

        if (result.success && result.data) {
          // Refresh local cache
          await loadMemories();
          return result.data;
        }

        if (result.error) {
          throw new Error(result.error);
        }

        return [];
      } catch (err) {
        console.error("Failed to add memories:", err);
        setError(err instanceof Error ? err : new Error("Failed to add memories"));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [avatarId, loadMemories]
  );

  // Search memories semantically
  const searchMemories = useCallback(
    async (
      query: string,
      searchOptions: { limit?: number; threshold?: number } = {}
    ): Promise<Memory[]> => {
      if (!clientRef.current) {
        throw new Error("Mem0 client not initialized");
      }

      try {
        const result = await clientRef.current.searchMemories(query, searchOptions);

        if (result.success && result.data) {
          return result.data;
        }

        if (result.error) {
          throw new Error(result.error);
        }

        return [];
      } catch (err) {
        console.error("Failed to search memories:", err);
        setError(err instanceof Error ? err : new Error("Failed to search memories"));
        throw err;
      }
    },
    []
  );

  // Delete a memory
  const deleteMemory = useCallback(
    async (memoryId: string): Promise<boolean> => {
      if (!clientRef.current) {
        throw new Error("Mem0 client not initialized");
      }

      try {
        const result = await clientRef.current.deleteMemory(memoryId);

        if (result.success) {
          // Remove from local state
          setMemories((prev) => prev.filter((m) => m.id !== memoryId));
          return true;
        }

        if (result.error) {
          throw new Error(result.error);
        }

        return false;
      } catch (err) {
        console.error("Failed to delete memory:", err);
        setError(err instanceof Error ? err : new Error("Failed to delete memory"));
        throw err;
      }
    },
    []
  );

  // Get relevant context for a query (for LLM injection)
  const getRelevantContext = useCallback(
    async (query: string, limit: number = 5): Promise<string> => {
      try {
        const relevantMemories = await searchMemories(query, { limit });
        return formatMemoriesForContext(relevantMemories);
      } catch {
        // Fallback to cached memories
        return memoryContext;
      }
    },
    [searchMemories, memoryContext]
  );

  // Refresh memories manually
  const refreshMemories = useCallback(async () => {
    lastLoadRef.current = 0; // Clear cache
    await loadMemories();
  }, [loadMemories]);

  return {
    isLoading,
    isInitialized,
    error,
    memories,
    memoryContext,
    addMemories,
    searchMemories,
    refreshMemories,
    deleteMemory,
    getRelevantContext,
  };
}
