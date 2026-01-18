/**
 * Kindred AI - Professional Growth Strategy System
 *
 * Handles referrals, viral mechanics, user acquisition,
 * onboarding optimization, and retention strategies.
 */

import { supabase } from "@/lib/supabase-client";

// Types
export type ReferralStatus = 'pending' | 'registered' | 'activated' | 'converted';
export type CampaignType = 'referral' | 'social' | 'email' | 'partnership' | 'organic';
export type UserSegment = 'new' | 'casual' | 'engaged' | 'power' | 'churning' | 'dormant';

export interface Referral {
  id: string;
  referrerId: string;
  referredEmail?: string;
  referredUserId?: string;
  referralCode: string;
  status: ReferralStatus;
  rewardsClaimed: boolean;
  referrerReward: number;
  referredReward: number;
  createdAt: Date;
  activatedAt?: Date;
  convertedAt?: Date;
}

export interface ReferralRewards {
  referrerTokens: number;
  referrerXP: number;
  referredTokens: number;
  referredXP: number;
  bonusMultiplier: number;
}

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  code: string;
  rewards: ReferralRewards;
  startDate: Date;
  endDate?: Date;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
}

export interface UserGrowthMetrics {
  userId: string;
  segment: UserSegment;
  acquisitionSource: CampaignType;
  referralCode?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  firstMessageAt?: Date;
  firstCallAt?: Date;
  activationDate?: Date;
  lastActiveDate: Date;
  totalSessions: number;
  retentionDays: number;
  lifetimeValue: number;
  referralsMade: number;
  referralsConverted: number;
}

export interface ShareableContent {
  type: 'insight' | 'achievement' | 'milestone' | 'quote';
  title: string;
  description: string;
  imageUrl?: string;
  shareUrl: string;
  hashtags: string[];
}

// Referral reward tiers
const REFERRAL_TIERS = [
  { minReferrals: 0, tokensPerReferral: 50, xpPerReferral: 100, bonusMultiplier: 1.0 },
  { minReferrals: 3, tokensPerReferral: 75, xpPerReferral: 150, bonusMultiplier: 1.25 },
  { minReferrals: 10, tokensPerReferral: 100, xpPerReferral: 200, bonusMultiplier: 1.5 },
  { minReferrals: 25, tokensPerReferral: 150, xpPerReferral: 300, bonusMultiplier: 2.0 },
  { minReferrals: 50, tokensPerReferral: 200, xpPerReferral: 500, bonusMultiplier: 2.5 },
];

// Onboarding steps
export const ONBOARDING_STEPS = [
  { step: 1, name: 'welcome', description: 'Welcome to Kindred', required: true },
  { step: 2, name: 'profile', description: 'Set up your profile', required: true },
  { step: 3, name: 'avatar_selection', description: 'Choose your companion', required: true },
  { step: 4, name: 'first_message', description: 'Send your first message', required: true },
  { step: 5, name: 'voice_intro', description: 'Try voice chat', required: false },
  { step: 6, name: 'goal_setting', description: 'Set a personal goal', required: false },
  { step: 7, name: 'premium_intro', description: 'Discover premium features', required: false },
];

// Segment definitions based on activity
const SEGMENT_CRITERIA = {
  new: { maxDays: 7, minSessions: 0 },
  casual: { maxDays: 30, minSessions: 1, maxSessions: 5 },
  engaged: { maxDays: 30, minSessions: 6, maxSessions: 20 },
  power: { minSessions: 21 },
  churning: { minInactiveDays: 7, maxInactiveDays: 14 },
  dormant: { minInactiveDays: 15 },
};

// Referral Code Generator
class ReferralCodeGenerator {
  private readonly codeLength = 8;
  private readonly charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, 0, I, 1

  generate(prefix?: string): string {
    let code = prefix ? prefix.toUpperCase().slice(0, 4) : '';

    while (code.length < this.codeLength) {
      code += this.charset[Math.floor(Math.random() * this.charset.length)];
    }

    return code;
  }

  generatePersonalized(userName: string): string {
    // Create code from username initials + random
    const initials = userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);

    return this.generate(initials);
  }
}

