/**
 * Kindred AI - Professional Adaptive Learning System
 *
 * Handles continuous learning from user interactions, personalization,
 * preference tracking, and behavioral adaptation.
 */

import { supabase } from "@/lib/supabase-client";

// Types
export type LearningCategory =
  | 'communication_style'
  | 'emotional_patterns'
  | 'topic_preferences'
  | 'interaction_timing'
  | 'response_preferences'
  | 'personality_compatibility';

export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verified';

export interface LearnedPattern {
  id: string;
  category: LearningCategory;
  pattern: string;
  value: string | number | boolean;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  occurrences: number;
  lastObserved: Date;
  metadata?: Record<string, unknown>;
}

export interface UserProfile {
  userId: string;
  patterns: LearnedPattern[];
  communicationPreferences: CommunicationPreferences;
  emotionalProfile: EmotionalProfile;
  engagementMetrics: EngagementMetrics;
  lastUpdated: Date;
}

export interface CommunicationPreferences {
  preferredLength: 'brief' | 'moderate' | 'detailed';
  formalityLevel: number; // 0-100, 0 = casual, 100 = formal
  emojiUsage: number; // 0-100
  questionFrequency: number; // 0-100
  humorAppreciation: number; // 0-100
  preferredTopics: string[];
  avoidTopics: string[];
  preferredLanguage: string;
}

export interface EmotionalProfile {
  baselineMood: number; // -100 to 100
  emotionalVolatility: number; // 0-100
  supportNeeds: 'minimal' | 'moderate' | 'high';
  copingMechanisms: string[];
  triggers: Array<{ trigger: string; response: string }>;
  peakEngagementTimes: string[]; // e.g., "morning", "evening"
}

export interface EngagementMetrics {
  averageSessionLength: number; // minutes
  sessionsPerWeek: number;
  responseRate: number; // 0-100
  satisfactionScore: number; // 0-100
  retentionDays: number;
  lastActiveDate: Date;
  totalMessages: number;
  totalCallMinutes: number;
}

export interface LearningEvent {
  type: 'message' | 'reaction' | 'correction' | 'preference' | 'feedback';
  userId: string;
  avatarId: string;
  content: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

// Pattern extraction utilities
class PatternExtractor {
  // Extract communication style from messages
  extractCommunicationStyle(messages: string[]): Partial<CommunicationPreferences> {
    if (messages.length === 0) return {};

    const totalLength = messages.reduce((sum, m) => sum + m.length, 0);
    const avgLength = totalLength / messages.length;

    // Determine preferred length
    let preferredLength: CommunicationPreferences['preferredLength'] = 'moderate';
    if (avgLength < 50) preferredLength = 'brief';
    else if (avgLength > 200) preferredLength = 'detailed';

    // Count emojis
    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const totalEmojis = messages.reduce((sum, m) => sum + (m.match(emojiRegex)?.length || 0), 0);
    const emojiUsage = Math.min(100, Math.round((totalEmojis / messages.length) * 50));

    // Count questions
    const questionCount = messages.filter(m => m.includes('?')).length;
    const questionFrequency = Math.round((questionCount / messages.length) * 100);

    // Detect formality
    const formalIndicators = ['vorrei', 'potrebbe', 'cortesemente', 'La prego', 'would', 'could', 'please', 'kindly'];
    const casualIndicators = ['ciao', 'hey', 'ehi', 'ma dai', 'tipo', 'boh', 'hi', 'yeah', 'like', 'kinda'];

    let formalCount = 0;
    let casualCount = 0;

    for (const msg of messages) {
      const lowerMsg = msg.toLowerCase();
      formalCount += formalIndicators.filter(ind => lowerMsg.includes(ind)).length;
      casualCount += casualIndicators.filter(ind => lowerMsg.includes(ind)).length;
    }

    const formalityLevel = Math.round(50 + (formalCount - casualCount) * 10);

    return {
      preferredLength,
      emojiUsage,
      questionFrequency,
      formalityLevel: Math.max(0, Math.min(100, formalityLevel)),
    };
  }

