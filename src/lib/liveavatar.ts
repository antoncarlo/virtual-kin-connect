/**
 * LiveAvatar Integration for Kindred AI
 *
 * LiveAvatar is HeyGen's next-generation real-time AI avatar technology.
 * It provides lifelike, interactive conversations with low latency.
 *
 * @see https://www.liveavatar.com/
 * @see https://docs.heygen.com/docs/streaming-avatar-sdk
 */

import type { SupportedLanguage } from "./multilingual";

// Re-export types from the SDK (will be available after npm install)
export enum AvatarQuality {
  High = "high",
  Medium = "medium",
  Low = "low",
}

export enum VoiceEmotion {
  EXCITED = "excited",
  SERIOUS = "serious",
  FRIENDLY = "friendly",
  SOOTHING = "soothing",
  BROADCASTER = "broadcaster",
}

export enum TaskType {
  TALK = "talk",
  REPEAT = "repeat",
}

export enum StreamingEvents {
  AVATAR_START_TALKING = "avatar_start_talking",
  AVATAR_STOP_TALKING = "avatar_stop_talking",
  AVATAR_TALKING_MESSAGE = "avatar_talking_message",
  AVATAR_END_MESSAGE = "avatar_end_message",
  USER_TALKING_MESSAGE = "user_talking_message",
  USER_END_MESSAGE = "user_end_message",
  USER_START = "user_start",
  USER_STOP = "user_stop",
  USER_SILENCE = "user_silence",
  STREAM_READY = "stream_ready",
  STREAM_DISCONNECTED = "stream_disconnected",
}

export interface VoiceSetting {
  voiceId?: string;
  rate?: number; // 0.5 - 1.5
  emotion?: VoiceEmotion;
}

export interface STTSettings {
  provider?: "DEEPGRAM";
  confidenceThreshold?: number;
}

export interface StartAvatarRequest {
  avatarName: string;
  quality?: AvatarQuality;
  voice?: VoiceSetting;
  knowledgeId?: string;
  knowledgeBase?: string;
  sttSettings?: STTSettings;
  language?: string;
  activityIdleTimeout?: number;
  disableIdleTimeout?: boolean;
}

export interface StartAvatarResponse {
  session_id: string;
  access_token: string;
  url: string;
  is_paid: boolean;
  session_duration_limit: number;
}

export interface SpeakRequest {
  text: string;
  taskType?: TaskType;
  taskMode?: "SYNC" | "ASYNC";
}

export interface LiveAvatarConfig {
  apiKey: string;
  avatarId: string;
  voiceId?: string;
  language?: SupportedLanguage;
  quality?: AvatarQuality;
  emotion?: VoiceEmotion;
  knowledgeBase?: string;
  onStreamReady?: (stream: MediaStream) => void;
  onAvatarStartTalking?: () => void;
  onAvatarStopTalking?: () => void;
  onAvatarMessage?: (message: string) => void;
  onUserStartTalking?: () => void;
  onUserStopTalking?: () => void;
  onUserMessage?: (message: string) => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
}

/**
 * LiveAvatar Client
 *
 * Wrapper around the @heygen/streaming-avatar SDK with
 * additional features for Kindred AI integration.
 */
export class LiveAvatarClient {
  private config: LiveAvatarConfig;
  private sessionId: string | null = null;
  private accessToken: string | null = null;
  private avatar: any = null; // StreamingAvatar instance
  private isConnected: boolean = false;
  private isSpeaking: boolean = false;

  constructor(config: LiveAvatarConfig) {
    this.config = config;
  }

  /**
   * Initialize and start avatar session
   */
  async startSession(videoElement?: HTMLVideoElement): Promise<StartAvatarResponse> {
    try {
      // Dynamically import the SDK (tree-shaking friendly)
      const StreamingAvatarModule = await import("@heygen/streaming-avatar");
      const StreamingAvatar = StreamingAvatarModule.default;

      // First, get a session token from our backend
      const tokenResponse = await this.getSessionToken();

      // Initialize the SDK with the session token
      this.avatar = new StreamingAvatar({
        token: tokenResponse.token,
      });

      // Set up event listeners
      this.setupEventListeners();

      // Start the avatar session
      const sessionData = await this.avatar.createStartAvatar({
        avatarName: this.config.avatarId,
        quality: this.config.quality || AvatarQuality.High,
        voice: {
          voiceId: this.config.voiceId,
          rate: 1.0,
          emotion: this.config.emotion || VoiceEmotion.FRIENDLY,
        },
        language: this.config.language || "it",
        knowledgeBase: this.config.knowledgeBase,
        activityIdleTimeout: 300, // 5 minutes
      });

      this.sessionId = sessionData.session_id;
      this.accessToken = sessionData.access_token;
      this.isConnected = true;

      console.log("LiveAvatar session started:", this.sessionId);

      return sessionData;
    } catch (error) {
      console.error("Failed to start LiveAvatar session:", error);
      this.config.onError?.(error instanceof Error ? error : new Error("Failed to start session"));
      throw error;
    }
  }

