/**
 * useGamification Hook
 * Provides gamification data and actions for the UI
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  getGamification,
  LEVELS,
  ACHIEVEMENTS,
  type GamificationProfile,
  type Achievement,
  type Challenge,
  type Streak,
  type UserLevel,
} from "@/lib/gamification";
import { getGrowthService } from "@/lib/growth-strategy";
import { useToast } from "@/hooks/use-toast";

interface UseGamificationReturn {
  // Loading states
  isLoading: boolean;
  error: Error | null;

  // User data
  totalXP: number;
  currentLevel: UserLevel;
  tokens: number;
  streak: Streak;
  achievements: Array<{ id: string; unlockedAt: Date }>;
  challenges: Challenge[];

  // Referral data
  referralCode: string;
  referralStats: {
    totalReferrals: number;
    convertedReferrals: number;
    totalEarned: number;
    currentTier: { minReferrals: number; tokensPerReferral: number; bonusMultiplier: number };
    nextTier?: { minReferrals: number; tokensPerReferral: number; bonusMultiplier: number };
  };

  // User stats for achievement progress
  userStats: {
    totalMessages: number;
    totalCallMinutes: number;
    goalsCompleted: number;
    memoriesShared: number;
  };

  // Actions
  refreshData: () => Promise<void>;
  awardXP: (amount: number, reason: string) => Promise<{ levelUp: boolean; newLevel?: UserLevel }>;
  checkAchievements: () => Promise<Achievement[]>;
  updateStreak: () => Promise<Streak>;
  completeChallenge: (challengeId: string) => Promise<boolean>;
}

export function useGamification(): UseGamificationReturn {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // State
  const [totalXP, setTotalXP] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [achievements, setAchievements] = useState<Array<{ id: string; unlockedAt: Date }>>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [streak, setStreak] = useState<Streak>({
    type: 'daily',
    currentCount: 0,
    longestCount: 0,
    lastActivity: new Date(),
    isActive: false,
    multiplier: 1,
  });
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    convertedReferrals: 0,
    totalEarned: 0,
    currentTier: { minReferrals: 0, tokensPerReferral: 50, bonusMultiplier: 1 },
    nextTier: { minReferrals: 3, tokensPerReferral: 75, bonusMultiplier: 1.25 } as { minReferrals: number; tokensPerReferral: number; bonusMultiplier: number } | undefined,
  });
  const [userStats, setUserStats] = useState({
    totalMessages: 0,
    totalCallMinutes: 0,
    goalsCompleted: 0,
    memoriesShared: 0,
  });

  // Calculate level from XP
  const calculateLevel = useCallback((xp: number): UserLevel => {
    let level = LEVELS[0];
    for (const l of LEVELS) {
      if (xp >= l.xpRequired) {
        level = { ...l, xpCurrent: xp - l.xpRequired };
      } else {
        break;
      }
    }
    return level;
  }, []);

  const currentLevel = calculateLevel(totalXP);

  // Load data from database
  const loadData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      const userId = session.user.id;

      // Load profile data with gamification columns
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tokens_balance, display_name, gamification_xp, daily_streak, longest_streak, last_activity')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      if (profile) {
        setTokens(profile.tokens_balance || 0);
        setTotalXP(profile.gamification_xp || 0);
        setStreak({
          type: 'daily',
          currentCount: profile.daily_streak || 0,
          longestCount: profile.longest_streak || 0,
          lastActivity: profile.last_activity ? new Date(profile.last_activity) : new Date(),
          isActive: true,
          multiplier: 1 + Math.floor((profile.daily_streak || 0) / 7) * 0.1,
        });
      }

      // Load achievements from user_achievements table
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      if (userAchievements) {
        const loadedAchievements = userAchievements.map(ua => ({
          id: ua.achievement_id,
          unlockedAt: ua.unlocked_at ? new Date(ua.unlocked_at) : new Date(),
        }));
        setAchievements(loadedAchievements as any);
      }

      // Load user stats for achievement progress
      const [messagesResult, memoriesResult, goalsResult] = await Promise.all([
        supabase.from('chat_messages').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('shared_memories').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('temporal_goals').select('id', { count: 'exact' }).eq('user_id', userId).eq('status', 'completed'),
      ]);

      setUserStats({
        totalMessages: messagesResult.count || 0,
        totalCallMinutes: 0, // TODO: Calculate from call logs
        goalsCompleted: goalsResult.count || 0,
        memoriesShared: memoriesResult.count || 0,
      });

      // Load referral stats
      const growthService = getGrowthService();
      const refStats = await growthService.getReferralStats(userId);
      setReferralCode(refStats.code);
      setReferralStats({
        totalReferrals: refStats.totalReferrals,
        convertedReferrals: refStats.convertedReferrals,
        totalEarned: refStats.totalEarned,
        currentTier: refStats.currentTier,
        nextTier: refStats.nextTier,
      });

      // Generate daily challenges
      const gamificationService = getGamification();
      const dailyChallenges = await gamificationService.getActiveChallenges(userId);
      setChallenges(dailyChallenges);

    } catch (err) {
      console.error('Failed to load gamification data:', err);
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Award XP
  const awardXP = useCallback(async (amount: number, reason: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return { levelUp: false };

      const gamificationService = getGamification();
      const result = await gamificationService.awardXP(session.user.id, amount, reason);

      if (result.levelUp && result.newLevel) {
        toast({
          title: `🎉 Livello ${result.newLevel.level}!`,
          description: `Sei diventato ${result.newLevel.name}!`,
        });
      }

      setTotalXP(result.newXP);
      return { levelUp: result.levelUp, newLevel: result.newLevel };
    } catch (err) {
      console.error('Failed to award XP:', err);
      return { levelUp: false };
    }
  }, [toast]);

  // Check and unlock achievements
  const checkAchievements = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      const gamificationService = getGamification();
      const unlockedIds = achievements.map(a => a.id);

      // Check each achievement
      const newlyUnlocked: Achievement[] = [];

      for (const achievement of ACHIEVEMENTS) {
        if (unlockedIds.includes(achievement.id)) continue;
        if (achievement.isSecret) continue;

        const { requirement } = achievement;
        let progress = 0;

        switch (requirement.metric) {
          case 'messages':
            progress = userStats.totalMessages;
            break;
          case 'goals_completed':
            progress = userStats.goalsCompleted;
            break;
          case 'memories_shared':
            progress = userStats.memoriesShared;
            break;
          case 'daily':
            progress = streak.currentCount;
            break;
        }

        if (progress >= requirement.target) {
          const unlocked = await gamificationService.unlockAchievement(session.user.id, achievement.id);
          if (unlocked) {
            newlyUnlocked.push(unlocked);
            toast({
              title: `🏆 Achievement Sbloccato!`,
              description: `${unlocked.icon} ${unlocked.name} - ${unlocked.description}`,
            });
          }
        }
      }

      if (newlyUnlocked.length > 0) {
        await loadData();
      }

      return newlyUnlocked;
    } catch (err) {
      console.error('Failed to check achievements:', err);
      return [];
    }
  }, [achievements, userStats, streak, toast, loadData]);

  // Update streak
  const updateStreak = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return streak;

      const gamificationService = getGamification();
      const newStreak = await gamificationService.updateUserStreak(session.user.id);

      setStreak(newStreak);

      // Check for streak achievements
      if (newStreak.currentCount > streak.currentCount) {
        await checkAchievements();
      }

      return newStreak;
    } catch (err) {
      console.error('Failed to update streak:', err);
      return streak;
    }
  }, [streak, checkAchievements]);

  // Complete challenge
  const completeChallenge = useCallback(async (challengeId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return false;

      const gamificationService = getGamification();
      const success = await gamificationService.completeChallenge(session.user.id, challengeId);

      if (success) {
        await loadData();
        toast({
          title: "🎯 Sfida Completata!",
          description: "Hai guadagnato i tuoi premi!",
        });
      }

      return success;
    } catch (err) {
      console.error('Failed to complete challenge:', err);
      return false;
    }
  }, [loadData, toast]);

  return {
    isLoading,
    error,
    totalXP,
    currentLevel,
    tokens,
    streak,
    achievements,
    challenges,
    referralCode,
    referralStats,
    userStats,
    refreshData: loadData,
    awardXP,
    checkAchievements,
    updateStreak,
    completeChallenge,
  };
}