  // Extract emotional patterns from messages
  extractEmotionalPatterns(messages: string[]): Partial<EmotionalProfile> {
    const emotions = this.detectEmotions(messages);

    const avgMood = emotions.reduce((sum, e) => sum + e.valence, 0) / Math.max(emotions.length, 1);
    const moodVariance = emotions.reduce((sum, e) => sum + Math.abs(e.valence - avgMood), 0) / Math.max(emotions.length, 1);

    return {
      baselineMood: Math.round(avgMood * 100),
      emotionalVolatility: Math.round(moodVariance * 100),
      supportNeeds: moodVariance > 0.5 ? 'high' : moodVariance > 0.25 ? 'moderate' : 'minimal',
    };
  }

  private detectEmotions(messages: string[]): Array<{ valence: number; arousal: number }> {
    const results: Array<{ valence: number; arousal: number }> = [];

    const positiveWords = ['felice', 'contento', 'bene', 'ottimo', 'fantastico', 'grazie', 'amore', 'happy', 'great', 'good', 'love', 'thanks', 'amazing'];
    const negativeWords = ['triste', 'male', 'brutto', 'paura', 'ansia', 'stress', 'sad', 'bad', 'afraid', 'anxious', 'stressed', 'worried'];
    const highArousalWords = ['eccitato', 'furioso', 'entusiasta', 'excited', 'angry', 'thrilled', 'furious'];
    const lowArousalWords = ['calmo', 'stanco', 'rilassato', 'calm', 'tired', 'relaxed', 'peaceful'];

    for (const msg of messages) {
      const lowerMsg = msg.toLowerCase();
      let valence = 0;
      let arousal = 0.5;

      // Calculate valence
      const posCount = positiveWords.filter(w => lowerMsg.includes(w)).length;
      const negCount = negativeWords.filter(w => lowerMsg.includes(w)).length;
      valence = (posCount - negCount) / Math.max(posCount + negCount, 1);

      // Calculate arousal
      const highCount = highArousalWords.filter(w => lowerMsg.includes(w)).length;
      const lowCount = lowArousalWords.filter(w => lowerMsg.includes(w)).length;
      arousal = 0.5 + (highCount - lowCount) * 0.25;

      results.push({
        valence: Math.max(-1, Math.min(1, valence)),
        arousal: Math.max(0, Math.min(1, arousal)),
      });
    }

    return results;
  }

  // Extract preferred topics
  extractTopicPreferences(messages: string[]): string[] {
    const topicKeywords: Record<string, string[]> = {
      work: ['lavoro', 'ufficio', 'colleghi', 'capo', 'progetto', 'work', 'office', 'colleagues', 'boss', 'project'],
      relationships: ['relazione', 'partner', 'amore', 'amici', 'famiglia', 'relationship', 'partner', 'love', 'friends', 'family'],
      health: ['salute', 'fitness', 'sport', 'dieta', 'sonno', 'health', 'fitness', 'sport', 'diet', 'sleep'],
      hobbies: ['hobby', 'musica', 'film', 'libri', 'viaggi', 'hobby', 'music', 'movies', 'books', 'travel'],
      personal_growth: ['crescita', 'obiettivi', 'migliorare', 'imparare', 'growth', 'goals', 'improve', 'learn'],
      emotions: ['sentire', 'emozione', 'ansia', 'felice', 'triste', 'feel', 'emotion', 'anxiety', 'happy', 'sad'],
    };

    const topicCounts: Record<string, number> = {};

    for (const msg of messages) {
      const lowerMsg = msg.toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const count = keywords.filter(kw => lowerMsg.includes(kw)).length;
        topicCounts[topic] = (topicCounts[topic] || 0) + count;
      }
    }

    // Return top topics
    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .filter(([, count]) => count > 0)
      .slice(0, 5)
      .map(([topic]) => topic);
  }
}

// Learning engine
class LearningEngine {
  private patterns: Map<string, LearnedPattern> = new Map();
  private extractor: PatternExtractor;

  constructor() {
    this.extractor = new PatternExtractor();
  }