  /**
   * Get session token from backend
   */
  private async getSessionToken(): Promise<{ token: string }> {
    // Call Supabase Edge Function to get HeyGen session token
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/heygen-streaming`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await this.getSupabaseToken())}`,
        },
        body: JSON.stringify({ action: "getToken" }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get session token: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get Supabase auth token
   */
  private async getSupabaseToken(): Promise<string> {
    const { supabase } = await import("@/lib/supabase-client");
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  /**
   * Set up event listeners for the avatar
   */
  private setupEventListeners(): void {
    if (!this.avatar) return;

    // Stream ready - attach to video element
    this.avatar.on(StreamingEvents.STREAM_READY, (event: any) => {
      console.log("LiveAvatar stream ready");
      if (event.detail) {
        this.config.onStreamReady?.(event.detail);
      }
    });

    // Avatar speaking events
    this.avatar.on(StreamingEvents.AVATAR_START_TALKING, () => {
      this.isSpeaking = true;
      this.config.onAvatarStartTalking?.();
    });

    this.avatar.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
      this.isSpeaking = false;
      this.config.onAvatarStopTalking?.();
    });

    this.avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (message: any) => {
      this.config.onAvatarMessage?.(message?.text || message);
    });

    // User speaking events
    this.avatar.on(StreamingEvents.USER_START, () => {
      this.config.onUserStartTalking?.();
    });

    this.avatar.on(StreamingEvents.USER_STOP, () => {
      this.config.onUserStopTalking?.();
    });

    this.avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (message: any) => {
      this.config.onUserMessage?.(message?.text || message);
    });

    // Disconnection
    this.avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
      this.isConnected = false;
      this.config.onDisconnected?.();
    });
  }

  /**
   * Make the avatar speak (REPEAT mode - for custom LLM)
   */
  async speak(text: string): Promise<void> {
    if (!this.avatar || !this.isConnected) {
      throw new Error("Avatar session not active");
    }

    try {
      await this.avatar.speak({
        text,
        taskType: TaskType.REPEAT,
        taskMode: "ASYNC",
      });
    } catch (error) {
      console.error("Failed to make avatar speak:", error);
      throw error;
    }
  }

  /**
   * Make the avatar talk (TALK mode - uses HeyGen's LLM)
   */
  async talk(text: string): Promise<void> {
    if (!this.avatar || !this.isConnected) {
      throw new Error("Avatar session not active");
    }

    try {
      await this.avatar.speak({
        text,
        taskType: TaskType.TALK,
        taskMode: "ASYNC",
      });
    } catch (error) {
      console.error("Failed to make avatar talk:", error);
      throw error;
    }
  }

  /**
   * Start voice chat (avatar listens to user)
   */
  async startVoiceChat(useSilencePrompt: boolean = true): Promise<void> {
    if (!this.avatar || !this.isConnected) {
      throw new Error("Avatar session not active");
    }

    try {
      await this.avatar.startVoiceChat({ useSilencePrompt });
    } catch (error) {
      console.error("Failed to start voice chat:", error);
      throw error;
    }
  }

  /**
   * Stop voice chat
   */
  async stopVoiceChat(): Promise<void> {
    if (!this.avatar) return;

    try {
      await this.avatar.closeVoiceChat();
    } catch (error) {
      console.error("Failed to stop voice chat:", error);
    }
  }

  /**
   * Start listening to user
   */
  async startListening(): Promise<void> {
    if (!this.avatar || !this.isConnected) return;

    try {
      await this.avatar.startListening();
    } catch (error) {
      console.error("Failed to start listening:", error);
    }
  }

  /**
   * Stop listening
   */
  async stopListening(): Promise<void> {
    if (!this.avatar) return;

    try {
      await this.avatar.stopListening();
    } catch (error) {
      console.error("Failed to stop listening:", error);
    }
  }

  /**
   * Interrupt current speech
   */
  async interrupt(): Promise<void> {
    if (!this.avatar || !this.isSpeaking) return;

    try {
      await this.avatar.interrupt();
      this.isSpeaking = false;
    } catch (error) {
      console.error("Failed to interrupt avatar:", error);
    }
  }

  /**
   * Stop avatar session
   */
  async stopSession(): Promise<void> {
    if (!this.avatar) return;

    try {
      await this.avatar.stopAvatar();
      this.isConnected = false;
      this.sessionId = null;
      this.accessToken = null;
      console.log("LiveAvatar session stopped");
    } catch (error) {
      console.error("Failed to stop avatar session:", error);
    }
  }

  /**
   * Get current session state
   */
  getState(): {
    isConnected: boolean;
    isSpeaking: boolean;
    sessionId: string | null;
  } {
    return {
      isConnected: this.isConnected,
      isSpeaking: this.isSpeaking,
      sessionId: this.sessionId,
    };
  }
}

/**
 * Create a LiveAvatar client instance
 */
export function createLiveAvatarClient(config: LiveAvatarConfig): LiveAvatarClient {
  return new LiveAvatarClient(config);
}

/**
 * Map Kindred avatar IDs to LiveAvatar/HeyGen avatar IDs
 */
export const LIVEAVATAR_AVATARS: Record<string, { avatarId: string; voiceId: string }> = {
  marco: {
    avatarId: "Elias_Outdoors_public", // Male avatar
    voiceId: "en-US-GuyNeural", // Will be overridden by multilingual system
  },
  sofia: {
    avatarId: "Anna_public", // Female avatar
    voiceId: "en-US-JennyNeural", // Will be overridden by multilingual system
  },
};
