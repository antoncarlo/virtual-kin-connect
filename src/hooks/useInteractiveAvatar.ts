/**
 * useInteractiveAvatar Hook
 *
 * Simplified React hook for LiveAvatar integration.
 * Provides all the functionality of InteractiveAvatar component
 * in a more flexible hook-based API.
 *
 * @example
 * ```tsx
 * const {
 *   videoRef,
 *   state,
 *   start,
 *   stop,
 *   speak,
 *   talk,
 *   startVoiceChat,
 *   stopVoiceChat,
 * } = useInteractiveAvatar({
 *   avatarId: "Bryan_IT_Sitting_public",
 *   language: "it",
 *   onAvatarMessage: (msg) => console.log("Avatar:", msg),
 * });
 *
 * return (
 *   <video ref={videoRef} autoPlay playsInline />
 * );
 * ```
 */

import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import type { SupportedLanguage } from "@/lib/multilingual";

// ============================================================================
// TYPES
// ============================================================================

export type AvatarState = "idle" | "loading" | "connecting" | "active" | "error";

export interface UseInteractiveAvatarOptions {
  /** HeyGen Avatar ID */
  avatarId: string;
  /** Voice ID (optional) */
  voiceId?: string;
  /** Quality: "high" | "medium" | "low" */
  quality?: "high" | "medium" | "low";
  /** Voice emotion preset */
  emotion?: "excited" | "serious" | "friendly" | "soothing" | "broadcaster";
  /** Language code */
  language?: SupportedLanguage;
  /** Knowledge base ID */
  knowledgeBaseId?: string;
  /** Auto-start voice chat */
  enableVoiceChat?: boolean;

  // Callbacks
  onAvatarStartSpeaking?: () => void;
  onAvatarStopSpeaking?: () => void;
  onAvatarMessage?: (message: string) => void;
  onUserStartSpeaking?: () => void;
  onUserStopSpeaking?: () => void;
  onUserMessage?: (message: string) => void;
  onSessionReady?: (sessionId: string) => void;
  onError?: (error: Error) => void;
}

export interface UseInteractiveAvatarReturn {
  /** Ref to attach to video element */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Current avatar state */
  state: AvatarState;
  /** Session ID when connected */
  sessionId: string | null;
  /** Whether avatar is speaking */
  isSpeaking: boolean;
  /** Whether user is speaking (voice chat) */
  isUserSpeaking: boolean;
  /** Error message if state is "error" */
  error: string | null;
  /** Start avatar session */
  start: () => Promise<void>;
  /** Stop avatar session */
  stop: () => Promise<void>;
  /** Make avatar speak (REPEAT mode) */
  speak: (text: string) => Promise<void>;
  /** Make avatar respond (TALK mode with LLM) */
  talk: (userInput: string) => Promise<void>;
  /** Start voice chat */
  startVoiceChat: () => Promise<void>;
  /** Stop voice chat */
  stopVoiceChat: () => Promise<void>;
  /** Interrupt current speech */
  interrupt: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useInteractiveAvatar(
  options: UseInteractiveAvatarOptions
): UseInteractiveAvatarReturn {
  const {
    avatarId,
    voiceId,
    quality = "high",
    emotion = "friendly",
    language = "it",
    knowledgeBaseId,
    enableVoiceChat = false,
    onAvatarStartSpeaking,
    onAvatarStopSpeaking,
    onAvatarMessage,
    onUserStartSpeaking,
    onUserStopSpeaking,
    onUserMessage,
    onSessionReady,
    onError,
  } = options;

  // State
  const [state, setState] = useState<AvatarState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUp = useRef(false);
  const retryCount = useRef(0);

  // -------------------------------------------------------------------------
  // Token Generation
  // -------------------------------------------------------------------------
  const getToken = useCallback(async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    const { data, error } = await supabase.functions.invoke("heygen-streaming", {
      body: { action: "getToken" },
    });

    if (error || !data?.token) {
      throw new Error(error?.message || "Failed to get token");
    }

    return data.token;
  }, []);

