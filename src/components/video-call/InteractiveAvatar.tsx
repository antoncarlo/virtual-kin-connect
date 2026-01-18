/**
 * InteractiveAvatar Component
 *
 * Production-ready React component for HeyGen LiveAvatar integration.
 * Features:
 * - Secure server-side token generation
 * - Full lifecycle management (init, active, cleanup)
 * - Text-to-Speech (avatar speaks)
 * - Voice-to-Voice (user speaks, avatar responds)
 * - Error handling with retry logic
 * - WebRTC stream management
 *
 * @see https://docs.liveavatar.com/docs/getting-started
 * @see https://github.com/heygen-com/liveavatar-web-sdk
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedLanguage } from "@/lib/multilingual";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Avatar quality settings */
export enum AvatarQuality {
  High = "high",
  Medium = "medium",
  Low = "low",
}

/** Voice emotion presets */
export enum VoiceEmotion {
  EXCITED = "excited",
  SERIOUS = "serious",
  FRIENDLY = "friendly",
  SOOTHING = "soothing",
  BROADCASTER = "broadcaster",
}

/** Task types for avatar speech */
export enum TaskType {
  /** Avatar repeats exactly what you send (for custom LLM/TTS) */
  REPEAT = "repeat",
  /** Avatar uses HeyGen's built-in LLM to respond */
  TALK = "talk",
}

/** Component state */
export type AvatarState = "idle" | "loading" | "connecting" | "active" | "error";

