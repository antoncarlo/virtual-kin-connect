import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type SessionInsight = Tables<"session_insights">;

export function useSessionInsights(avatarId?: string) {
  const [insights, setInsights] = useState<SessionInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, isLoading, createInsight, refetch: fetchInsights };
}