  // -------------------------------------------------------------------------
  // Event Setup
  // -------------------------------------------------------------------------
  const setupEvents = useCallback(
    (avatar: any) => {
      avatar.on("stream_ready", (event: any) => {
        const stream = event.detail;
        if (stream && videoRef.current) {
          mediaStreamRef.current = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.warn);
        }
      });

      avatar.on("avatar_start_talking", () => {
        setIsSpeaking(true);
        onAvatarStartSpeaking?.();
      });

      avatar.on("avatar_stop_talking", () => {
        setIsSpeaking(false);
        onAvatarStopSpeaking?.();
      });

      avatar.on("avatar_talking_message", (event: any) => {
        const msg = event?.detail?.text || event?.text;
        if (msg) onAvatarMessage?.(msg);
      });

      avatar.on("user_start", () => {
        setIsUserSpeaking(true);
        onUserStartSpeaking?.();
      });

      avatar.on("user_stop", () => {
        setIsUserSpeaking(false);
        onUserStopSpeaking?.();
      });

      avatar.on("user_talking_message", (event: any) => {
        const msg = event?.detail?.text || event?.text;
        if (msg) onUserMessage?.(msg);
      });

      avatar.on("stream_disconnected", () => {
        if (!isCleaningUp.current) {
          setError("Connection lost");
          setState("error");
        }
      });

      avatar.on("error", (event: any) => {
        if (!isCleaningUp.current) {
          const errMsg = event?.detail?.message || "Unknown error";
          setError(errMsg);
          setState("error");
          onError?.(new Error(errMsg));
        }
      });
    },
    [
      onAvatarStartSpeaking,
      onAvatarStopSpeaking,
      onAvatarMessage,
      onUserStartSpeaking,
      onUserStopSpeaking,
      onUserMessage,
      onError,
    ]
  );

  // -------------------------------------------------------------------------
  // Start Session
  // -------------------------------------------------------------------------
  const start = useCallback(async () => {
    if (["loading", "connecting", "active"].includes(state)) return;
    if (isCleaningUp.current) return;

    setState("loading");
    setError(null);

    try {
      const token = await getToken();
      setState("connecting");

      const { default: StreamingAvatar } = await import("@heygen/streaming-avatar");
      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      setupEvents(avatar);

      const sessionData = await avatar.createStartAvatar({
        avatarName: avatarId,
        quality: quality as any,
        voice: {
          voiceId: voiceId || undefined,
          rate: 1.0,
          emotion: emotion as any,
        },
        language,
        ...(knowledgeBaseId && { knowledgeId: knowledgeBaseId }),
        activityIdleTimeout: 300,
      });

      setSessionId(sessionData.session_id);
      retryCount.current = 0;

      if (enableVoiceChat) {
        try {
          await avatar.startVoiceChat({});
        } catch (e) {
          console.warn("[useInteractiveAvatar] Voice chat init failed:", e);
        }
      }

      setState("active");
      onSessionReady?.(sessionData.session_id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));

      // Retry logic
      if (
        retryCount.current < 3 &&
        (error.message.includes("network") || error.message.includes("timeout"))
      ) {
        retryCount.current++;
        setTimeout(() => start(), Math.pow(2, retryCount.current) * 1000);
        return;
      }

      setError(error.message);
      setState("error");
      onError?.(error);
    }
  }, [
    state,
    avatarId,
    voiceId,
    quality,
    emotion,
    language,
    knowledgeBaseId,
    enableVoiceChat,
    getToken,
    setupEvents,
    onSessionReady,
    onError,
  ]);

  // -------------------------------------------------------------------------
  // Stop Session
  // -------------------------------------------------------------------------
  const stop = useCallback(async () => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    try {
      if (avatarRef.current) {
        await avatarRef.current.closeVoiceChat?.().catch(() => {});
        await avatarRef.current.stopAvatar().catch(() => {});
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      avatarRef.current = null;
      setSessionId(null);
      setIsSpeaking(false);
      setIsUserSpeaking(false);
      setState("idle");
    } finally {
      isCleaningUp.current = false;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Avatar Actions
  // -------------------------------------------------------------------------
  const speak = useCallback(
    async (text: string) => {
      if (!avatarRef.current || state !== "active") {
        throw new Error("Session not active");
      }
      if (!text?.trim()) return;

      await avatarRef.current.speak({
        text,
        taskType: "repeat",
        taskMode: "ASYNC",
      });
    },
    [state]
  );

  const talk = useCallback(
    async (userInput: string) => {
      if (!avatarRef.current || state !== "active") {
        throw new Error("Session not active");
      }
      if (!userInput?.trim()) return;

      await avatarRef.current.speak({
        text: userInput,
        taskType: "talk",
        taskMode: "ASYNC",
      });
    },
    [state]
  );

  const startVoiceChat = useCallback(async () => {
    if (!avatarRef.current || state !== "active") {
      throw new Error("Session not active");
    }
    await avatarRef.current.startVoiceChat({});
  }, [state]);

  const stopVoiceChat = useCallback(async () => {
    if (!avatarRef.current) return;
    await avatarRef.current.closeVoiceChat?.().catch(() => {});
  }, []);

  const interrupt = useCallback(async () => {
    if (!avatarRef.current || !isSpeaking) return;
    await avatarRef.current.interrupt().catch(() => {});
    setIsSpeaking(false);
  }, [isSpeaking]);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    videoRef,
    state,
    sessionId,
    isSpeaking,
    isUserSpeaking,
    error,
    start,
    stop,
    speak,
    talk,
    startVoiceChat,
    stopVoiceChat,
    interrupt,
  };
}

export default useInteractiveAvatar;
