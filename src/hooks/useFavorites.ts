import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setFavorites([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("favorites")
        .select("avatar_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setFavorites(data?.map((f) => f.avatar_id) || []);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleFavorite = async (avatarId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const isFavorite = favorites.includes(avatarId);

      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("avatar_id", avatarId);

        if (error) throw error;
        setFavorites((prev) => prev.filter((id) => id !== avatarId));
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, avatar_id: avatarId });

        if (error) throw error;
        setFavorites((prev) => [...prev, avatarId]);
      }

      return { success: true };
    } catch (err) {
      console.error("Error toggling favorite:", err);
      return { success: false, error: err };
    }
  };

  const isFavorite = (avatarId: string) => favorites.includes(avatarId);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return { favorites, isLoading, toggleFavorite, isFavorite, refetch: fetchFavorites };
}
