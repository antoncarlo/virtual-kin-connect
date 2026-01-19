import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  RefreshCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Wifi,
  WifiOff,
  Image,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// useLiveAvatar hook removed - now using iframe embed approach
import { useVapiCall } from "@/hooks/useVapiCall";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useBandwidthMonitor } from "@/hooks/useBandwidthMonitor";
import { useTemporalContext } from "@/hooks/useTemporalContext";
import { useIdleGestures } from "@/hooks/useIdleGestures";
import { useAudioVideoSync } from "@/hooks/useAudioVideoSync";
import { VisionResult } from "@/hooks/useVisionProcessing";
import { useLanguage } from "@/hooks/useLanguage";
import { getAvatarGreeting, getVoiceIdForAvatar } from "@/data/avatars";
import { useAvatarIdentity } from "@/hooks/useAvatarIdentity";
import { useSessionInsights } from "@/hooks/useSessionInsights";
import { useMem0 } from "@/hooks/useMem0";
import { recordActivity } from "@/lib/gamification";
import { recordLearningEvent } from "@/lib/adaptive-learning";
import type { SupportedLanguage } from "@/lib/multilingual";
import { QuickChatOverlay } from "./QuickChatOverlay";
import { ConnectionStatus } from "./ConnectionStatus";
import { WelcomeAnimation } from "./WelcomeAnimation";
import { FallbackMode } from "./FallbackMode";
import { DynamicBackground } from "./DynamicBackground";
import { VisionUpload } from "./VisionUpload";
import { CinematicFilter } from "./CinematicFilter";
import { LoadingTransition } from "./LoadingTransition";
import { ResponsiveVideoContainer } from "./ResponsiveVideoContainer";
// Using SDK-based streaming instead of iframe embed
import { useHeyGenStreaming, PUBLIC_AVATARS } from "@/hooks/useHeyGenStreaming";
// New imports for WhatsApp-style UX
import { CallOverlay, type CallState } from "./CallOverlay";
import { useRingtone } from "@/hooks/useRingtone";
import { useAudioOutput } from "@/hooks/useAudioOutput";

interface ImmersiveVideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  avatarId: string;
  avatarPersonality?: string[];
  heygenAvatarId?: string;
  heygenVoiceId?: string;
  heygenGender?: 'male' | 'female';
  vapiAssistantId?: string;
  /** If false, start in audio-only mode (no local camera, no avatar video) */
  videoEnabled?: boolean;
  /** Pre-warmed token from useHeyGenPrewarm hook */
  prewarmToken?: string | null;
  /** Whether pre-warming is complete */
  isPrewarmed?: boolean;
}

