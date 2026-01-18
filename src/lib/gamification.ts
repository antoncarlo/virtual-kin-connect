/**
 * Kindred AI - Professional Gamification System
 *
 * Comprehensive gamification with XP, achievements, streaks,
 * levels, challenges, and rewards to boost engagement.
 */

import { supabase } from "@/integrations/supabase/client";

// Types
export type AchievementCategory =
  | 'engagement'
  | 'streak'
  | 'milestone'
  | 'social'
  | 'exploration'
  | 'emotional_growth'
  | 'special';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  xpReward: number;
  tokenReward: number;
  requirement: AchievementRequirement;
  isSecret: boolean;
  unlockedAt?: Date;
}

export interface AchievementRequirement {
  type: 'count' | 'streak' | 'milestone' | 'special';
  metric: string;
  target: number;
  current?: number;
}

export interface UserLevel {
  level: number;
  name: string;
  xpRequired: number;
  xpCurrent: number;
  perks: string[];
  badge: string;
}

export interface Streak {
  type: 'daily' | 'weekly';
  currentCount: number;
  longestCount: number;
  lastActivity: Date;
  isActive: boolean;
  multiplier: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  xpReward: number;
  tokenReward: number;
  requirement: AchievementRequirement;
  expiresAt: Date;
  completedAt?: Date;
}

export interface GamificationProfile {
  userId: string;
  totalXP: number;
  currentLevel: UserLevel;
  tokens: number;
  achievements: Achievement[];
  streaks: {
    daily: Streak;
    weekly: Streak;
  };
  activeChallenges: Challenge[];
  completedChallenges: string[];
  stats: UserStats;
}

export interface UserStats {
  totalMessages: number;
  totalCallMinutes: number;
  totalSessions: number;
  uniqueAvatarsUsed: number;
  goalsCompleted: number;
  memoriesShared: number;
  feedbackGiven: number;
  referralsMade: number;
}