  // Process a learning event
  async processEvent(event: LearningEvent): Promise<LearnedPattern[]> {
    const newPatterns: LearnedPattern[] = [];

    switch (event.type) {
      case 'message':
        newPatterns.push(...this.learnFromMessage(event));
        break;
      case 'reaction':
        newPatterns.push(...this.learnFromReaction(event));
        break;
      case 'correction':
        newPatterns.push(...this.learnFromCorrection(event));
        break;
      case 'feedback':
        newPatterns.push(...this.learnFromFeedback(event));
        break;
    }

    // Update patterns map
    for (const pattern of newPatterns) {
      this.updatePattern(pattern);
    }

    return newPatterns;
  }

  private learnFromMessage(event: LearningEvent): LearnedPattern[] {
    const patterns: LearnedPattern[] = [];

    // Learn communication style
    const commStyle = this.extractor.extractCommunicationStyle([event.content]);

    if (commStyle.preferredLength) {
      patterns.push({
        id: `${event.userId}_comm_length`,
        category: 'communication_style',
        pattern: 'preferred_length',
        value: commStyle.preferredLength,
        confidence: 0.3,
        confidenceLevel: 'low',
        occurrences: 1,
        lastObserved: event.timestamp,
      });
    }

    if (commStyle.emojiUsage !== undefined) {
      patterns.push({
        id: `${event.userId}_emoji_usage`,
        category: 'communication_style',
        pattern: 'emoji_usage',
        value: commStyle.emojiUsage,
        confidence: 0.3,
        confidenceLevel: 'low',
        occurrences: 1,
        lastObserved: event.timestamp,
      });
    }

    // Learn topic preferences
    const topics = this.extractor.extractTopicPreferences([event.content]);
    for (const topic of topics) {
      patterns.push({
        id: `${event.userId}_topic_${topic}`,
        category: 'topic_preferences',
        pattern: 'interested_topic',
        value: topic,
        confidence: 0.4,
        confidenceLevel: 'low',
        occurrences: 1,
        lastObserved: event.timestamp,
      });
    }

    return patterns;
  }

  private learnFromReaction(event: LearningEvent): LearnedPattern[] {
    // Reactions indicate strong preferences
    const isPositive = ['like', 'love', 'laugh', 'wow'].includes(event.content);
    const isNegative = ['dislike', 'sad', 'angry'].includes(event.content);

    if (!event.context?.previousMessage) return [];

    return [{
      id: `${event.userId}_reaction_${event.content}`,
      category: 'response_preferences',
      pattern: isPositive ? 'positive_response_type' : isNegative ? 'negative_response_type' : 'neutral_response_type',
      value: event.context.previousMessage as string,
      confidence: isPositive || isNegative ? 0.7 : 0.4,
      confidenceLevel: 'medium',
      occurrences: 1,
      lastObserved: event.timestamp,
    }];
  }

  private learnFromCorrection(event: LearningEvent): LearnedPattern[] {
    // Corrections are high-signal learning events
    return [{
      id: `${event.userId}_correction_${Date.now()}`,
      category: 'response_preferences',
      pattern: 'avoid_response_pattern',
      value: event.content,
      confidence: 0.9,
      confidenceLevel: 'verified',
      occurrences: 1,
      lastObserved: event.timestamp,
      metadata: {
        correction: event.context?.correction,
        original: event.context?.originalResponse,
      },
    }];
  }

  private learnFromFeedback(event: LearningEvent): LearnedPattern[] {
    const rating = event.context?.rating as number || 3;
    const adjustedConfidence = rating >= 4 ? 0.8 : rating <= 2 ? 0.7 : 0.5;

    return [{
      id: `${event.userId}_feedback_${Date.now()}`,
      category: 'response_preferences',
      pattern: rating >= 4 ? 'positive_feedback' : 'negative_feedback',
      value: event.content,
      confidence: adjustedConfidence,
      confidenceLevel: rating >= 4 ? 'high' : 'medium',
      occurrences: 1,
      lastObserved: event.timestamp,
      metadata: {
        rating,
        feedback: event.context?.feedbackText,
      },
    }];
  }

