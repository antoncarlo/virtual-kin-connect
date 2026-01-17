import { useCallback, useRef, useEffect } from "react";

type GestureType = "nod" | "blink" | "smile" | "thinking" | "listening";

interface IdleGestureConfig {
  minInterval: number; // Minimum time between gestures (ms)
  maxInterval: number; // Maximum time between gestures (ms)
  enabled: boolean;
}

const DEFAULT_CONFIG: IdleGestureConfig = {
  minInterval: 3000,
  maxInterval: 8000,
  enabled: true,
};

// Weights for different gestures during different states
const LISTENING_GESTURES: { gesture: GestureType; weight: number }[] = [
  { gesture: "nod", weight: 4 },
  { gesture: "smile", weight: 2 },
  { gesture: "listening", weight: 3 },
];

const THINKING_GESTURES: { gesture: GestureType; weight: number }[] = [
  { gesture: "thinking", weight: 5 },
  { gesture: "blink", weight: 2 },
];

const IDLE_GESTURES: { gesture: GestureType; weight: number }[] = [
  { gesture: "blink", weight: 5 },
  { gesture: "smile", weight: 2 },
  { gesture: "nod", weight: 1 },
];

export function useIdleGestures(options: {
  isConnected: boolean;
  isSpeaking: boolean;
  isProcessing?: boolean; // RAG processing
  isUserSpeaking?: boolean;
  onGesture: (gesture: GestureType) => void;
  config?: Partial<IdleGestureConfig>;
}) {
  const {
    isConnected,
    isSpeaking,
    isProcessing = false,
    isUserSpeaking = false,
    onGesture,
    config = {},
  } = options;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastGestureTimeRef = useRef<number>(Date.now());

  // Weighted random selection
  const selectGesture = useCallback((gestures: typeof LISTENING_GESTURES): GestureType => {
    const totalWeight = gestures.reduce((sum, g) => sum + g.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { gesture, weight } of gestures) {
      random -= weight;
      if (random <= 0) return gesture;
    }
    
    return gestures[0].gesture;
  }, []);

  const triggerGesture = useCallback(() => {
    if (!finalConfig.enabled || !isConnected) return;

    const now = Date.now();
    const timeSinceLastGesture = now - lastGestureTimeRef.current;
    
    // Don't trigger too frequently
    if (timeSinceLastGesture < finalConfig.minInterval) return;

    let gesture: GestureType;

    if (isProcessing) {
      // Thinking gestures while RAG is processing
      gesture = selectGesture(THINKING_GESTURES);
    } else if (isUserSpeaking && !isSpeaking) {
      // Active listening gestures when user is speaking
      gesture = selectGesture(LISTENING_GESTURES);
    } else if (!isSpeaking) {
      // Idle gestures when no one is speaking
      gesture = selectGesture(IDLE_GESTURES);
    } else {
      // Skip gestures while avatar is speaking
      return;
    }

    lastGestureTimeRef.current = now;
    onGesture(gesture);
  }, [finalConfig, isConnected, isProcessing, isUserSpeaking, isSpeaking, selectGesture, onGesture]);

  // Random interval gesture triggering
  useEffect(() => {
    if (!isConnected || !finalConfig.enabled) {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const scheduleNextGesture = () => {
      const delay = Math.random() * (finalConfig.maxInterval - finalConfig.minInterval) + finalConfig.minInterval;
      intervalRef.current = setTimeout(() => {
        triggerGesture();
        scheduleNextGesture();
      }, delay);
    };

    scheduleNextGesture();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isConnected, finalConfig, triggerGesture]);

  // Force immediate gesture (for external triggers)
  const forceGesture = useCallback((gesture: GestureType) => {
    if (!isConnected) return;
    lastGestureTimeRef.current = Date.now();
    onGesture(gesture);
  }, [isConnected, onGesture]);

  return {
    triggerGesture,
    forceGesture,
  };
}