// Level definitions
export const LEVELS: UserLevel[] = [
  { level: 1, name: 'Newcomer', xpRequired: 0, xpCurrent: 0, perks: [], badge: '🌱' },
  { level: 2, name: 'Explorer', xpRequired: 100, xpCurrent: 0, perks: ['Custom themes'], badge: '🌿' },
  { level: 3, name: 'Companion', xpRequired: 300, xpCurrent: 0, perks: ['Extended memory'], badge: '🌳' },
  { level: 4, name: 'Confidant', xpRequired: 600, xpCurrent: 0, perks: ['Priority support'], badge: '🌲' },
  { level: 5, name: 'Soul Friend', xpRequired: 1000, xpCurrent: 0, perks: ['Exclusive avatars'], badge: '🌺' },
  { level: 6, name: 'Guardian', xpRequired: 1500, xpCurrent: 0, perks: ['Voice customization'], badge: '🌸' },
  { level: 7, name: 'Sage', xpRequired: 2200, xpCurrent: 0, perks: ['Advanced insights'], badge: '🌻' },
  { level: 8, name: 'Elder', xpRequired: 3000, xpCurrent: 0, perks: ['Beta features'], badge: '🌹' },
  { level: 9, name: 'Luminary', xpRequired: 4000, xpCurrent: 0, perks: ['Custom avatar'], badge: '🌼' },
  { level: 10, name: 'Kindred Spirit', xpRequired: 5500, xpCurrent: 0, perks: ['All perks', 'Founder badge'], badge: '💫' },
];

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Engagement achievements
  {
    id: 'first_message',
    name: 'First Words',
    description: 'Send your first message',
    category: 'engagement',
    rarity: 'common',
    icon: '💬',
    xpReward: 10,
    tokenReward: 5,
    requirement: { type: 'count', metric: 'messages', target: 1 },
    isSecret: false,
  },
  {
    id: 'chatty_friend',
    name: 'Chatty Friend',
    description: 'Send 100 messages',
    category: 'engagement',
    rarity: 'uncommon',
    icon: '🗣️',
    xpReward: 50,
    tokenReward: 20,
    requirement: { type: 'count', metric: 'messages', target: 100 },
    isSecret: false,
  },
  {
    id: 'conversation_master',
    name: 'Conversation Master',
    description: 'Send 1000 messages',
    category: 'milestone',
    rarity: 'rare',
    icon: '📚',
    xpReward: 200,
    tokenReward: 100,
    requirement: { type: 'count', metric: 'messages', target: 1000 },
    isSecret: false,
  },
  {
    id: 'first_call',
    name: 'Voice Connected',
    description: 'Complete your first voice call',
    category: 'engagement',
    rarity: 'common',
    icon: '📞',
    xpReward: 25,
    tokenReward: 10,
    requirement: { type: 'count', metric: 'calls', target: 1 },
    isSecret: false,
  },
  {
    id: 'video_star',
    name: 'Video Star',
    description: 'Complete your first video call',
    category: 'engagement',
    rarity: 'uncommon',
    icon: '🎥',
    xpReward: 50,
    tokenReward: 25,
    requirement: { type: 'count', metric: 'video_calls', target: 1 },
    isSecret: false,
  },
  {
    id: 'hour_talker',
    name: 'Hour Talker',
    description: 'Spend 60 minutes in calls',
    category: 'milestone',
    rarity: 'uncommon',
    icon: '⏰',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'count', metric: 'call_minutes', target: 60 },
    isSecret: false,
  },

  // Streak achievements
  {
    id: 'streak_3',
    name: 'Getting Started',
    description: 'Maintain a 3-day streak',
    category: 'streak',
    rarity: 'common',
    icon: '🔥',
    xpReward: 30,
    tokenReward: 15,
    requirement: { type: 'streak', metric: 'daily', target: 3 },
    isSecret: false,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    rarity: 'uncommon',
    icon: '🔥',
    xpReward: 75,
    tokenReward: 35,
    requirement: { type: 'streak', metric: 'daily', target: 7 },
    isSecret: false,
  },
  {
    id: 'streak_30',
    name: 'Monthly Devotion',
    description: 'Maintain a 30-day streak',
    category: 'streak',
    rarity: 'rare',
    icon: '🔥',
    xpReward: 300,
    tokenReward: 150,
    requirement: { type: 'streak', metric: 'daily', target: 30 },
    isSecret: false,
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak',
    category: 'streak',
    rarity: 'epic',
    icon: '💎',
    xpReward: 1000,
    tokenReward: 500,
    requirement: { type: 'streak', metric: 'daily', target: 100 },
    isSecret: false,
  },

  // Exploration achievements
  {
    id: 'both_friends',
    name: 'Social Butterfly',
    description: 'Chat with both Marco and Sofia',
    category: 'exploration',
    rarity: 'common',
    icon: '🦋',
    xpReward: 40,
    tokenReward: 20,
    requirement: { type: 'count', metric: 'unique_avatars', target: 2 },
    isSecret: false,
  },
  {
    id: 'memory_keeper',
    name: 'Memory Keeper',
    description: 'Share your first photo memory',
    category: 'exploration',
    rarity: 'common',
    icon: '📸',
    xpReward: 25,
    tokenReward: 10,
    requirement: { type: 'count', metric: 'memories_shared', target: 1 },
    isSecret: false,
  },
  {
    id: 'memory_collector',
    name: 'Memory Collector',
    description: 'Share 10 photo memories',
    category: 'exploration',
    rarity: 'uncommon',
    icon: '🖼️',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'count', metric: 'memories_shared', target: 10 },
    isSecret: false,
  },

  // Emotional growth achievements
  {
    id: 'goal_setter',
    name: 'Goal Setter',
    description: 'Create your first personal goal',
    category: 'emotional_growth',
    rarity: 'common',
    icon: '🎯',
    xpReward: 30,
    tokenReward: 15,
    requirement: { type: 'count', metric: 'goals_created', target: 1 },
    isSecret: false,
  },
  {
    id: 'goal_achiever',
    name: 'Goal Achiever',
    description: 'Complete your first personal goal',
    category: 'emotional_growth',
    rarity: 'uncommon',
    icon: '🏆',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'count', metric: 'goals_completed', target: 1 },
    isSecret: false,
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Complete 10 personal goals',
    category: 'emotional_growth',
    rarity: 'rare',
    icon: '🚀',
    xpReward: 500,
    tokenReward: 200,
    requirement: { type: 'count', metric: 'goals_completed', target: 10 },
    isSecret: false,
  },
  {
    id: 'deep_connection',
    name: 'Deep Connection',
    description: 'Reach affinity level 5 with any avatar',
    category: 'emotional_growth',
    rarity: 'rare',
    icon: '💜',
    xpReward: 250,
    tokenReward: 100,
    requirement: { type: 'milestone', metric: 'max_affinity', target: 5 },
    isSecret: false,
  },
  {
    id: 'soulmate',
    name: 'Soulmate',
    description: 'Reach affinity level 10 with any avatar',
    category: 'emotional_growth',
    rarity: 'legendary',
    icon: '👑',
    xpReward: 1000,
    tokenReward: 500,
    requirement: { type: 'milestone', metric: 'max_affinity', target: 10 },
    isSecret: false,
  },

  // Social achievements
  {
    id: 'referrer',
    name: 'Friend Maker',
    description: 'Refer your first friend',
    category: 'social',
    rarity: 'uncommon',
    icon: '🤝',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'count', metric: 'referrals', target: 1 },
    isSecret: false,
  },
  {
    id: 'super_referrer',
    name: 'Ambassador',
    description: 'Refer 10 friends',
    category: 'social',
    rarity: 'rare',
    icon: '🌟',
    xpReward: 500,
    tokenReward: 250,
    requirement: { type: 'count', metric: 'referrals', target: 10 },
    isSecret: false,
  },
  {
    id: 'feedback_hero',
    name: 'Feedback Hero',
    description: 'Rate 10 conversations',
    category: 'social',
    rarity: 'uncommon',
    icon: '⭐',
    xpReward: 75,
    tokenReward: 30,
    requirement: { type: 'count', metric: 'ratings_given', target: 10 },
    isSecret: false,
  },

  // Secret achievements
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Chat at 3 AM',
    category: 'special',
    rarity: 'rare',
    icon: '🦉',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'special', metric: 'night_chat', target: 1 },
    isSecret: true,
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Chat at 5 AM',
    category: 'special',
    rarity: 'rare',
    icon: '🐦',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'special', metric: 'early_chat', target: 1 },
    isSecret: true,
  },
  {
    id: 'polyglot',
    name: 'Polyglot',
    description: 'Chat in 3 different languages',
    category: 'special',
    rarity: 'epic',
    icon: '🌍',
    xpReward: 300,
    tokenReward: 150,
    requirement: { type: 'count', metric: 'languages_used', target: 3 },
    isSecret: true,
  },
  {
    id: 'founding_member',
    name: 'Founding Member',
    description: 'Join during beta',
    category: 'special',
    rarity: 'legendary',
    icon: '🏅',
    xpReward: 500,
    tokenReward: 250,
    requirement: { type: 'special', metric: 'beta_user', target: 1 },
    isSecret: true,
  },
];