  private updatePattern(newPattern: LearnedPattern): void {
    const existing = this.patterns.get(newPattern.id);

    if (existing) {
      // Update existing pattern with weighted average
      existing.occurrences++;
      existing.confidence = (existing.confidence * (existing.occurrences - 1) + newPattern.confidence) / existing.occurrences;
      existing.lastObserved = newPattern.lastObserved;

      // Update confidence level based on occurrences
      if (existing.occurrences >= 10 && existing.confidence > 0.7) {
        existing.confidenceLevel = 'high';
      } else if (existing.occurrences >= 5 && existing.confidence > 0.5) {
        existing.confidenceLevel = 'medium';
      }
    } else {
      this.patterns.set(newPattern.id, newPattern);
    }
  }

  // Get all patterns for a user
  getPatterns(userId: string): LearnedPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.id.startsWith(userId));
  }

  // Get high-confidence patterns
  getReliablePatterns(userId: string, minConfidence: number = 0.6): LearnedPattern[] {
    return this.getPatterns(userId).filter(p => p.confidence >= minConfidence);
  }
}

// Personalization engine
class PersonalizationEngine {
  // Generate personalized response modifications
  generateModifications(
    userProfile: Partial<UserProfile>,
    context: { avatarId: string; messageType: string }
  ): ResponseModification {
    const modifications: ResponseModification = {
      lengthHint: 'moderate',
      formalityHint: 50,
      emojiHint: 30,
      topicsToEmphasize: [],
      topicsToAvoid: [],
      toneAdjustments: [],
    };

    const prefs = userProfile.communicationPreferences;

    if (prefs) {
      modifications.lengthHint = prefs.preferredLength;
      modifications.formalityHint = prefs.formalityLevel;
      modifications.emojiHint = prefs.emojiUsage;
      modifications.topicsToEmphasize = prefs.preferredTopics;
      modifications.topicsToAvoid = prefs.avoidTopics;
    }

    const emotional = userProfile.emotionalProfile;

    if (emotional) {
      if (emotional.supportNeeds === 'high') {
        modifications.toneAdjustments.push('empathetic', 'supportive');
      }
      if (emotional.baselineMood < -30) {
        modifications.toneAdjustments.push('encouraging', 'gentle');
      }
    }

    return modifications;
  }
}

export interface ResponseModification {
  lengthHint: 'brief' | 'moderate' | 'detailed';
  formalityHint: number;
  emojiHint: number;
  topicsToEmphasize: string[];
  topicsToAvoid: string[];
  toneAdjustments: string[];
}

// Main Adaptive Learning service
export class AdaptiveLearningService {
  private learningEngine: LearningEngine;
  private personalizationEngine: PersonalizationEngine;
  private userProfiles: Map<string, Partial<UserProfile>> = new Map();

  constructor() {
    this.learningEngine = new LearningEngine();
    this.personalizationEngine = new PersonalizationEngine();
  }

  // Record a learning event
  async recordEvent(event: LearningEvent): Promise<void> {
    const patterns = await this.learningEngine.processEvent(event);

    // Update user profile
    await this.updateUserProfile(event.userId, patterns);

    // Persist to database
    await this.persistLearning(event.userId, patterns);
  }

  // Get personalization for a response
  getPersonalization(
    userId: string,
    avatarId: string,
    messageType: string
  ): ResponseModification {
    const profile = this.userProfiles.get(userId);
    return this.personalizationEngine.generateModifications(
      profile || {},
      { avatarId, messageType }
    );
  }