// User Segmentation Engine
class SegmentationEngine {
  classify(metrics: Partial<UserGrowthMetrics>): UserSegment {
    const now = new Date();
    const lastActive = metrics.lastActiveDate ? new Date(metrics.lastActiveDate) : now;
    const inactiveDays = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

    // Check dormant first
    if (inactiveDays >= SEGMENT_CRITERIA.dormant.minInactiveDays) {
      return 'dormant';
    }

    // Check churning
    if (inactiveDays >= SEGMENT_CRITERIA.churning.minInactiveDays &&
        inactiveDays < SEGMENT_CRITERIA.churning.maxInactiveDays!) {
      return 'churning';
    }

    // Check power user
    if ((metrics.totalSessions || 0) >= SEGMENT_CRITERIA.power.minSessions!) {
      return 'power';
    }

    // Check engaged
    if ((metrics.totalSessions || 0) >= SEGMENT_CRITERIA.engaged.minSessions! &&
        (metrics.totalSessions || 0) <= SEGMENT_CRITERIA.engaged.maxSessions!) {
      return 'engaged';
    }

    // Check casual
    if ((metrics.totalSessions || 0) >= SEGMENT_CRITERIA.casual.minSessions! &&
        (metrics.totalSessions || 0) <= SEGMENT_CRITERIA.casual.maxSessions!) {
      return 'casual';
    }

    return 'new';
  }

  getRetentionActions(segment: UserSegment): string[] {
    const actions: Record<UserSegment, string[]> = {
      new: ['send_welcome_email', 'show_onboarding_tips', 'offer_first_call_bonus'],
      casual: ['send_re_engagement_push', 'highlight_new_features', 'offer_streak_bonus'],
      engaged: ['suggest_goal_setting', 'promote_premium', 'enable_referral_program'],
      power: ['offer_ambassador_program', 'early_access_features', 'personalized_content'],
      churning: ['send_win_back_email', 'offer_discount', 'show_whats_new'],
      dormant: ['send_reactivation_campaign', 'offer_free_premium_trial', 'share_success_stories'],
    };

    return actions[segment] || [];
  }
}

// Viral Mechanics Engine
class ViralMechanicsEngine {
  // Generate shareable content from user achievements/insights
  generateShareableContent(data: {
    type: ShareableContent['type'];
    userId: string;
    content: string;
    metadata?: Record<string, unknown>;
  }): ShareableContent {
    const baseUrl = 'https://kindred.ai/share';

    const templates: Record<ShareableContent['type'], (content: string) => ShareableContent> = {
      insight: (content) => ({
        type: 'insight',
        title: 'My Kindred Insight',
        description: content,
        shareUrl: `${baseUrl}/insight/${data.userId}`,
        hashtags: ['KindredAI', 'SelfGrowth', 'Mindfulness'],
      }),
      achievement: (content) => ({
        type: 'achievement',
        title: 'Achievement Unlocked!',
        description: `I just earned "${content}" on Kindred AI!`,
        shareUrl: `${baseUrl}/achievement/${data.userId}`,
        hashtags: ['KindredAI', 'Achievement', 'PersonalGrowth'],
      }),
      milestone: (content) => ({
        type: 'milestone',
        title: 'Milestone Reached!',
        description: content,
        shareUrl: `${baseUrl}/milestone/${data.userId}`,
        hashtags: ['KindredAI', 'Milestone', 'Journey'],
      }),
      quote: (content) => ({
        type: 'quote',
        title: 'Wisdom from Kindred',
        description: `"${content}"`,
        shareUrl: `${baseUrl}/quote/${data.userId}`,
        hashtags: ['KindredAI', 'Wisdom', 'Inspiration'],
      }),
    };

    return templates[data.type](data.content);
  }