// Daily challenges templates
const DAILY_CHALLENGES: Omit<Challenge, 'id' | 'expiresAt'>[] = [
  {
    name: 'Daily Check-in',
    description: 'Have a conversation today',
    type: 'daily',
    xpReward: 20,
    tokenReward: 5,
    requirement: { type: 'count', metric: 'daily_messages', target: 1 },
  },
  {
    name: 'Talkative',
    description: 'Send 10 messages today',
    type: 'daily',
    xpReward: 30,
    tokenReward: 10,
    requirement: { type: 'count', metric: 'daily_messages', target: 10 },
  },
  {
    name: 'Voice Day',
    description: 'Make a voice call today',
    type: 'daily',
    xpReward: 40,
    tokenReward: 15,
    requirement: { type: 'count', metric: 'daily_calls', target: 1 },
  },
  {
    name: 'Deep Dive',
    description: 'Have a 15-minute conversation',
    type: 'daily',
    xpReward: 50,
    tokenReward: 20,
    requirement: { type: 'count', metric: 'session_minutes', target: 15 },
  },
];

// Weekly challenges templates
const WEEKLY_CHALLENGES: Omit<Challenge, 'id' | 'expiresAt'>[] = [
  {
    name: 'Weekly Warrior',
    description: 'Chat every day this week',
    type: 'weekly',
    xpReward: 150,
    tokenReward: 75,
    requirement: { type: 'streak', metric: 'weekly_days', target: 7 },
  },
  {
    name: 'Social Week',
    description: 'Chat with both avatars this week',
    type: 'weekly',
    xpReward: 100,
    tokenReward: 50,
    requirement: { type: 'count', metric: 'weekly_avatars', target: 2 },
  },
  {
    name: 'Call Master',
    description: 'Spend 30 minutes in calls this week',
    type: 'weekly',
    xpReward: 200,
    tokenReward: 100,
    requirement: { type: 'count', metric: 'weekly_call_minutes', target: 30 },
  },
];

