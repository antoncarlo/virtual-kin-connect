/**
 * useConvEmotion Hook
 *
 * React hook for contextual emotion recognition in conversations.
 * Tracks emotional dynamics across conversation turns.
 */

import { useState, useCallback, useMemo } from "react";
import {
  analyzeConversationEmotions,
  ConversationEmotionAnalysis,
  ExtendedEmotion,
  getEmotionEmoji,
  getEmotionLabel,
} from "@/lib/conv-emotion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface UseConvEmotionReturn {
  // Current analysis
  analysis: ConversationEmotionAnalysis | null;
  currentMood: ExtendedEmotion;
  moodEmoji: string;
  moodLabel: string;
  moodIntensity: number;
  trajectory: "improving" | "stable" | "declining" | "volatile";

  // Recommendations for response
  recommendedStyle: string;
  suggestedTone: string;
  topicsToExplore: string[];
  topicsToAvoid: string[];

  // Actions
  analyzeMessages: (messages: Message[]) => ConversationEmotionAnalysis;
  addMessageAndAnalyze: (message: Message) => ConversationEmotionAnalysis;
  reset: () => void;

  // Helpers
  getEmotionDisplay: (emotion: ExtendedEmotion) => { emoji: string; label: string };
}

export function useConvEmotion(): UseConvEmotionReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [analysis, setAnalysis] = useState<ConversationEmotionAnalysis | null>(null);

  // Analyze messages
  const analyzeMessages = useCallback((newMessages: Message[]): ConversationEmotionAnalysis => {
    setMessages(newMessages);
    const result = analyzeConversationEmotions(newMessages);
    setAnalysis(result);
    return result;
  }, []);

  // Add a single message and re-analyze
  const addMessageAndAnalyze = useCallback((message: Message): ConversationEmotionAnalysis => {
    const newMessages = [...messages, message];
    return analyzeMessages(newMessages);
  }, [messages, analyzeMessages]);

  // Reset state
  const reset = useCallback(() => {
    setMessages([]);
    setAnalysis(null);
  }, []);

  // Get emotion display helper
  const getEmotionDisplay = useCallback((emotion: ExtendedEmotion) => ({
    emoji: getEmotionEmoji(emotion),
    label: getEmotionLabel(emotion, "it"),
  }), []);

  // Derived values
  const currentMood = analysis?.overallMood || "neutral";
  const moodEmoji = getEmotionEmoji(currentMood);
  const moodLabel = getEmotionLabel(currentMood, "it");
  const moodIntensity = analysis?.moodIntensity || 5;
  const trajectory = analysis?.emotionalTrajectory || "stable";

  const recommendedStyle = analysis?.recommendations.responseStyle || "engaging";
  const suggestedTone = analysis?.recommendations.suggestedTone || "Amichevole";
  const topicsToExplore = analysis?.recommendations.topicsToExplore || [];
  const topicsToAvoid = analysis?.recommendations.topicsToAvoid || [];

  return {
    analysis,
    currentMood,
    moodEmoji,
    moodLabel,
    moodIntensity,
    trajectory,
    recommendedStyle,
    suggestedTone,
    topicsToExplore,
    topicsToAvoid,
    analyzeMessages,
    addMessageAndAnalyze,
    reset,
    getEmotionDisplay,
  };
}
