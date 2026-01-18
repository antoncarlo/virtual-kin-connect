import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

export interface AvatarIdentity {
  id: string;
  avatar_id: string;
  name: string;
  age: number;
  birthdate: string | null;
  birthplace: string | null;
  education: string | null;
  education_story: string | null;
  past_occupations: string[] | null;
  relationship_status: string | null;
  relationship_story: string | null;
  formative_pain: string | null;
  formative_story: string | null;
  personality_traits: string[];
  favorite_book: string | null;
  favorite_coffee: string | null;
  loves: string[] | null;
  hates: string[] | null;
  speech_patterns: string[] | null;
  forbidden_phrases: string[] | null;
  must_remember: string[] | null;
  deep_secrets: Array<{ level: number; secret: string }>;
}

export interface UserAvatarAffinity {
  id: string;
  user_id: string;
  avatar_id: string;
  affinity_level: number;
  total_messages: number;
  total_call_minutes: number;
  deep_conversations: number;
  unlocked_secrets: string[];
  deep_topics: string[];
}

export function useAvatarIdentity(avatarId: string) {
  const [identity, setIdentity] = useState<AvatarIdentity | null>(null);
  const [affinity, setAffinity] = useState<UserAvatarAffinity | null>(null);
  const [unlockedSecrets, setUnlockedSecrets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchIdentityAndAffinity = async () => {
      try {
        setIsLoading(true);
        
        // Fetch avatar identity
        const { data: identityData, error: identityError } = await supabase
          .from("avatar_identity")
          .select("*")
          .eq("avatar_id", avatarId)
          .single();

        if (identityError && identityError.code !== "PGRST116") {
          throw identityError;
        }

        if (identityData) {
          setIdentity({
            ...identityData,
            personality_traits: identityData.personality_traits as string[] || [],
            deep_secrets: identityData.deep_secrets as Array<{ level: number; secret: string }> || [],
          });
        }

        // Fetch user affinity
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: affinityData, error: affinityError } = await supabase
            .from("user_avatar_affinity")
            .select("*")
            .eq("user_id", user.id)
            .eq("avatar_id", avatarId)
            .single();

          if (affinityError && affinityError.code !== "PGRST116") {
            throw affinityError;
          }

          if (affinityData) {
            setAffinity({
              ...affinityData,
              deep_topics: affinityData.deep_topics as string[] || [],
            });
            
            // Calculate unlocked secrets based on affinity level
            if (identityData?.deep_secrets) {
              const secrets = (identityData.deep_secrets as Array<{ level: number; secret: string }>)
                .filter(s => s.level <= affinityData.affinity_level)
                .map(s => s.secret);
              setUnlockedSecrets(secrets);
            }
          } else {
            // Create initial affinity record
            const { data: newAffinity, error: createError } = await supabase
              .from("user_avatar_affinity")
              .insert({
                user_id: user.id,
                avatar_id: avatarId,
              })
              .select()
              .single();

            if (!createError && newAffinity) {
              setAffinity({
                ...newAffinity,
                deep_topics: newAffinity.deep_topics as string[] || [],
              });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching avatar identity:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    if (avatarId) {
      fetchIdentityAndAffinity();
    }
  }, [avatarId]);

  const updateAffinity = async (updates: Partial<UserAvatarAffinity>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_avatar_affinity")
        .update(updates)
        .eq("user_id", user.id)
        .eq("avatar_id", avatarId)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setAffinity({
          ...data,
          deep_topics: data.deep_topics as string[] || [],
        });
        
        // Recalculate unlocked secrets
        if (identity?.deep_secrets) {
          const secrets = identity.deep_secrets
            .filter(s => s.level <= data.affinity_level)
            .map(s => s.secret);
          setUnlockedSecrets(secrets);
        }
      }
    } catch (err) {
      console.error("Error updating affinity:", err);
    }
  };

  const incrementMessages = async () => {
    if (!affinity) return;
    
    const newTotal = affinity.total_messages + 1;
    const newLevel = calculateAffinityLevel(newTotal, affinity.total_call_minutes);
    
    await updateAffinity({
      total_messages: newTotal,
      affinity_level: newLevel,
    });
  };

  const incrementCallMinutes = async (minutes: number) => {
    if (!affinity) return;
    
    const newTotal = affinity.total_call_minutes + minutes;
    const newLevel = calculateAffinityLevel(affinity.total_messages, newTotal);
    
    await updateAffinity({
      total_call_minutes: newTotal,
      affinity_level: newLevel,
    });
  };

  return {
    identity,
    affinity,
    unlockedSecrets,
    isLoading,
    error,
    updateAffinity,
    incrementMessages,
    incrementCallMinutes,
  };
}

// Calculate affinity level based on interactions
function calculateAffinityLevel(messages: number, callMinutes: number): number {
  const messageScore = messages * 0.1; // 10 messages = 1 point
  const callScore = callMinutes * 0.5; // 2 minutes = 1 point
  const totalScore = messageScore + callScore;
  
  // Level thresholds
  if (totalScore >= 100) return 10;
  if (totalScore >= 75) return 9;
  if (totalScore >= 55) return 8;
  if (totalScore >= 40) return 7;
  if (totalScore >= 28) return 6;
  if (totalScore >= 18) return 5;
  if (totalScore >= 10) return 4;
  if (totalScore >= 5) return 3;
  if (totalScore >= 2) return 2;
  return 1;
}