export function ImmersiveVideoCall({
  isOpen,
  onClose,
  avatarName,
  avatarImage,
  avatarId,
  avatarPersonality = [],
  heygenAvatarId,
  heygenVoiceId,
  heygenGender = 'male',
  vapiAssistantId,
  videoEnabled = true,
  prewarmToken = null,
  isPrewarmed = false,
}: ImmersiveVideoCallProps) {
  const heygenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // UI State
  const [isCameraOn, setIsCameraOn] = useState(videoEnabled);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showVisionUpload, setShowVisionUpload] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("good");
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isProcessingRAG, setIsProcessingRAG] = useState(false);
  const [loadingStage, setLoadingStage] = useState<"initializing" | "connecting" | "stabilizing" | "ready">("initializing");
  const [isEmbedReady, setIsEmbedReady] = useState(false); // For iframe embed

  // WhatsApp-style call state
  const [callState, setCallState] = useState<CallState>("initiating");
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const firstFrameReceived = useRef(false);
  const overlayShownAt = useRef<number>(0);
  const hasSentKickoffRef = useRef(false);
  const slowConnectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transcripts for overlay
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [pendingText, setPendingText] = useState<string[]>([]);

  // Temporal context for dynamic backgrounds
  const temporalContext = useTemporalContext();

  // Multilingual support - must be before useLiveAvatar
  const { language } = useLanguage();

  // Ringtone for connection feedback (tuuu-tuuu sound)
  const { start: startRingtone, stop: stopRingtone, isPlaying: isRingtonePlaying } = useRingtone({
    frequency: 425,       // European dial tone frequency
    frequency2: 450,      // Slight variation for dual-tone
    toneDuration: 400,    // 400ms tone
    gapDuration: 200,     // 200ms gap
    volume: 0.25,         // Not too loud
    europeanPattern: true,
  });

  // Audio output device selector
  const {
    devices: audioDevices,
    selectedDevice: selectedAudioDevice,
    selectDevice: selectAudioDevice,
    registerElement: registerAudioElement,
    unregisterElement: unregisterAudioElement,
    isSupported: isAudioOutputSupported,
  } = useAudioOutput({
    autoRequestPermission: true,
    onDeviceChange: (deviceId) => {
      console.log("[ImmersiveVideoCall] Audio output changed to:", deviceId);
    },
  });

  // WebRTC Debug logs removed - now using SDK-based streaming
  
  // HeyGen Streaming SDK hook for avatar video
  const {
    isConnecting: isHeyGenConnecting,
    isConnected: isHeyGenConnected,
    isSpeaking: isAvatarSpeaking,
    mediaStream: heygenMediaStream,
    connectionError: heygenConnectionError,
    startSession: startHeyGenSession,
    stopSession: stopHeyGenSession,
    sendText: sendHeyGenText,
    setListeningMode,
    interrupt: interruptHeyGen,
  } = useHeyGenStreaming({
    avatarId: heygenAvatarId || PUBLIC_AVATARS.BRYAN_IT_SITTING,
    voiceId: heygenVoiceId,
    quality: "high",
    onConnected: () => {
      console.log("[ImmersiveVideoCall] HeyGen SDK connected");
      setIsEmbedReady(true);
      setConnectionQuality("excellent");
      setLoadingStage("ready");
      setCallState("buffering");
      
      // Mark first frame received for overlay transition
      if (!firstFrameReceived.current) {
        firstFrameReceived.current = true;
        if (vapiConnectionState === "connected") {
          setShowVideoOverlay(true);
        }
      }
    },
    onDisconnected: () => {
      console.log("[ImmersiveVideoCall] HeyGen SDK disconnected");
      setIsEmbedReady(false);
    },
    onError: (error) => {
      console.error("[ImmersiveVideoCall] HeyGen SDK error:", error);
      setConnectionQuality("poor");
      toast({
        title: "Avatar connection failed",
        description: "Using audio-only mode",
        variant: "destructive",
      });
      setIsFallbackMode(true);
    },
  });

  // Audio-Video sync for Vapi-HeyGen bridge
  const { 
    syncState, 
    markVideoStart, 
    markVideoEnd,
    prepareTextForStreaming 
  } = useAudioVideoSync({
    onSpeechDetected: (speaking) => {
      // Bridge Vapi speech detection to UI state
      setIsUserSpeaking(speaking);
    },
    bufferSize: 80, // Minimal 80ms buffer for low latency
  });

  // Bandwidth monitoring with automatic fallback
  const handleQualityChange = useCallback((quality: "excellent" | "good" | "poor" | "critical") => {
    setConnectionQuality(
      quality === "critical" ? "poor" : quality === "poor" ? "poor" : quality === "good" ? "good" : "excellent"
    );
  }, []);

  const handleFallbackTriggered = useCallback(() => {
    setIsFallbackMode((prev) => {
      if (prev) return prev;
      toast({
        title: "Limited connection",
        description: "Switching to audio-only mode for better quality",
      });
      return true;
    });
  }, [toast]);

  const bandwidthMonitorOptions = useMemo(
    () => ({
      checkInterval: 5000,
      onQualityChange: handleQualityChange,
      onFallbackTriggered: handleFallbackTriggered,
    }),
    [handleQualityChange, handleFallbackTriggered]
  );

  const { bandwidthInfo, isLowBandwidth } = useBandwidthMonitor(bandwidthMonitorOptions);

  // Callbacks for Vapi connection state
  const handleVapiTranscript = useCallback((text: string, isFinal: boolean) => {
    setAssistantTranscript(text);
    if (isFinal && text) {
      setTimeout(() => setAssistantTranscript(""), 4000);
    }
  }, []);

  const handleVapiCallStart = useCallback(() => {
    toast({
      title: "Connected!",
      description: `You're now talking with ${avatarName}`,
    });
  }, [toast, avatarName]);

  const handleVapiSpeechStart = useCallback(() => {
    setIsUserSpeaking(true);
  }, []);

  const handleVapiSpeechEnd = useCallback(() => {
    setIsUserSpeaking(false);
  }, []);

  // Vapi for voice conversation with enhanced state management
  // Pass language and gender for multilingual voice support
  const {
    connectionState: vapiConnectionState,
    isConnecting: isVapiConnecting,
    isConnected: isVapiConnected,
    isSpeaking: isVapiSpeaking,
    isUserSpeaking: isVapiUserSpeaking,
    hasReceivedFirstResponse,
    microphoneStatus,
    startCall: startVapiCall,
    endCall: endVapiCall,
    toggleMute: toggleVapiMute,
    sendMessage: sendVapiMessage,
  } = useVapiCall({
    assistantId: vapiAssistantId,
    // Multilingual support - pass detected language and avatar gender
    language: language as SupportedLanguage,
    avatarGender: heygenGender,
    avatarName: avatarName,
    onTranscript: handleVapiTranscript,
    onCallStart: handleVapiCallStart,
    onUserSpeechStart: handleVapiSpeechStart,
    onUserSpeechEnd: handleVapiSpeechEnd,
    onConnectionStateChange: (state) => {
      console.log('Vapi connection state:', state);
      if (state === "error" || state === "reconnecting") {
        setConnectionQuality("poor");
      } else if (state === "connected") {
        setConnectionQuality("excellent");
      }
    },
  });

  // Handle vision result - with embed, we just show transcript (avatar handles speech internally)
  const handleVisionResult = useCallback((result: VisionResult) => {
    setAssistantTranscript(result.suggestedResponse);
    setTimeout(() => setAssistantTranscript(""), 4000);
  }, []);

  // Handle emotion from vision - not applicable with embed
  const handleVisionEmotion = useCallback((_emotion: VisionResult["emotion"]) => {
    // Embed handles emotions internally
  }, []);

  // Avatar identity and session tracking for video calls
  const { identity: avatarIdentity, affinity: userAffinity, incrementMessages } = useAvatarIdentity(avatarId);
  const { startSession: startInsightSession, endSession: endInsightSession } = useSessionInsights(avatarId);
  
  // Mem0 memory system for video calls
  const {
    memoryContext,
    addMemories,
    getRelevantContext,
    isInitialized: isMem0Ready,
  } = useMem0({ avatarId });

  // Send welcome greeting when embed is ready - Start session tracking
  useEffect(() => {
    if (isEmbedReady && showWelcome) {
      // Hide welcome animation and start session tracking
      setTimeout(() => {
        setShowWelcome(false);
        startInsightSession();
      }, 2000);
    }
  }, [isEmbedReady, showWelcome, startInsightSession]);

  // Show video overlay when both embed and Vapi are ready
  useEffect(() => {
    if (isEmbedReady && vapiConnectionState === "connected" && !firstFrameReceived.current) {
      firstFrameReceived.current = true;
      console.log("[ImmersiveVideoCall] Embed and Vapi ready - showing video");
      setShowVideoOverlay(true);
    }
  }, [isEmbedReady, vapiConnectionState]);

  // VAPI STATE MACHINE (audio-only + video)
  // - Overlay rings immediately
  // - Vapi starts immediately on mount
  // - Ringtone stops ONLY when Vapi is connected (call-start)
  useEffect(() => {
    if (!isOpen || !isInitialized) return;

    // Keep callState in sync with Vapi
    if (vapiConnectionState === "checking-permissions" || vapiConnectionState === "connecting") {
      setCallState("connecting");
      return;
    }

    if (vapiConnectionState === "reconnecting") {
      setCallState("reconnecting");
      return;
    }

    if (vapiConnectionState === "connected") {
      console.log("[ImmersiveVideoCall] Vapi Connesso");

      if (isRingtonePlaying) {
        console.log("[ImmersiveVideoCall] Stop Ringtone");
        stopRingtone();
      }

      setCallState("connected");

      // If the first video frame is already ready, transition to the main video view now
      if (firstFrameReceived.current) {
        setShowVideoOverlay(true);
      }

      // Kickoff audio: force assistant to say something immediately
      if (!hasSentKickoffRef.current) {
        hasSentKickoffRef.current = true;
        console.log("[ImmersiveVideoCall] Kickoff audio → send hidden message");
        sendVapiMessage("Say hello");
      }

      return;
    }

    if (vapiConnectionState === "ended") {
      setCallState("ended");
      return;
    }

    if (vapiConnectionState === "error") {
      setCallState("reconnecting");
    }
  }, [
    isOpen,
    isInitialized,
    vapiConnectionState,
    isRingtonePlaying,
    stopRingtone,
    sendVapiMessage,
  ]);


  const startLocalCamera = useCallback(async () => {
    if (!localVideoRef.current || localStreamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      localStreamRef.current = stream;
      localVideoRef.current.srcObject = stream;
      await localVideoRef.current.play();
      setHasLocalVideo(true);
    } catch (error) {
      console.error("Camera error:", error);
      setHasLocalVideo(false);
    }
  }, []);

  const stopLocalCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setHasLocalVideo(false);
  }, []);

  // Switch camera (mobile)
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;
    
    const currentTrack = localStreamRef.current.getVideoTracks()[0];
    const currentFacing = currentTrack?.getSettings().facingMode || "user";
    const newFacing = currentFacing === "user" ? "environment" : "user";
    
    stopLocalCamera();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacing },
        audio: false,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }
      setHasLocalVideo(true);
    } catch (error) {
      console.error("Switch camera error:", error);
      startLocalCamera();
    }
  }, [stopLocalCamera, startLocalCamera]);

  // Initialize when modal opens - eager Vapi connection + ringtone
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      setShowWelcome(true);
      setLoadingStage("initializing");

      // Reset per-call refs
      hasSentKickoffRef.current = false;
      firstFrameReceived.current = false;
      overlayShownAt.current = Date.now();

      // UI: overlay immediately + ring
      setCallState("initiating");
      setShowVideoOverlay(false);
      setIsSlowConnection(false);
      startRingtone();

      // Start 5-second timeout timer for friendly message
      slowConnectionTimerRef.current = setTimeout(() => {
        setIsSlowConnection(true);
      }, 5000);

      // BACKEND: start Vapi IMMEDIATAMENTE (always, even audio-only)
      console.log("[ImmersiveVideoCall] Avvio connessione Vapi...");
      setLoadingStage("connecting");
      setCallState("connecting");
      startVapiCall();

      // Video path: start local camera AND HeyGen SDK session
      if (videoEnabled) {
        startLocalCamera();
        setLoadingStage("stabilizing");
        
        // Start HeyGen SDK session for avatar streaming
        console.log("[ImmersiveVideoCall] Starting HeyGen SDK session...");
        startHeyGenSession(heygenVideoRef.current || undefined);
      } else {
        // Ensure camera is off in audio-only mode
        setIsCameraOn(false);
        stopLocalCamera();
      }
    }

    if (!isOpen && isInitialized) {
      stopRingtone();

      // Clear slow connection timer
      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
        slowConnectionTimerRef.current = null;
      }

      stopLocalCamera();
      stopHeyGenSession(); // Stop HeyGen SDK session
      endVapiCall();

      setCallDuration(0);
      setIsInitialized(false);
      setShowWelcome(true);
      setCallState("ended");
      setIsSlowConnection(false);
      setIsEmbedReady(false);
      firstFrameReceived.current = false;
      setShowVideoOverlay(false);
      hasSentKickoffRef.current = false;

      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [
    isOpen,
    isInitialized,
    videoEnabled,
    startLocalCamera,
    stopLocalCamera,
    startVapiCall,
    endVapiCall,
    startRingtone,
    stopRingtone,
    startHeyGenSession,
    stopHeyGenSession,
  ]);

  // Call duration timer - start as soon as the call is connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVapiConnected || isEmbedReady) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVapiConnected, isEmbedReady]);
  
  // Attach HeyGen media stream to video element when it changes
  useEffect(() => {
    if (heygenMediaStream && heygenVideoRef.current) {
      console.log("[ImmersiveVideoCall] Attaching HeyGen media stream to video element");
      heygenVideoRef.current.srcObject = heygenMediaStream;
      heygenVideoRef.current.play().catch(e => {
        console.warn("[ImmersiveVideoCall] Video play error:", e);
      });
    }
  }, [heygenMediaStream]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = useCallback(() => {
    console.log("[ImmersiveVideoCall] Closing call...");
    
    // Stop ringtone immediately
    stopRingtone();
    
    // Clear slow connection timer
    if (slowConnectionTimerRef.current) {
      clearTimeout(slowConnectionTimerRef.current);
      slowConnectionTimerRef.current = null;
    }
    
    // Stop local camera
    stopLocalCamera();
    
    // Stop HeyGen SDK session
    try {
      stopHeyGenSession();
    } catch (e) {
      console.warn("[ImmersiveVideoCall] HeyGen cleanup error:", e);
    }
    
    // End Vapi call (fire and forget)
    try {
      endVapiCall();
    } catch (e) {
      console.warn("[ImmersiveVideoCall] Vapi cleanup error:", e);
    }
    
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    
    // Track activity and save memories in background (non-blocking)
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id && callDuration > 0) {
          await Promise.all([
            recordActivity(session.user.id, 'video_call'),
            recordLearningEvent(
              session.user.id,
              avatarId,
              'message',
              `Video call duration: ${callDuration} seconds`,
              { type: 'video_call', duration: callDuration }
            ),
            incrementMessages(),
          ]);
          
          const messages = assistantTranscript ? [{ role: 'assistant' as const, content: assistantTranscript }] : [];
          await endInsightSession(messages, avatarId);
          
          // Save call transcript to Mem0 for future context
          if (isMem0Ready && assistantTranscript && userTranscript) {
            try {
              await addMemories(
                [
                  { role: "user", content: userTranscript },
                  { role: "assistant", content: assistantTranscript },
                ],
                {
                  avatar_id: avatarId,
                  avatar_name: avatarName,
                  call_type: videoEnabled ? "video" : "audio",
                  call_duration: callDuration,
                }
              );
              console.log("[ImmersiveVideoCall] Saved call transcript to Mem0");
            } catch (err) {
              console.warn("[ImmersiveVideoCall] Failed to save to Mem0:", err);
            }
          }
        }
      } catch (error) {
        console.error('[ImmersiveVideoCall] Failed to record activity:', error);
      }
    })();
    
    // Close immediately - don't wait for tracking
    onClose();
  }, [
    stopRingtone,
    stopLocalCamera,
    endVapiCall,
    callDuration,
    avatarId,
    avatarName,
    videoEnabled,
    userTranscript,
    assistantTranscript,
    incrementMessages,
    endInsightSession,
    isMem0Ready,
    addMemories,
    onClose,
  ]);

  const handleToggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const handleToggleMic = () => {
    const newMicState = !isMicOn;
    setIsMicOn(newMicState);
    toggleVapiMute(!newMicState);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isConnecting = isVapiConnecting || vapiConnectionState === "checking-permissions";
  const isConnected = isEmbedReady || isVapiConnected;
  const isSpeaking = isVapiSpeaking;
  const isUserCurrentlySpeaking = isUserSpeaking || isVapiUserSpeaking;

  // Format audio devices for CallOverlay
  const formattedAudioDevices = audioDevices.map(d => ({
    deviceId: d.deviceId,
    label: d.label,
    kind: d.kind as "audiooutput" | "audioinput",
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* WhatsApp-style Call Overlay - shows only during connection */}
          <CallOverlay
            isOpen={callState === "initiating" || callState === "connecting" || callState === "reconnecting"}
            callState={callState}
            avatarName={avatarName}
            avatarImage={avatarImage}
            callDuration={callDuration}
            isMuted={!isMicOn}
            isCameraOn={isCameraOn}
            isSpeaking={isSpeaking}
            isUserSpeaking={isUserCurrentlySpeaking}
            connectionQuality={connectionQuality}
            isSlowConnection={isSlowConnection}
            onMuteToggle={handleToggleMic}
            onVideoToggle={handleToggleCamera}
            onAudioOutputChange={selectAudioDevice}
            onEndCall={handleClose}
            audioDevices={formattedAudioDevices}
            selectedAudioDevice={selectedAudioDevice}
            showVideoToggle={videoEnabled}
          />

          {/* Main Video View - always visible when call is open */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            {/* Dynamic Background with temporal lighting */}
            <DynamicBackground temporalContext={temporalContext}>
              {/* Responsive Video Container with Cinematic Effects */}
              <ResponsiveVideoContainer
                isConnecting={isConnecting}
                isConnected={isEmbedReady}
                temporalWarmth={temporalContext.timeOfDay === "evening" || temporalContext.timeOfDay === "night" ? 50 : 25}
              >
                {/* Fallback Mode - Voice Only with Static Image */}
                <AnimatePresence>
                  {isFallbackMode && (
                    <FallbackMode
                      avatarImage={avatarImage}
                      avatarName={avatarName}
                      isActive={isFallbackMode}
                    />
                  )}
                </AnimatePresence>

                {/* Main Avatar Video - HeyGen SDK WebRTC Stream */}
                {!isFallbackMode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {/* HeyGen Video Element - receives WebRTC stream from SDK */}
                    <video
                      ref={heygenVideoRef}
                      autoPlay
                      playsInline
                      muted={false}
                      className="w-full h-full object-cover"
                      style={{ backgroundColor: "#000" }}
                    />
                    
                    {/* Loading overlay while connecting */}
                    {isHeyGenConnecting && !isHeyGenConnected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm text-muted-foreground">Connecting to avatar...</p>
                      </div>
                    )}
                    
                    {/* Cinematic overlay on video */}
                    {isHeyGenConnected && (
                      <CinematicFilter
                        intensity="light"
                        warmth={temporalContext.timeOfDay === "evening" ? 45 : temporalContext.timeOfDay === "night" ? 30 : 20}
                        grain={true}
                        vignette={true}
                        isConnecting={false}
                      />
                    )}
                  </div>
                )}

              {/* Loading Transition with Blur Effect */}
              <LoadingTransition
                isLoading={isConnecting && loadingStage !== "ready"}
                avatarName={avatarName}
                stage={loadingStage}
              />

            {/* Welcome Animation Overlay */}
            <AnimatePresence>
              {showWelcome && isConnecting && (
                <WelcomeAnimation avatarName={avatarName} />
              )}
            </AnimatePresence>

            {/* Connection Loading Overlay */}
            <AnimatePresence>
              {isConnecting && !showWelcome && (
                <ConnectionStatus status="connecting" avatarName={avatarName} />
              )}
            </AnimatePresence>

            {/* WebRTC Debug Panel - Removed for production */}

            {/* Top Status Bar - Glassmorphism */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute top-0 left-0 right-0 z-20"
            >
              <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-xl">
                {/* Avatar Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={avatarImage}
                      alt={avatarName}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/30 object-cover"
                    />
                    {isConnected && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm md:text-base flex items-center gap-2">
                      {avatarName}
                      {isSpeaking && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                        </motion.span>
                      )}
                    </h3>
                    <p className="text-xs text-white/60">
                      {vapiConnectionState === "checking-permissions" 
                        ? "Checking permissions..." 
                        : vapiConnectionState === "reconnecting"
                        ? "Reconnecting..."
                        : microphoneStatus === "denied"
                        ? "Microphone blocked"
                        : isSpeaking 
                        ? "Speaking..." 
                        : isUserCurrentlySpeaking
                        ? "Listening to you..."
                        : isConnected && hasReceivedFirstResponse
                        ? formatDuration(callDuration) 
                        : isConnected
                        ? "Waiting..."
                        : "Connecting..."}
                    </p>
                  </div>
                </div>

                {/* Connection Quality & Fullscreen */}
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    connectionQuality === "excellent" ? "bg-green-500/20 text-green-400" :
                    connectionQuality === "good" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {connectionQuality === "poor" ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                    <span className="hidden md:inline">
                      {connectionQuality === "excellent" ? "HD" : connectionQuality === "good" ? "SD" : "Bassa"}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleFullscreen}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Picture-in-Picture - Local Video */}
            <AnimatePresence>
              {hasLocalVideo && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  drag
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.1}
                  className="absolute top-20 right-4 md:bottom-32 md:top-auto w-24 h-32 md:w-36 md:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl z-30"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`}
                  />
                  {!isCameraOn && (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-800 text-white/60">
                      <VideoOff className="w-6 h-6 mb-1" />
                      <p className="text-xs">Off</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Transcript Overlay */}
            <AnimatePresence>
              {(assistantTranscript || userTranscript) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-32 left-4 right-4 md:left-8 md:right-8 z-20"
                >
                  <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 max-w-lg mx-auto">
                    {assistantTranscript && (
                      <p className="text-white text-sm md:text-base text-center">
                        <span className="text-primary font-medium">{avatarName}:</span> {assistantTranscript}
                      </p>
                    )}
                    {userTranscript && (
                      <p className="text-white/80 text-sm text-center mt-1">
                        <span className="text-white/60">Tu:</span> {userTranscript}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Speaking Indicator Wave */}
            <AnimatePresence>
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-40 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20"
                >
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: [12, 24, 12],
                      }}
                      transition={{
                        duration: 0.5,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-1 bg-primary rounded-full"
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Control Bar - Centered with safe area */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
            >
              <div className="flex items-center justify-center gap-3 md:gap-4 p-4 px-6 bg-black/50 backdrop-blur-xl rounded-full border border-white/10">
                {/* Camera Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full w-11 h-11 md:w-12 md:h-12 transition-all ${
                    isCameraOn 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-red-500/80 hover:bg-red-500 text-white"
                  }`}
                  onClick={handleToggleCamera}
                >
                  {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>

                {/* Switch Camera (mobile only) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-11 h-11 md:hidden bg-white/10 hover:bg-white/20 text-white"
                  onClick={switchCamera}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

                {/* Mic Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full w-11 h-11 md:w-12 md:h-12 transition-all ${
                    isMicOn 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-red-500/80 hover:bg-red-500 text-white"
                  }`}
                  onClick={handleToggleMic}
                  disabled={!isVapiConnected}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>

                {/* End Call - Larger */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-14 h-14 md:w-16 md:h-16 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 mx-2"
                  onClick={handleClose}
                >
                  <Phone className="w-6 h-6 rotate-[135deg]" />
                </Button>

                {/* Quick Chat */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowQuickChat(true)}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>

                {/* Vision Upload */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowVisionUpload(true)}
                >
                  <Image className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>

            {/* Quick Chat Overlay with RAG Integration */}
            <QuickChatOverlay
              isOpen={showQuickChat}
              onClose={() => setShowQuickChat(false)}
              avatarName={avatarName}
              avatarImage={avatarImage}
              avatarId={avatarId}
              avatarPersonality={avatarPersonality}
              onSendMessage={(text) => {
                // With embed, just show transcript (embed handles speech internally)
                setAssistantTranscript(text);
                setTimeout(() => setAssistantTranscript(""), 4000);
              }}
            />

            {/* Vision Upload for Real-time Image Analysis */}
            <VisionUpload
              isOpen={showVisionUpload}
              onClose={() => setShowVisionUpload(false)}
              onResult={handleVisionResult}
              onEmotionChange={handleVisionEmotion}
            />
              </ResponsiveVideoContainer>
            </DynamicBackground>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
