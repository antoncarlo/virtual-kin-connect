import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type SessionInsight = Tables<"session_insights">;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface SessionAnalysisResult {
  mood: string;
  intensity: number;
  topics: string[];
  key_insight: string;
  entities_found: {
    people: number;
    events: number;
  };
}

export function useSessionInsights(avatarId?: string) {
  const [insights, setInsights] = useState<SessionInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const sessionStartTime = useRef<Date | null>(null);
  const { toast } = useToast();

  const fetchInsights = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInsights([]);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from("session_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (avatarId) {
        query = query.eq("avatar_id", avatarId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setInsights(data || []);
    } catch (err) {
      console.error("Error fetching session insights:", err);
    } finally {
      setIsLoading(false);
    }
  }, [avatarId]);

  const createInsight = async (insight: Omit<SessionInsight, "id" | "created_at" | "user_id">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("session_insights")
        .insert({
          ...insight,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setInsights((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      console.error("Error creating session insight:", err);
      return { data: null, error: err as Error };
    }
  };

  // Start tracking session time
  const startSession = useCallback(() => {
    sessionStartTime.current = new Date();
    console.log("Session started at:", sessionStartTime.current);
  }, []);

  // Perform post-session analysis
  const analyzeSession = useCallback(async (
    messages: ChatMessage[],
    currentAvatarId: string
  ): Promise<SessionAnalysisResult | null> => {
    if (messages.length < 4) {
      console.log("Session too short for analysis");
      return null;
    }

    setIsAnalyzing(true);

    try {
      const sessionDuration = sessionStartTime.current
        ? Math.floor((new Date().getTime() - sessionStartTime.current.getTime()) / 1000)
        : undefined;

      console.log("Starting session analysis...", {
        messageCount: messages.length,
        duration: sessionDuration,
        avatarId: currentAvatarId,
      });

      const { data, error } = await supabase.functions.invoke("session-analysis", {
        body: {
          messages: messages.filter(m => m.role === "user" || m.role === "assistant"),
          avatarId: currentAvatarId,
          sessionDuration,
        },
      });

      if (error) {
        console.error("Session analysis error:", error);
        return null;
      }

      if (data?.success && data.analysis) {
        console.log("Session analysis complete:", data.analysis);
        
        // Refresh insights after analysis
        await fetchInsights();

        return data.analysis as SessionAnalysisResult;
      }

      return null;
    } catch (err) {
      console.error("Failed to analyze session:", err);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [fetchInsights]);

  // End session and trigger analysis
  const endSession = useCallback(async (
    messages: ChatMessage[],
    currentAvatarId: string
  ) => {
    const result = await analyzeSession(messages, currentAvatarId);
    
    if (result) {
      toast({
        title: "Sessione analizzata 🧠",
        description: `Ho capito meglio come ti senti: ${result.mood}`,
      });
    }

    // Reset session timer
    sessionStartTime.current = null;

    return result;
  }, [analyzeSession, toast]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    isLoading,
    isAnalyzing,
    createInsight,
    refetch: fetchInsights,
    startSession,
    endSession,
    analyzeSession,
  };
}