/** Props for InteractiveAvatar component */
export interface InteractiveAvatarProps {
  /** HeyGen Avatar ID (e.g., "Bryan_IT_Sitting_public") */
  avatarId: string;
  /** Voice ID for TTS (optional, uses avatar default) */
  voiceId?: string;
  /** Avatar quality setting */
  quality?: AvatarQuality;
  /** Voice emotion preset */
  emotion?: VoiceEmotion;
  /** Language code for STT/TTS */
  language?: SupportedLanguage;
  /** Knowledge base ID for context-aware responses */
  knowledgeBaseId?: string;
  /** Auto-start session on mount */
  autoStart?: boolean;
  /** Enable voice chat (microphone input) */
  enableVoiceChat?: boolean;
  /** Custom className for video container */
  className?: string;
  /** Callback when avatar starts speaking */
  onAvatarStartSpeaking?: () => void;
  /** Callback when avatar stops speaking */
  onAvatarStopSpeaking?: () => void;
  /** Callback with avatar's spoken text */
  onAvatarMessage?: (message: string) => void;
  /** Callback when user starts speaking */
  onUserStartSpeaking?: () => void;
  /** Callback when user stops speaking */
  onUserStopSpeaking?: () => void;
  /** Callback with user's transcribed speech */
  onUserMessage?: (message: string) => void;
  /** Callback when session is ready */
  onSessionReady?: (sessionId: string) => void;
  /** Callback on state change */
  onStateChange?: (state: AvatarState) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/** Exposed methods via ref */
export interface InteractiveAvatarHandle {
  /** Start avatar session */
  start: () => Promise<void>;
  /** Stop avatar session */
  stop: () => Promise<void>;
  /** Make avatar speak (REPEAT mode) */
  speak: (text: string) => Promise<void>;
  /** Make avatar respond (TALK mode with LLM) */
  talk: (userInput: string) => Promise<void>;
  /** Start voice chat (microphone input) */
  startVoiceChat: () => Promise<void>;
  /** Stop voice chat */
  stopVoiceChat: () => Promise<void>;
  /** Interrupt current speech */
  interrupt: () => Promise<void>;
  /** Get current state */
  getState: () => AvatarState;
  /** Get session ID */
  getSessionId: () => string | null;
}

// ============================================================================
// COMPONENT IMPLEMENTATION
// ============================================================================

export const InteractiveAvatar = forwardRef<
  InteractiveAvatarHandle,
  InteractiveAvatarProps
>(function InteractiveAvatar(props, ref) {
  const {
    avatarId,
    voiceId,
    quality = AvatarQuality.High,
    emotion = VoiceEmotion.FRIENDLY,
    language = "it",
    knowledgeBaseId,
    autoStart = false,
    enableVoiceChat = false,
    className = "",
    onAvatarStartSpeaking,
    onAvatarStopSpeaking,
    onAvatarMessage,
    onUserStartSpeaking,
    onUserStopSpeaking,
    onUserMessage,
    onSessionReady,
    onStateChange,
    onError,
  } = props;

  // -------------------------------------------------------------------------
  // STATE
  // -------------------------------------------------------------------------
  const [state, setState] = useState<AvatarState>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  // -------------------------------------------------------------------------
  // REFS
  // -------------------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<any>(null); // StreamingAvatar instance
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUp = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // -------------------------------------------------------------------------
  // STATE MANAGEMENT
  // -------------------------------------------------------------------------
  const updateState = useCallback(
    (newState: AvatarState) => {
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange]
  );

  const handleError = useCallback(
    (error: Error, context: string) => {
      console.error(`[InteractiveAvatar] ${context}:`, error);
      setErrorMessage(`${context}: ${error.message}`);
      updateState("error");
      onError?.(error);
    },
    [updateState, onError]
  );

  // -------------------------------------------------------------------------
  // TOKEN GENERATION (Server-Side)
  // -------------------------------------------------------------------------
  const getSessionToken = useCallback(async (): Promise<string> => {
    console.log("[InteractiveAvatar] Requesting session token from server...");

    // Verify user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("User not authenticated. Please log in.");
    }

    // Request token from Edge Function (API key stays on server)
    const { data, error } = await supabase.functions.invoke("heygen-streaming", {
      body: { action: "getToken" },
    });

    if (error) {
      throw new Error(`Token generation failed: ${error.message}`);
    }

    if (!data?.token) {
      throw new Error("No token received from server");
    }

    console.log("[InteractiveAvatar] Session token obtained successfully");
    return data.token;
  }, []);

  // -------------------------------------------------------------------------
  // SESSION MANAGEMENT
  // -------------------------------------------------------------------------

  /**
   * Start avatar session with retry logic
   */
  const startSession = useCallback(async () => {
    if (state === "loading" || state === "connecting" || state === "active") {
      console.warn("[InteractiveAvatar] Session already in progress");
      return;
    }

    if (isCleaningUp.current) {
      console.warn("[InteractiveAvatar] Cleanup in progress, please wait");
      return;
    }

    updateState("loading");
    setErrorMessage(null);

    try {
      // Step 1: Get session token from server
      const token = await getSessionToken();

      updateState("connecting");

      // Step 2: Dynamically import SDK (tree-shaking friendly)
      const { default: StreamingAvatar } = await import(
        "@heygen/streaming-avatar"
      );

      // Step 3: Initialize SDK with token
      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      // Step 4: Set up event listeners BEFORE starting
      setupEventListeners(avatar);

      // Step 5: Create and start avatar session
      console.log("[InteractiveAvatar] Creating avatar session...", {
        avatarId,
        quality,
        language,
      });

      const sessionData = await avatar.createStartAvatar({
        avatarName: avatarId,
        quality,
        voice: {
          voiceId: voiceId || undefined,
          rate: 1.0,
          emotion,
        },
        language,
        ...(knowledgeBaseId && { knowledgeId: knowledgeBaseId }),
        // Timeout settings
        activityIdleTimeout: 300, // 5 minutes
        disableIdleTimeout: false,
      });

      setSessionId(sessionData.session_id);
      retryCount.current = 0;

      console.log("[InteractiveAvatar] Session started:", {
        sessionId: sessionData.session_id,
        isPaid: sessionData.is_paid,
        durationLimit: sessionData.session_duration_limit,
      });

      // Auto-start voice chat if enabled
      if (enableVoiceChat) {
        try {
          await avatar.startVoiceChat({ useSilencePrompt: true });
          console.log("[InteractiveAvatar] Voice chat enabled");
        } catch (vcError) {
          console.warn("[InteractiveAvatar] Voice chat failed:", vcError);
        }
      }

      updateState("active");
      onSessionReady?.(sessionData.session_id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Retry logic for network errors
      if (
        retryCount.current < maxRetries &&
        (err.message.includes("network") ||
          err.message.includes("timeout") ||
          err.message.includes("WebSocket"))
      ) {
        retryCount.current++;
        console.log(
          `[InteractiveAvatar] Retrying (${retryCount.current}/${maxRetries})...`
        );
        const delay = Math.pow(2, retryCount.current) * 1000; // Exponential backoff
        setTimeout(() => startSession(), delay);
        return;
      }

      handleError(err, "Failed to start session");
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
    getSessionToken,
    updateState,
    handleError,
    onSessionReady,
  ]);

  /**
   * Stop avatar session with cleanup
   */
  const stopSession = useCallback(async () => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    console.log("[InteractiveAvatar] Stopping session...");

    try {
      // Stop voice chat if active
      if (avatarRef.current) {
        try {
          await avatarRef.current.closeVoiceChat?.();
        } catch (e) {
          // Ignore
        }

        // Stop avatar (this closes WebRTC and releases resources)
        try {
          await avatarRef.current.stopAvatar();
        } catch (e) {
          console.warn("[InteractiveAvatar] Stop error (ignored):", e);
        }
      }

      // Release media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      avatarRef.current = null;
      setSessionId(null);
      setIsSpeaking(false);
      setIsUserSpeaking(false);
      updateState("idle");

      console.log("[InteractiveAvatar] Session stopped successfully");
    } catch (error) {
      console.error("[InteractiveAvatar] Cleanup error:", error);
    } finally {
      isCleaningUp.current = false;
    }
  }, [updateState]);

  // -------------------------------------------------------------------------
  // EVENT LISTENERS
  // -------------------------------------------------------------------------
  const setupEventListeners = useCallback(
    (avatar: any) => {
      // Stream ready - attach to video element
      avatar.on("stream_ready", (event: any) => {
        console.log("[InteractiveAvatar] Stream ready");
        const stream = event.detail;

        if (stream && videoRef.current) {
          mediaStreamRef.current = stream;
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => {
            console.warn("[InteractiveAvatar] Video autoplay blocked:", e);
          });
        }
      });

      // Avatar speaking events
      avatar.on("avatar_start_talking", () => {
        setIsSpeaking(true);
        onAvatarStartSpeaking?.();
      });

      avatar.on("avatar_stop_talking", () => {
        setIsSpeaking(false);
        onAvatarStopSpeaking?.();
      });

      avatar.on("avatar_talking_message", (event: any) => {
        const message = event?.detail?.text || event?.text || "";
        if (message) {
          onAvatarMessage?.(message);
        }
      });

      // User speaking events (voice chat)
      avatar.on("user_start", () => {
        setIsUserSpeaking(true);
        onUserStartSpeaking?.();
      });

      avatar.on("user_stop", () => {
        setIsUserSpeaking(false);
        onUserStopSpeaking?.();
      });

      avatar.on("user_talking_message", (event: any) => {
        const message = event?.detail?.text || event?.text || "";
        if (message) {
          onUserMessage?.(message);
        }
      });

      // Stream disconnected
      avatar.on("stream_disconnected", () => {
        console.warn("[InteractiveAvatar] Stream disconnected");
        if (!isCleaningUp.current) {
          handleError(new Error("Stream disconnected unexpectedly"), "Connection lost");
        }
      });

      // Error event
      avatar.on("error", (event: any) => {
        const errorMsg = event?.detail?.message || event?.message || "Unknown error";
        if (!isCleaningUp.current) {
          handleError(new Error(errorMsg), "Avatar error");
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
      handleError,
    ]
  );

  // -------------------------------------------------------------------------
  // AVATAR ACTIONS
  // -------------------------------------------------------------------------

  /**
   * Make avatar speak (REPEAT mode - for custom LLM/audio)
   * Avatar lip-syncs to the provided text without generating a response
   */
  const speak = useCallback(
    async (text: string) => {
      if (!avatarRef.current || state !== "active") {
        throw new Error("Avatar session not active");
      }

      if (!text?.trim()) {
        console.warn("[InteractiveAvatar] Empty text, skipping speak");
        return;
      }

      console.log(`[InteractiveAvatar] Speaking: "${text.substring(0, 50)}..."`);

      try {
        await avatarRef.current.speak({
          text,
          taskType: TaskType.REPEAT,
          taskMode: "ASYNC",
        });
      } catch (error) {
        handleError(
          error instanceof Error ? error : new Error(String(error)),
          "Failed to speak"
        );
        throw error;
      }
    },
    [state, handleError]
  );

  /**
   * Make avatar respond (TALK mode - uses HeyGen's LLM)
   * Avatar generates and speaks a response to the user input
   */
  const talk = useCallback(
    async (userInput: string) => {
      if (!avatarRef.current || state !== "active") {
        throw new Error("Avatar session not active");
      }

      if (!userInput?.trim()) {
        console.warn("[InteractiveAvatar] Empty input, skipping talk");
        return;
      }

      console.log(`[InteractiveAvatar] Talking: "${userInput.substring(0, 50)}..."`);

      try {
        await avatarRef.current.speak({
          text: userInput,
          taskType: TaskType.TALK,
          taskMode: "ASYNC",
        });
      } catch (error) {
        handleError(
          error instanceof Error ? error : new Error(String(error)),
          "Failed to talk"
        );
        throw error;
      }
    },
    [state, handleError]
  );

  /**
   * Start voice chat (user can speak to avatar via microphone)
   */
  const startVoiceChat = useCallback(async () => {
    if (!avatarRef.current || state !== "active") {
      throw new Error("Avatar session not active");
    }

    console.log("[InteractiveAvatar] Starting voice chat...");

    try {
      await avatarRef.current.startVoiceChat({ useSilencePrompt: true });
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error(String(error)),
        "Failed to start voice chat"
      );
      throw error;
    }
  }, [state, handleError]);

  /**
   * Stop voice chat
   */
  const stopVoiceChat = useCallback(async () => {
    if (!avatarRef.current) return;

    console.log("[InteractiveAvatar] Stopping voice chat...");

    try {
      await avatarRef.current.closeVoiceChat();
    } catch (error) {
      console.warn("[InteractiveAvatar] Stop voice chat error:", error);
    }
  }, []);

  /**
   * Interrupt current speech
   */
  const interrupt = useCallback(async () => {
    if (!avatarRef.current || !isSpeaking) return;

    console.log("[InteractiveAvatar] Interrupting speech...");

    try {
      await avatarRef.current.interrupt();
      setIsSpeaking(false);
    } catch (error) {
      console.warn("[InteractiveAvatar] Interrupt error:", error);
    }
  }, [isSpeaking]);

  // -------------------------------------------------------------------------
  // LIFECYCLE
  // -------------------------------------------------------------------------

  // Auto-start on mount if enabled
  useEffect(() => {
    if (autoStart) {
      startSession();
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount (CRITICAL: prevents credit leakage)
  useEffect(() => {
    return () => {
      console.log("[InteractiveAvatar] Component unmounting, cleaning up...");
      stopSession();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // IMPERATIVE HANDLE (expose methods to parent)
  // -------------------------------------------------------------------------
  useImperativeHandle(
    ref,
    () => ({
      start: startSession,
      stop: stopSession,
      speak,
      talk,
      startVoiceChat,
      stopVoiceChat,
      interrupt,
      getState: () => state,
      getSessionId: () => sessionId,
    }),
    [
      startSession,
      stopSession,
      speak,
      talk,
      startVoiceChat,
      stopVoiceChat,
      interrupt,
      state,
      sessionId,
    ]
  );

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className={`relative ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false} // Avatar audio comes from stream
        className="w-full h-full object-cover"
        style={{
          opacity: state === "active" ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      />

      {/* Loading State */}
      {(state === "loading" || state === "connecting") && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">
              {state === "loading" ? "Inizializzazione..." : "Connessione..."}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
          <div className="text-center text-white p-4">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-sm mb-2">Errore Connessione</p>
            <p className="text-xs text-white/70 max-w-xs">{errorMessage}</p>
            <button
              onClick={() => {
                retryCount.current = 0;
                startSession();
              }}
              className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      )}

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${12 + Math.sin((Date.now() / 200) + i) * 8}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* User Speaking Indicator */}
      {isUserSpeaking && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-green-500/80 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-xs text-white">In ascolto...</span>
        </div>
      )}
    </div>
  );
});

export default InteractiveAvatar;
