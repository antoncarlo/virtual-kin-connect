import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-client";
import type { Tables } from "@/integrations/supabase/types";

type Rating = Tables<"ratings">;

export function useRatings() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRating = useCallback(async (
    avatarId: string,
    rating: number,
    feedback?: string,
    sessionId?: string
  ) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("ratings")
        .insert({
          user_id: user.id,
          avatar_id: avatarId,
          rating,
          feedback: feedback || null,
          session_id: sessionId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("Error submitting rating:", err);
      return { data: null, error: err as Error };
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const getAvatarRatings = useCallback(async (avatarId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ratings: [], average: 0 };

      const { data, error } = await supabase
        .from("ratings")
        .select("*")
        .eq("user_id", user.id)
        .eq("avatar_id", avatarId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const average = data.length > 0
        ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
        : 0;

      return { ratings: data, average };
    } catch (err) {
      console.error("Error fetching ratings:", err);
      return { ratings: [], average: 0 };
    }
  }, []);

  return { submitRating, getAvatarRatings, isSubmitting };
}