// Gamification Engine
export class GamificationEngine {
  private profiles: Map<string, GamificationProfile> = new Map();

  // Calculate level from XP
  calculateLevel(totalXP: number): UserLevel {
    let level = LEVELS[0];

    for (const l of LEVELS) {
      if (totalXP >= l.xpRequired) {
        level = { ...l, xpCurrent: totalXP - l.xpRequired };
      } else {
        break;
      }
    }

    return level;
  }

  // Get XP needed for next level
  getXPToNextLevel(totalXP: number): number {
    const currentLevel = this.calculateLevel(totalXP);
    const nextLevelIdx = LEVELS.findIndex(l => l.level === currentLevel.level) + 1;

    if (nextLevelIdx >= LEVELS.length) return 0;
    return LEVELS[nextLevelIdx].xpRequired - totalXP;
  }

  // Check achievements based on stats
  checkAchievements(stats: UserStats, existingAchievements: string[]): Achievement[] {
    const newAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (existingAchievements.includes(achievement.id)) continue;

      const { requirement } = achievement;
      let progress = 0;

      switch (requirement.metric) {
        case 'messages':
          progress = stats.totalMessages;
          break;
        case 'calls':
        case 'video_calls':
          progress = stats.totalSessions;
          break;
        case 'call_minutes':
          progress = stats.totalCallMinutes;
          break;
        case 'unique_avatars':
          progress = stats.uniqueAvatarsUsed;
          break;
        case 'memories_shared':
          progress = stats.memoriesShared;
          break;
        case 'goals_created':
        case 'goals_completed':
          progress = stats.goalsCompleted;
          break;
        case 'referrals':
          progress = stats.referralsMade;
          break;
        case 'ratings_given':
          progress = stats.feedbackGiven;
          break;
        default:
          progress = 0;
      }

      if (progress >= requirement.target) {
        newAchievements.push({
          ...achievement,
          unlockedAt: new Date(),
          requirement: { ...requirement, current: progress },
        });
      }
    }

    return newAchievements;
  }

  // Update streak
  updateStreak(streak: Streak): Streak {
    const now = new Date();
    const lastActivity = new Date(streak.lastActivity);

    const daysDiff = Math.floor(
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) {
      // Same day, no change
      return streak;
    } else if (daysDiff === 1) {
      // Consecutive day
      return {
        ...streak,
        currentCount: streak.currentCount + 1,
        longestCount: Math.max(streak.longestCount, streak.currentCount + 1),
        lastActivity: now,
        isActive: true,
        multiplier: Math.min(2, 1 + streak.currentCount * 0.1),
      };
    } else {
      // Streak broken
      return {
        ...streak,
        currentCount: 1,
        lastActivity: now,
        isActive: true,
        multiplier: 1,
      };
    }
  }

  // Generate daily challenges
  generateDailyChallenges(): Challenge[] {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Pick 2 random daily challenges
    const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, 2).map((challenge, idx) => ({
      ...challenge,
      id: `daily_${now.toISOString().split('T')[0]}_${idx}`,
      expiresAt: endOfDay,
    }));
  }

  // Generate weekly challenges
  generateWeeklyChallenges(): Challenge[] {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    // Pick 1 random weekly challenge
    const shuffled = [...WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5);

    return [{
      ...shuffled[0],
      id: `weekly_${now.toISOString().split('T')[0]}`,
      expiresAt: endOfWeek,
    }];
  }

  // Calculate streak bonus XP
  calculateStreakBonus(baseXP: number, streak: Streak): number {
    return Math.floor(baseXP * streak.multiplier);
  }

  // Get streak multiplier based on streak count
  getStreakMultiplier(streakCount: number): number {
    return Math.min(2, 1 + Math.floor(streakCount / 7) * 0.1);
  }
}

