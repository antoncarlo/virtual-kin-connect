/**
 * useLiveAvatar Hook
 *
 * React hook for HeyGen LiveAvatar integration.
 * Provides real-time AI avatar streaming with voice chat capabilities.
 *
 * @see https://www.liveavatar.com/
 * @see https://www.npmjs.com/package/@heygen/liveavatar-web-sdk
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SupportedLanguage } from "@/lib/multilingual";
import { getHeyGenVoiceId } from "@/lib/multilingual";

interface UseLiveAvatarOptions {
  avatarId: string;
  voiceId?: string;
  gender?: "male" | "female";
  language?: SupportedLanguage;
  knowledgeBase?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onAvatarSpeaking?: (speaking: boolean) => void;
  onAvatarMessage?: (message: string) => void;
  onUserSpeaking?: (speaking: boolean) => void;
  onUserMessage?: (message: string) => void;
  onError?: (error: Error) => void;
}

interface UseLiveAvatarReturn {
  // State
  isConnecting: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  isVoiceChatActive: boolean;
  sessionId: string | null;
  mediaStream: MediaStream | null;
  error: Error | null;

  // Actions
  startSession: (videoElement?: HTMLVideoElement) => Promise<void>;
  stopSession: () => Promise<void>;
  speak: (text: string) => Promise<void>;
  talk: (userInput: string) => Promise<void>;
  startVoiceChat: () => Promise<void>;
  stopVoiceChat: () => Promise<void>;
  interrupt: () => Promise<void>;
}

export function useLiveAvatar(options: UseLiveAvatarOptions): UseLiveAvatarReturn {
  const {
    avatarId,
    voiceId,
    gender = "male",
    language = "it",
    knowledgeBase,
    onConnected,
    onDisconnected,
    onAvatarSpeaking,
    onAvatarMessage,
    onUserSpeaking,
    onUserMessage,
    onError,
  } = options;

  // State
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isVoiceChatActive, setIsVoiceChatActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs
  const sessionRef = useRef<any>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Get dynamic voice ID based on language and gender
  const dynamicVoiceId = voiceId || getHeyGenVoiceId(gender, language);

  /**
   * Get session token from Supabase Edge Function or direct API
   */
  const getSessionToken = useCallback(async (): Promise<string> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }

    // Try to get token from Edge Function (production)
    try {
      const response = await supabase.functions.invoke("heygen-streaming", {
        body: { action: "getToken" },
      });

      if (response.data?.token) {
        console.log("[LiveAvatar] Token obtained from Edge Function");
        return response.data.token;
      }
    } catch (err) {
      console.warn("[LiveAvatar] Edge Function failed, trying direct API");
    }

    // Fallback: Use direct API with env key (development only)
    const apiKey = import.meta.env.VITE_LIVEAVATAR_API_KEY;
    if (!apiKey) {
      throw new Error("LiveAvatar API key not configured");
    }

    console.log("[LiveAvatar] Using direct API for token");
    const response = await fetch("https://api.heygen.com/v1/streaming.create_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.data?.token) {
      throw new Error("Token not found in response");
    }

    return data.data.token;
  }, []);

  /**
   * Start LiveAvatar session
   */
  const startSession = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      // Dynamically import the SDK
      const { LiveAvatarSession } = await import("@heygen/liveavatar-web-sdk");

      // Get session token
      const token = await getSessionToken();

      // Create session with configuration
      const session = new LiveAvatarSession({
        token,
        avatarId,
        voiceId: dynamicVoiceId,
        voiceChat: true, // Enable voice chat
        language,
        ...(knowledgeBase && { knowledgeBase }),
      });

      // Store references
      sessionRef.current = session;
      if (videoElement) {
        videoElementRef.current = videoElement;
      }

      // Set up event listeners
      session.on("session_started", (data: any) => {
        console.log("LiveAvatar session started:", data.sessionId);
        setSessionId(data.sessionId);
        setIsConnected(true);
        setIsConnecting(false);
        onConnected?.();
      });

      session.on("session_ended", () => {
        console.log("LiveAvatar session ended");
        setIsConnected(false);
        setSessionId(null);
        onDisconnected?.();
      });

      session.on("stream_ready", (stream: MediaStream) => {
        console.log("LiveAvatar stream ready");
        setMediaStream(stream);

        // Attach to video element if provided
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
          videoElementRef.current.play().catch(console.error);
        }
      });

      session.on("avatar_start_speaking", () => {
        setIsSpeaking(true);
        onAvatarSpeaking?.(true);
      });

      session.on("avatar_stop_speaking", () => {
        setIsSpeaking(false);
        onAvatarSpeaking?.(false);
      });

      session.on("avatar_message", (message: string) => {
        onAvatarMessage?.(message);
      });

      session.on("user_start_speaking", () => {
        setIsUserSpeaking(true);
        onUserSpeaking?.(true);
      });

      session.on("user_stop_speaking", () => {
        setIsUserSpeaking(false);
        onUserSpeaking?.(false);
      });

      session.on("user_message", (message: string) => {
        onUserMessage?.(message);
      });

      session.on("error", (err: Error) => {
        console.error("LiveAvatar error:", err);
        setError(err);
        onError?.(err);
      });

      // Start the session
      await session.start();

    } catch (err) {
      console.error("Failed to start LiveAvatar session:", err);
      const error = err instanceof Error ? err : new Error("Failed to start session");
      setError(error);
      setIsConnecting(false);
      onError?.(error);
    }
  }, [
    isConnecting,
    isConnected,
    avatarId,
    dynamicVoiceId,
    language,
    knowledgeBase,
    getSessionToken,
    onConnected,
    onDisconnected,
    onAvatarSpeaking,
    onAvatarMessage,
    onUserSpeaking,
    onUserMessage,
    onError,
  ]);

  /**
   * Stop LiveAvatar session
   */
  const stopSession = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      await sessionRef.current.stop();
      sessionRef.current = null;
      setIsConnected(false);
      setSessionId(null);
      setMediaStream(null);
      setIsSpeaking(false);
      setIsUserSpeaking(false);
      setIsVoiceChatActive(false);
    } catch (err) {
      console.error("Failed to stop LiveAvatar session:", err);
    }
  }, []);

  /**
   * Make avatar speak (REPEAT mode - for custom LLM)
   */
  const speak = useCallback(async (text: string) => {
    if (!sessionRef.current || !isConnected) {
      throw new Error("Session not active");
    }

    try {
      await sessionRef.current.speak(text, { mode: "repeat" });
    } catch (err) {
      console.error("Failed to make avatar speak:", err);
      throw err;
    }
  }, [isConnected]);

  /**
   * Make avatar talk (TALK mode - uses LiveAvatar's LLM)
   */
  const talk = useCallback(async (userInput: string) => {
    if (!sessionRef.current || !isConnected) {
      throw new Error("Session not active");
    }

    try {
      await sessionRef.current.speak(userInput, { mode: "talk" });
    } catch (err) {
      console.error("Failed to make avatar talk:", err);
      throw err;
    }
  }, [isConnected]);

  /**
   * Start voice chat
   */
  const startVoiceChat = useCallback(async () => {
    if (!sessionRef.current || !isConnected) return;

    try {
      await sessionRef.current.startVoiceChat();
      setIsVoiceChatActive(true);
    } catch (err) {
      console.error("Failed to start voice chat:", err);
      throw err;
    }
  }, [isConnected]);

  /**
   * Stop voice chat
   */
  const stopVoiceChat = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      await sessionRef.current.stopVoiceChat();
      setIsVoiceChatActive(false);
    } catch (err) {
      console.error("Failed to stop voice chat:", err);
    }
  }, []);

  /**
   * Interrupt current speech
   */
  const interrupt = useCallback(async () => {
    if (!sessionRef.current || !isSpeaking) return;

    try {
      await sessionRef.current.interrupt();
      setIsSpeaking(false);
    } catch (err) {
      console.error("Failed to interrupt avatar:", err);
    }
  }, [isSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    isSpeaking,
    isUserSpeaking,
    isVoiceChatActive,
    sessionId,
    mediaStream,
    error,
    startSession,
    stopSession,
    speak,
    talk,
    startVoiceChat,
    stopVoiceChat,
    interrupt,
  };
}