  // Generate share URLs for different platforms
  generateShareUrls(content: ShareableContent): Record<string, string> {
    const encodedTitle = encodeURIComponent(content.title);
    const encodedDesc = encodeURIComponent(content.description);
    const encodedUrl = encodeURIComponent(content.shareUrl);
    const hashtags = content.hashtags.join(',');

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedDesc}&url=${encodedUrl}&hashtags=${hashtags}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedDesc}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedDesc}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedDesc}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`,
    };
  }
}

// Main Growth Service
export class GrowthService {
  private codeGenerator: ReferralCodeGenerator;
  private segmentation: SegmentationEngine;
  private viralEngine: ViralMechanicsEngine;

  constructor() {
    this.codeGenerator = new ReferralCodeGenerator();
    this.segmentation = new SegmentationEngine();
    this.viralEngine = new ViralMechanicsEngine();
  }

  // Generate referral code for user
  async generateReferralCode(userId: string, userName?: string): Promise<string> {
    try {
      // Check if user already has a code
      const { data: existing } = await supabase
        .from('referrals')
        .select('referral_code')
        .eq('referrer_id', userId)
        .limit(1)
        .single();

      if (existing?.referral_code) {
        return existing.referral_code;
      }

      // Generate new code
      const code = userName
        ? this.codeGenerator.generatePersonalized(userName)
        : this.codeGenerator.generate();

      // Save to database
      await supabase.from('referrals').insert({
        referrer_id: userId,
        referral_code: code,
        status: 'pending',
        rewards_claimed: false,
      });

      return code;
    } catch (error) {
      console.error('Failed to generate referral code:', error);
      return this.codeGenerator.generate();
    }
  }

  // Apply referral code for new user
  async applyReferralCode(newUserId: string, code: string): Promise<{
    success: boolean;
    rewards?: ReferralRewards;
    error?: string;
  }> {
    try {
      // Find the referral
      const { data: referral, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referral_code', code.toUpperCase())
        .single();

      if (error || !referral) {
        return { success: false, error: 'Invalid referral code' };
      }

      // Check if already used by this user
      if (referral.referred_id === newUserId) {
        return { success: false, error: 'Code already applied' };
      }

      // Get referrer's tier
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('id', { count: 'exact' })
        .eq('referrer_id', referral.referrer_id)
        .eq('status', 'converted');

      const tier = REFERRAL_TIERS.reduce((best, t) =>
        (referralCount || 0) >= t.minReferrals ? t : best
      , REFERRAL_TIERS[0]);

      const rewards: ReferralRewards = {
        referrerTokens: tier.tokensPerReferral,
        referrerXP: tier.xpPerReferral,
        referredTokens: 25, // New user bonus
        referredXP: 50,
        bonusMultiplier: tier.bonusMultiplier,
      };

      // Update referral status
      await supabase
        .from('referrals')
        .update({
          referred_id: newUserId,
          status: 'registered',
        })
        .eq('id', referral.id);

      // Award tokens to new user - get current balance and update
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('tokens_balance')
        .eq('user_id', newUserId)
        .single();
      
      const newBalance = (currentProfile?.tokens_balance || 0) + rewards.referredTokens;
      await supabase
        .from('profiles')
        .update({ tokens_balance: newBalance })
        .eq('user_id', newUserId);

      return { success: true, rewards };
    } catch (error) {
      console.error('Failed to apply referral code:', error);
      return { success: false, error: 'An error occurred' };
    }
  }

  // Mark referral as activated (user completed onboarding)
  async activateReferral(userId: string): Promise<void> {
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .eq('status', 'registered')
        .single();

      if (!referral) return;

      await supabase
        .from('referrals')
        .update({
          status: 'activated',
        })
        .eq('id', referral.id);
    } catch (error) {
      console.error('Failed to activate referral:', error);
    }
  }

  // Convert referral (user made first meaningful action)
  async convertReferral(userId: string): Promise<ReferralRewards | null> {
    try {
      const { data: referral } = await supabase
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .eq('status', 'activated')
        .single();

      if (!referral) return null;

      // Get referrer's tier
      const { count: referralCount } = await supabase
        .from('referrals')
        .select('id', { count: 'exact' })
        .eq('referrer_id', referral.referrer_id)
        .eq('status', 'converted');

      const tier = REFERRAL_TIERS.reduce((best, t) =>
        (referralCount || 0) >= t.minReferrals ? t : best
      , REFERRAL_TIERS[0]);

      const rewards: ReferralRewards = {
        referrerTokens: tier.tokensPerReferral,
        referrerXP: tier.xpPerReferral,
        referredTokens: 0,
        referredXP: 0,
        bonusMultiplier: tier.bonusMultiplier,
      };

      // Update referral status
      await supabase
        .from('referrals')
        .update({
          status: 'converted',
          completed_at: new Date().toISOString(),
          bonus_tokens: rewards.referrerTokens,
        })
        .eq('id', referral.id);

      // Award tokens to referrer - get current balance and update
      const { data: referrerProfile } = await supabase
        .from('profiles')
        .select('tokens_balance')
        .eq('user_id', referral.referrer_id)
        .single();
      
      const newBalance = (referrerProfile?.tokens_balance || 0) + rewards.referrerTokens;
      await supabase
        .from('profiles')
        .update({ tokens_balance: newBalance })
        .eq('user_id', referral.referrer_id);

      return rewards;
    } catch (error) {
      console.error('Failed to convert referral:', error);
      return null;
    }
  }

  // Get user's referral stats
  async getReferralStats(userId: string): Promise<{
    code: string;
    totalReferrals: number;
    pendingReferrals: number;
    convertedReferrals: number;
    totalEarned: number;
    currentTier: typeof REFERRAL_TIERS[0];
    nextTier?: typeof REFERRAL_TIERS[0];
  }> {
    try {
      const { data: referrals } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId);

      const code = referrals?.[0]?.referral_code || await this.generateReferralCode(userId);

      const stats = {
        code,
        totalReferrals: referrals?.length || 0,
        pendingReferrals: referrals?.filter(r => r.status === 'pending' || r.status === 'registered').length || 0,
        convertedReferrals: referrals?.filter(r => r.status === 'converted').length || 0,
        totalEarned: referrals?.reduce((sum, r) => sum + (r.bonus_tokens || 0), 0) || 0,
        currentTier: REFERRAL_TIERS[0],
        nextTier: REFERRAL_TIERS[1],
      };

      // Calculate tier
      stats.currentTier = REFERRAL_TIERS.reduce((best, t) =>
        stats.convertedReferrals >= t.minReferrals ? t : best
      , REFERRAL_TIERS[0]);

      const tierIdx = REFERRAL_TIERS.indexOf(stats.currentTier);
      stats.nextTier = tierIdx < REFERRAL_TIERS.length - 1 ? REFERRAL_TIERS[tierIdx + 1] : undefined;

      return stats;
    } catch (error) {
      console.error('Failed to get referral stats:', error);
      return {
        code: '',
        totalReferrals: 0,
        pendingReferrals: 0,
        convertedReferrals: 0,
        totalEarned: 0,
        currentTier: REFERRAL_TIERS[0],
      };
    }
  }

  // Update onboarding progress
  async updateOnboardingProgress(userId: string, step: number): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_step: step,
          has_completed_onboarding: step >= ONBOARDING_STEPS.filter(s => s.required).length,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      // Check if onboarding completed
      if (step >= ONBOARDING_STEPS.length) {
        await this.activateReferral(userId);
      }
    } catch (error) {
      console.error('Failed to update onboarding:', error);
    }
  }

  // Classify user segment
  async classifyUser(userId: string): Promise<UserSegment> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at, updated_at')
        .eq('user_id', userId)
        .single();

      const { count: sessionCount } = await supabase
        .from('session_insights')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

      const metrics: Partial<UserGrowthMetrics> = {
        totalSessions: sessionCount || 0,
        lastActiveDate: profile?.updated_at ? new Date(profile.updated_at) : new Date(),
      };

      return this.segmentation.classify(metrics);
    } catch (error) {
      console.error('Failed to classify user:', error);
      return 'new';
    }
  }

  // Get retention actions for user
  async getRetentionActions(userId: string): Promise<string[]> {
    const segment = await this.classifyUser(userId);
    return this.segmentation.getRetentionActions(segment);
  }

  // Generate shareable content
  generateShareContent(
    type: ShareableContent['type'],
    userId: string,
    content: string
  ): ShareableContent {
    return this.viralEngine.generateShareableContent({ type, userId, content });
  }

  // Get share URLs
  getShareUrls(content: ShareableContent): Record<string, string> {
    return this.viralEngine.generateShareUrls(content);
  }

  // Track share event using analytics_events table
  async trackShare(userId: string, platform: string, contentType: string): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: 'share',
        event_data: { platform, contentType },
        session_id: null,
        device_info: null,
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  }

  // Track any analytics event
  async trackEvent(userId: string, eventType: string, eventData: Record<string, any>): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        session_id: null,
        device_info: null,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
}

// Singleton instance
let growthInstance: GrowthService | null = null;

export function getGrowthService(): GrowthService {
  if (!growthInstance) {
    growthInstance = new GrowthService();
  }
  return growthInstance;
}

// Helper functions
export async function applyReferral(userId: string, code: string) {
  return getGrowthService().applyReferralCode(userId, code);
}

export async function getReferralCode(userId: string, userName?: string) {
  return getGrowthService().generateReferralCode(userId, userName);
}

export async function trackOnboarding(userId: string, step: number) {
  return getGrowthService().updateOnboardingProgress(userId, step);
}