// Gamification Service
export class GamificationService {
  private engine: GamificationEngine;

  constructor() {
    this.engine = new GamificationEngine();
  }

  // Award XP to user using database
  async awardXP(
    userId: string,
    amount: number,
    reason: string
  ): Promise<{ newXP: number; levelUp: boolean; newLevel?: UserLevel }> {
    try {
      // Get current XP from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('gamification_xp')
        .eq('user_id', userId)
        .single();

      const currentXP = profile?.gamification_xp || 0;
      const currentLevel = this.engine.calculateLevel(currentXP);

      const newXP = currentXP + amount;
      const newLevel = this.engine.calculateLevel(newXP);
      const levelUp = newLevel.level > currentLevel.level;

      // Update profile with new XP
      await supabase
        .from('profiles')
        .update({
          gamification_xp: newXP,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Log XP gain to xp_log table
      await supabase.from('xp_log').insert({
        user_id: userId,
        amount,
        reason,
        source: 'gamification',
      });

      return { newXP, levelUp, newLevel: levelUp ? newLevel : undefined };
    } catch (error) {
      console.error('Failed to award XP:', error);
      return { newXP: 0, levelUp: false };
    }
  }

  // Award tokens to user
  async awardTokens(userId: string, amount: number, reason: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('tokens_balance')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      const newBalance = (data?.tokens_balance || 0) + amount;

      await supabase
        .from('profiles')
        .update({
          tokens_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      await this.logTokenGain(userId, amount, reason);

      return newBalance;
    } catch (error) {
      console.error('Failed to award tokens:', error);
      return 0;
    }
  }

  // Unlock achievement using database
  async unlockAchievement(userId: string, achievementId: string): Promise<Achievement | null> {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return null;

    try {
      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .maybeSingle();

      if (existing) return null; // Already unlocked

      // Insert achievement
      await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date().toISOString(),
      });

      // Award rewards
      if (achievement.xpReward > 0) {
        await this.awardXP(userId, achievement.xpReward, `Achievement: ${achievement.name}`);
      }
      if (achievement.tokenReward > 0) {
        await this.awardTokens(userId, achievement.tokenReward, `Achievement: ${achievement.name}`);
      }

      return { ...achievement, unlockedAt: new Date() };
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
      return null;
    }
  }

  // Update user streak using database
  async updateUserStreak(userId: string): Promise<Streak> {
    try {
      // Get current streak from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_streak, longest_streak, last_activity')
        .eq('user_id', userId)
        .single();

      const now = new Date();
      const lastActivity = profile?.last_activity ? new Date(profile.last_activity) : null;
      const hoursSinceActivity = lastActivity 
        ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
        : 999;

      let newStreak = profile?.daily_streak || 0;
      let longestStreak = profile?.longest_streak || 0;

      // If last activity was within 48 hours, continue streak
      if (hoursSinceActivity < 48 && hoursSinceActivity >= 24) {
        newStreak += 1;
      } else if (hoursSinceActivity >= 48) {
        newStreak = 1; // Reset streak
      }
      // If within 24 hours, don't increment (already counted today)

      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      // Update profile
      await supabase
        .from('profiles')
        .update({
          daily_streak: newStreak,
          longest_streak: longestStreak,
          last_activity: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('user_id', userId);

      const currentStreak: Streak = {
        type: 'daily',
        currentCount: newStreak,
        longestCount: longestStreak,
        lastActivity: now,
        isActive: true,
        multiplier: this.engine.getStreakMultiplier(newStreak),
      };

      const updatedStreak = this.engine.updateStreak(currentStreak);

      // Update profile timestamp
      await supabase
        .from('profiles')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Check for streak achievements
      await this.checkStreakAchievements(userId, updatedStreak.currentCount);

      return updatedStreak;
    } catch (error) {
      console.error('Failed to update streak:', error);
      return {
        type: 'daily',
        currentCount: 1,
        longestCount: 1,
        lastActivity: new Date(),
        isActive: true,
        multiplier: 1,
      };
    }
  }

  // Get user gamification profile
  async getUserProfile(userId: string): Promise<Partial<GamificationProfile>> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tokens_balance')
        .eq('user_id', userId)
        .single();

      // Since gamification columns don't exist, use defaults
      const totalXP = 0;

      return {
        userId,
        totalXP,
        currentLevel: this.engine.calculateLevel(totalXP),
        tokens: profile?.tokens_balance || 0,
        achievements: [],
        streaks: {
          daily: {
            type: 'daily',
            currentCount: 0,
            longestCount: 0,
            lastActivity: new Date(),
            isActive: true,
            multiplier: 1,
          },
          weekly: {
            type: 'weekly',
            currentCount: 0,
            longestCount: 0,
            lastActivity: new Date(),
            isActive: false,
            multiplier: 1,
          },
        },
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return { userId };
    }
  }

  // Get active challenges
  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    // For now, generate fresh challenges daily
    const daily = this.engine.generateDailyChallenges();
    const weekly = this.engine.generateWeeklyChallenges();
    return [...daily, ...weekly];
  }

  // Complete a challenge
  async completeChallenge(userId: string, challengeId: string): Promise<boolean> {
    const challenges = await this.getActiveChallenges(userId);
    const challenge = challenges.find(c => c.id === challengeId);

    if (!challenge) return false;

    // Award rewards
    if (challenge.xpReward > 0) {
      await this.awardXP(userId, challenge.xpReward, `Challenge: ${challenge.name}`);
    }
    if (challenge.tokenReward > 0) {
      await this.awardTokens(userId, challenge.tokenReward, `Challenge: ${challenge.name}`);
    }

    return true;
  }

  private async checkStreakAchievements(userId: string, streak: number): Promise<void> {
    const streakAchievements = [
      { streak: 3, id: 'streak_3' },
      { streak: 7, id: 'streak_7' },
      { streak: 30, id: 'streak_30' },
      { streak: 100, id: 'streak_100' },
    ];

    for (const { streak: target, id } of streakAchievements) {
      if (streak >= target) {
        await this.unlockAchievement(userId, id);
      }
    }
  }

  private async logXPGain(userId: string, amount: number, reason: string): Promise<void> {
    console.log(`[Gamification] User ${userId} gained ${amount} XP: ${reason}`);
  }

  private async logTokenGain(userId: string, amount: number, reason: string): Promise<void> {
    console.log(`[Gamification] User ${userId} gained ${amount} tokens: ${reason}`);
  }
}

// Singleton instance
let gamificationInstance: GamificationService | null = null;

export function getGamification(): GamificationService {
  if (!gamificationInstance) {
    gamificationInstance = new GamificationService();
  }
  return gamificationInstance;
}

// Helper hooks
export async function recordActivity(
  userId: string,
  activityType: 'message' | 'call' | 'video_call' | 'goal_completed' | 'memory_shared'
): Promise<void> {
  const service = getGamification();

  // Update streak
  await service.updateUserStreak(userId);

  // Award base XP based on activity
  const xpRewards: Record<string, number> = {
    message: 2,
    call: 10,
    video_call: 15,
    goal_completed: 50,
    memory_shared: 5,
  };

  const baseXP = xpRewards[activityType] || 1;
  await service.awardXP(userId, baseXP, `Activity: ${activityType}`);
}