  // Load user profile from database
  async loadUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
    try {
      const { data, error } = await supabase
        .from('user_context')
        .select('*')
        .eq('user_id', userId)
        .eq('context_type', 'adaptive_learning');

      if (error || !data) return null;

      // Build profile from stored patterns
      const profile: Partial<UserProfile> = {
        userId,
        patterns: [],
        lastUpdated: new Date(),
      };

      const commPrefs: Partial<CommunicationPreferences> = {};
      const emotionalProfile: Partial<EmotionalProfile> = {};

      for (const row of data) {
        const pattern: LearnedPattern = {
          id: row.key,
          category: row.key.split('_')[1] as LearningCategory,
          pattern: row.key,
          value: row.value,
          confidence: row.confidence || 0.5,
          confidenceLevel: (row.confidence || 0.5) > 0.7 ? 'high' : 'medium',
          occurrences: 1,
          lastObserved: new Date(row.updated_at),
        };

        profile.patterns?.push(pattern);

        // Extract specific preferences
        if (row.key.includes('preferred_length')) {
          commPrefs.preferredLength = row.value as CommunicationPreferences['preferredLength'];
        }
        if (row.key.includes('emoji_usage')) {
          commPrefs.emojiUsage = Number(row.value);
        }
        if (row.key.includes('formality')) {
          commPrefs.formalityLevel = Number(row.value);
        }
      }

      if (Object.keys(commPrefs).length > 0) {
        profile.communicationPreferences = {
          preferredLength: 'moderate',
          formalityLevel: 50,
          emojiUsage: 30,
          questionFrequency: 30,
          humorAppreciation: 50,
          preferredTopics: [],
          avoidTopics: [],
          preferredLanguage: 'auto',
          ...commPrefs,
        };
      }

      this.userProfiles.set(userId, profile);
      return profile;

    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  }

  private async updateUserProfile(userId: string, patterns: LearnedPattern[]): Promise<void> {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        userId,
        patterns: [],
        lastUpdated: new Date(),
      };
    }

    // Merge new patterns
    for (const pattern of patterns) {
      const existingIdx = profile.patterns?.findIndex(p => p.id === pattern.id) ?? -1;
      if (existingIdx >= 0 && profile.patterns) {
        profile.patterns[existingIdx] = pattern;
      } else {
        profile.patterns = [...(profile.patterns || []), pattern];
      }
    }

    profile.lastUpdated = new Date();
    this.userProfiles.set(userId, profile);
  }

  private async persistLearning(userId: string, patterns: LearnedPattern[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await supabase.from('user_context').upsert({
          user_id: userId,
          avatar_id: 'global', // Adaptive learning is cross-avatar
          context_type: 'adaptive_learning',
          key: pattern.id,
          value: String(pattern.value),
          confidence: pattern.confidence,
          is_cross_avatar: true,
          privacy_level: 'private',
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,avatar_id,context_type,key' });
      }
    } catch (error) {
      console.error('Failed to persist learning:', error);
    }
  }

  // Get learning insights for analytics
  getInsights(userId: string): {
    totalPatterns: number;
    highConfidencePatterns: number;
    topCategories: Array<{ category: LearningCategory; count: number }>;
    lastLearned: Date | null;
  } {
    const patterns = this.learningEngine.getPatterns(userId);
    const highConfidence = patterns.filter(p => p.confidence >= 0.7);

    const categoryCounts: Record<LearningCategory, number> = {} as Record<LearningCategory, number>;
    for (const p of patterns) {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    }

    const topCategories = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category: category as LearningCategory, count }))
      .sort((a, b) => b.count - a.count);

    const lastLearned = patterns.length > 0
      ? new Date(Math.max(...patterns.map(p => p.lastObserved.getTime())))
      : null;

    return {
      totalPatterns: patterns.length,
      highConfidencePatterns: highConfidence.length,
      topCategories,
      lastLearned,
    };
  }
}

// Singleton instance
let adaptiveLearningInstance: AdaptiveLearningService | null = null;

export function getAdaptiveLearning(): AdaptiveLearningService {
  if (!adaptiveLearningInstance) {
    adaptiveLearningInstance = new AdaptiveLearningService();
  }
  return adaptiveLearningInstance;
}

// Hook-friendly helper
export async function recordLearningEvent(
  userId: string,
  avatarId: string,
  type: LearningEvent['type'],
  content: string,
  context?: Record<string, unknown>
): Promise<void> {
  const service = getAdaptiveLearning();
  await service.recordEvent({
    type,
    userId,
    avatarId,
    content,
    context,
    timestamp: new Date(),
  });
}
