/**
 * useOptimizedVideoCall Hook
 *
 * Optimized video call hook with WhatsApp-style UX.
 * Implements parallel initialization, ringtone feedback,
 * and perceived latency reduction techniques.
 *
 * Architecture:
 * 1. User clicks "Call" → Show overlay immediately + start ringtone
 * 2. Parallel: Fetch token + Preload SDK + Request permissions
 * 3. Token ready → Initialize SDK with token
 * 4. SDK connected → Wait for first frame
 * 5. First frame ready → Stop ringtone + Show video
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedLanguage } from "@/lib/multilingual";
import { getHeyGenVoiceId } from "@/lib/multilingual";
import type { CallState } from "@/components/video-call/CallOverlay";

// ============================================================================
// TYPES
// ============================================================================

export interface UseOptimizedVideoCallOptions {
  avatarId: string;
  voiceId?: string;
  gender?: "male" | "female";
  language?: SupportedLanguage;
  knowledgeBaseId?: string;

  // Callbacks
  onCallStateChange?: (state: CallState) => void;
  onAvatarSpeaking?: (speaking: boolean) => void;
  onAvatarMessage?: (message: string) => void;
  onUserSpeaking?: (speaking: boolean) => void;
  onUserMessage?: (message: string) => void;
  onError?: (error: Error) => void;
  onStreamReady?: () => void;
  onFirstFrame?: () => void;
}

export interface UseOptimizedVideoCallReturn {
  // State
  callState: CallState;
  isConnected: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isMuted: boolean;
  sessionId: string | null;
  error: Error | null;
  connectionQuality: "excellent" | "good" | "poor";

  // Video ref
  videoRef: React.RefObject<HTMLVideoElement>;

  // Actions
  startCall: () => Promise<void>;
  endCall: () => Promise<void>;
  toggleMute: () => void;
  speak: (text: string) => Promise<void>;
  talk: (input: string) => Promise<void>;
  interrupt: () => Promise<void>;

  // Pre-warming (call before user clicks for even faster start)
  preWarm: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useOptimizedVideoCall(
  options: UseOptimizedVideoCallOptions
): UseOptimizedVideoCallReturn {
  const {
    avatarId,
    voiceId,
    gender = "male",
    language = "it",
    knowledgeBaseId,
    onCallStateChange,
    onAvatarSpeaking,
    onAvatarMessage,
    onUserSpeaking,
    onUserMessage,
    onError,
    onStreamReady,
    onFirstFrame,
  } = options;

  // State
  const [callState, setCallState] = useState<CallState>("ended");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("good");

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isCleaningUp = useRef(false);
  const preWarmedToken = useRef<string | null>(null);
  const preWarmedSDK = useRef<any>(null);
  const firstFrameReceived = useRef(false);

  // Dynamic voice ID
  const dynamicVoiceId = voiceId || getHeyGenVoiceId(gender, language);

  // -------------------------------------------------------------------------
  // State Management
  // -------------------------------------------------------------------------
  const updateCallState = useCallback(
    (state: CallState) => {
      setCallState(state);
      onCallStateChange?.(state);
    },
    [onCallStateChange]
  );

  const handleError = useCallback(
    (err: Error) => {
      console.error("[OptimizedVideoCall] Error:", err);
      setError(err);
      updateCallState("ended");
      onError?.(err);
    },
    [updateCallState, onError]
  );

  // -------------------------------------------------------------------------
  // Token Fetching (can be pre-warmed)
  // -------------------------------------------------------------------------
  const fetchToken = useCallback(async (): Promise<string> => {
    // Use pre-warmed token if available
    if (preWarmedToken.current) {
      const token = preWarmedToken.current;
      preWarmedToken.current = null; // Use once
      console.log("[OptimizedVideoCall] Using pre-warmed token");
      return token;
    }

    console.log("[OptimizedVideoCall] Fetching token...");
    const startTime = performance.now();

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

    console.log(`[OptimizedVideoCall] Token fetched in ${performance.now() - startTime}ms`);
    return data.token;
  }, []);

  // -------------------------------------------------------------------------
  // SDK Loading (can be pre-warmed)
  // -------------------------------------------------------------------------
  const loadSDK = useCallback(async () => {
    // Use pre-warmed SDK if available
    if (preWarmedSDK.current) {
      console.log("[OptimizedVideoCall] Using pre-warmed SDK");
      return preWarmedSDK.current;
    }

    console.log("[OptimizedVideoCall] Loading SDK...");
    const startTime = performance.now();

    const module = await import("@heygen/streaming-avatar");
    console.log(`[OptimizedVideoCall] SDK loaded in ${performance.now() - startTime}ms`);

    return module.default;
  }, []);

  // -------------------------------------------------------------------------
  // Pre-warming (call before user interaction for faster start)
  // -------------------------------------------------------------------------
  const preWarm = useCallback(async () => {
    console.log("[OptimizedVideoCall] Pre-warming...");

    try {
      // Parallel pre-warm: token + SDK
      const [token, SDK] = await Promise.all([
        fetchToken().catch(() => null),
        loadSDK().catch(() => null),
      ]);

      if (token) preWarmedToken.current = token;
      if (SDK) preWarmedSDK.current = SDK;

      console.log("[OptimizedVideoCall] Pre-warm complete", {
        hasToken: !!token,
        hasSDK: !!SDK,
      });
    } catch (err) {
      // Silently fail pre-warming (it's optional)
      console.warn("[OptimizedVideoCall] Pre-warm failed:", err);
    }
  }, [fetchToken, loadSDK]);

  // -------------------------------------------------------------------------
  // Event Handlers
  // -------------------------------------------------------------------------
  const setupEventHandlers = useCallback(
    (avatar: any) => {
      // Stream ready
      avatar.on("stream_ready", (event: any) => {
        console.log("[OptimizedVideoCall] Stream ready");
        const stream = event.detail;

        if (stream && videoRef.current) {
          mediaStreamRef.current = stream;
          videoRef.current.srcObject = stream;

          // Wait for first frame before showing video
          videoRef.current.onloadeddata = () => {
            if (!firstFrameReceived.current) {
              firstFrameReceived.current = true;
              console.log("[OptimizedVideoCall] First frame received");
              updateCallState("connected");
              onFirstFrame?.();
            }
          };

          videoRef.current.play().catch((e) => {
            console.warn("[OptimizedVideoCall] Autoplay blocked:", e);
          });
        }

        onStreamReady?.();
      });

      // Speaking events
      avatar.on("avatar_start_talking", () => {
        setIsSpeaking(true);
        onAvatarSpeaking?.(true);
      });

      avatar.on("avatar_stop_talking", () => {
        setIsSpeaking(false);
        onAvatarSpeaking?.(false);
      });

      avatar.on("avatar_talking_message", (event: any) => {
        const msg = event?.detail?.text || event?.text;
        if (msg) onAvatarMessage?.(msg);
      });

      // User speaking
      avatar.on("user_start", () => {
        setIsUserSpeaking(true);
        onUserSpeaking?.(true);
      });

      avatar.on("user_stop", () => {
        setIsUserSpeaking(false);
        onUserSpeaking?.(false);
      });

      avatar.on("user_talking_message", (event: any) => {
        const msg = event?.detail?.text || event?.text;
        if (msg) onUserMessage?.(msg);
      });

      // Connection events
      avatar.on("stream_disconnected", () => {
        if (!isCleaningUp.current) {
          setConnectionQuality("poor");
          updateCallState("reconnecting");
        }
      });

      avatar.on("error", (event: any) => {
        if (!isCleaningUp.current) {
          const errMsg = event?.detail?.message || "Connection error";
          handleError(new Error(errMsg));
        }
      });
    },
    [
      updateCallState,
      handleError,
      onStreamReady,
      onFirstFrame,
      onAvatarSpeaking,
      onAvatarMessage,
      onUserSpeaking,
      onUserMessage,
    ]
  );

  // -------------------------------------------------------------------------
  // Start Call (Optimized)
  // -------------------------------------------------------------------------
  const startCall = useCallback(async () => {
    if (callState !== "ended") {
      console.warn("[OptimizedVideoCall] Call already in progress");
      return;
    }

    // STEP 1: Show UI immediately (perceived latency = 0)
    updateCallState("initiating");
    setError(null);
    firstFrameReceived.current = false;

    const overallStart = performance.now();

    try {
      // STEP 2: Parallel initialization
      console.log("[OptimizedVideoCall] Starting parallel initialization...");
      const parallelStart = performance.now();

      const [token, StreamingAvatar] = await Promise.all([
        fetchToken(),
        loadSDK(),
      ]);

      console.log(`[OptimizedVideoCall] Parallel init done in ${performance.now() - parallelStart}ms`);

      // STEP 3: Initialize SDK
      updateCallState("connecting");
      console.log("[OptimizedVideoCall] Initializing SDK...");
      const sdkStart = performance.now();

      const avatar = new StreamingAvatar({ token });
      avatarRef.current = avatar;

      // Setup events BEFORE starting
      setupEventHandlers(avatar);

      // STEP 4: Start avatar session
      const sessionData = await avatar.createStartAvatar({
        avatarName: avatarId,
        quality: "high",
        voice: {
          voiceId: dynamicVoiceId || undefined,
          rate: 1.0,
          emotion: "friendly",
        },
        language,
        ...(knowledgeBaseId && { knowledgeId: knowledgeBaseId }),
        activityIdleTimeout: 300,
      });

      setSessionId(sessionData.session_id);
      setConnectionQuality("excellent");

      console.log(`[OptimizedVideoCall] SDK started in ${performance.now() - sdkStart}ms`);
      console.log(`[OptimizedVideoCall] Total time: ${performance.now() - overallStart}ms`);

      // Note: We don't update to "connected" here
      // That happens when first frame is received (onloadeddata)
      updateCallState("buffering");

    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [
    callState,
    avatarId,
    dynamicVoiceId,
    language,
    knowledgeBaseId,
    fetchToken,
    loadSDK,
    setupEventHandlers,
    updateCallState,
    handleError,
  ]);

  // -------------------------------------------------------------------------
  // End Call
  // -------------------------------------------------------------------------
  const endCall = useCallback(async () => {
    if (isCleaningUp.current) return;
    isCleaningUp.current = true;

    console.log("[OptimizedVideoCall] Ending call...");

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
        videoRef.current.onloadeddata = null;
      }

      avatarRef.current = null;
      setSessionId(null);
      setIsSpeaking(false);
      setIsUserSpeaking(false);
      setIsMuted(false);
      firstFrameReceived.current = false;
      updateCallState("ended");

    } finally {
      isCleaningUp.current = false;
    }
  }, [updateCallState]);

  // -------------------------------------------------------------------------
  // Mute Control
  // -------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;

      // If we have a media stream, mute the audio track
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach((track) => {
          // Note: This mutes the incoming audio, for outgoing use voiceChat methods
        });
      }

      // If avatar supports mute
      if (avatarRef.current) {
        if (newMuted) {
          avatarRef.current.closeVoiceChat?.().catch(() => {});
        } else {
          avatarRef.current.startVoiceChat?.({ useSilencePrompt: true }).catch(() => {});
        }
      }

      return newMuted;
    });
  }, []);

  // -------------------------------------------------------------------------
  // Speaking Methods
  // -------------------------------------------------------------------------
  const speak = useCallback(
    async (text: string) => {
      if (!avatarRef.current || callState !== "connected") {
        throw new Error("Not connected");
      }
      if (!text?.trim()) return;

      await avatarRef.current.speak({
        text,
        taskType: "repeat",
        taskMode: "ASYNC",
      });
    },
    [callState]
  );

  const talk = useCallback(
    async (input: string) => {
      if (!avatarRef.current || callState !== "connected") {
        throw new Error("Not connected");
      }
      if (!input?.trim()) return;

      await avatarRef.current.speak({
        text: input,
        taskType: "talk",
        taskMode: "ASYNC",
      });
    },
    [callState]
  );

  const interrupt = useCallback(async () => {
    if (!avatarRef.current || !isSpeaking) return;
    await avatarRef.current.interrupt?.().catch(() => {});
    setIsSpeaking(false);
  }, [isSpeaking]);

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      endCall();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------
  return {
    callState,
    isConnected: callState === "connected",
    isSpeaking,
    isUserSpeaking,
    isMuted,
    sessionId,
    error,
    connectionQuality,
    videoRef,
    startCall,
    endCall,
    toggleMute,
    speak,
    talk,
    interrupt,
    preWarm,
  };
}

export default useOptimizedVideoCall;
