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
import { useLiveAvatar } from "@/hooks/useLiveAvatar";
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
import { WebRTCDebugPanel, useWebRTCDebugLogs } from "./WebRTCDebugPanel";
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
}: ImmersiveVideoCallProps) {
  const heygenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // UI State
  const [isCameraOn, setIsCameraOn] = useState(true);
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

  // WhatsApp-style call state
  const [callState, setCallState] = useState<CallState>("initiating");
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const firstFrameReceived = useRef(false);
  const overlayShownAt = useRef<number>(0);
  const hasSentKickoffRef = useRef(false);

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

  // WebRTC Debug logs
  const { logs: debugLogs, connectionState, iceConnectionState, iceGatheringState, addLog, clearLogs, updateConnectionStates } = useWebRTCDebugLogs();

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
        title: "Connessione limitata",
        description: "Passaggio a modalità solo audio per garantire la qualità",
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

  // Stable callback refs
  const handleHeyGenConnected = useCallback(() => {
    console.log("HeyGen connected - video stabilized");
    setConnectionQuality("excellent");
    setLoadingStage("ready");
    setCallState("buffering");
    markVideoStart();
  }, [markVideoStart]);

  const handleHeyGenError = useCallback((error: Error) => {
    console.error("HeyGen error:", error);
    setConnectionQuality("poor");
  }, []);

  const handleHeyGenSpeaking = useCallback((speaking: boolean) => {
    if (speaking) {
      markVideoStart();
    } else {
      markVideoEnd();
      if (pendingText.length > 0) {
        // Process next queued text
        const [next, ...rest] = pendingText;
        setPendingText(rest);
      }
    }
  }, [pendingText, markVideoStart, markVideoEnd]);

  const handleHeyGenProcessing = useCallback((processing: boolean) => {
    setIsProcessingRAG(processing);
  }, []);

  const handleVapiTranscript = useCallback((text: string, isFinal: boolean) => {
    setAssistantTranscript(text);
    if (isFinal && text) {
      setTimeout(() => setAssistantTranscript(""), 4000);
    }
  }, []);

  const handleVapiCallStart = useCallback(() => {
    toast({
      title: "Connesso!",
      description: `Stai parlando con ${avatarName}`,
    });
  }, [toast, avatarName]);

  const handleVapiSpeechStart = useCallback(() => {
    setIsUserSpeaking(true);
  }, []);

  const handleVapiSpeechEnd = useCallback(() => {
    setIsUserSpeaking(false);
  }, []);

  // LiveAvatar streaming for realistic avatar (replaces HeyGen SDK)
  const {
    isConnecting: isLiveAvatarConnecting,
    isConnected: isLiveAvatarConnected,
    isSpeaking: isLiveAvatarSpeaking,
    isUserSpeaking: isLiveAvatarUserSpeaking,
    mediaStream: liveAvatarStream,
    sessionId: liveAvatarSessionId,
    error: liveAvatarError,
    startSession: startLiveAvatarSession,
    stopSession: stopLiveAvatarSession,
    speak: sendLiveAvatarText,
    interrupt: interruptLiveAvatar,
  } = useLiveAvatar({
    avatarId: heygenAvatarId || "Bryan_IT_Sitting_public",
    voiceId: heygenVoiceId,
    gender: heygenGender,
    language: language as SupportedLanguage,
    onConnected: handleHeyGenConnected,
    onAvatarSpeaking: handleHeyGenSpeaking,
    onError: handleHeyGenError,
  });

  // Alias for backward compatibility
  const isHeyGenConnecting = isLiveAvatarConnecting;
  const isHeyGenConnected = isLiveAvatarConnected;
  const isHeyGenSpeaking = isLiveAvatarSpeaking;
  const isHeyGenProcessing = false; // LiveAvatar handles this internally
  const heygenStream = liveAvatarStream;
  const connectionError = liveAvatarError?.message || null;
  const startHeyGenSession = startLiveAvatarSession;
  const stopHeyGenSession = stopLiveAvatarSession;
  const sendHeyGenText = sendLiveAvatarText;

  // Helper functions for gestures and emotions via Edge Function
  const sendHeyGenGesture = useCallback(async (gesture: "wave" | "nod" | "smile") => {
    if (!liveAvatarSessionId) return;
    try {
      await supabase.functions.invoke("heygen-streaming", {
        body: {
          action: "send-gesture",
          sessionId: liveAvatarSessionId,
          gesture,
        },
      });
    } catch (err) {
      console.warn("[LiveAvatar] Gesture not supported:", err);
    }
  }, [liveAvatarSessionId]);

  const setHeyGenEmotion = useCallback(async (emotion: "neutral" | "happy" | "sad" | "surprised" | "serious") => {
    if (!liveAvatarSessionId) return;
    try {
      await supabase.functions.invoke("heygen-streaming", {
        body: {
          action: "set-emotion",
          sessionId: liveAvatarSessionId,
          emotion,
        },
      });
    } catch (err) {
      console.warn("[LiveAvatar] Emotion not supported:", err);
    }
  }, [liveAvatarSessionId]);

  // Idle gestures for natural movement during silence
  useIdleGestures({
    isConnected: isHeyGenConnected,
    isSpeaking: isHeyGenSpeaking,
    isProcessing: isProcessingRAG || isHeyGenProcessing,
    isUserSpeaking,
    onGesture: (gesture) => {
      // Map gesture types to HeyGen gestures
      const gestureMap: Record<string, "wave" | "nod" | "smile"> = {
        nod: "nod",
        smile: "smile",
        listening: "nod",
        thinking: "nod",
        blink: "nod", // HeyGen handles blink automatically, use nod as fallback
      };
      const heygenGesture = gestureMap[gesture] || "nod";
      sendHeyGenGesture(heygenGesture);
    },
    config: {
      minInterval: 4000,
      maxInterval: 10000,
    },
  });

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

  // Handle vision result
  const handleVisionResult = useCallback((result: VisionResult) => {
    sendHeyGenText(result.suggestedResponse);
    setAssistantTranscript(result.suggestedResponse);
    setTimeout(() => setAssistantTranscript(""), 4000);
  }, [sendHeyGenText]);

  // Handle emotion from vision
  const handleVisionEmotion = useCallback((emotion: VisionResult["emotion"]) => {
    const emotionMap: Record<VisionResult["emotion"], "neutral" | "happy" | "sad" | "surprised" | "serious"> = {
      neutral: "neutral",
      happy: "happy",
      interested: "happy",
      surprised: "surprised",
      thoughtful: "serious",
    };
    setHeyGenEmotion(emotionMap[emotion]);
  }, [setHeyGenEmotion]);

  // Avatar identity and session tracking for video calls
  const { identity: avatarIdentity, affinity: userAffinity, incrementMessages } = useAvatarIdentity(avatarId);
  const { startSession: startInsightSession, endSession: endInsightSession } = useSessionInsights(avatarId);

  // Send welcome greeting when connected - MULTILINGUAL
  useEffect(() => {
    if (isHeyGenConnected && showWelcome) {
      // Get avatar object for greeting - use the actual heygenGender prop
      const avatar = {
        id: avatarId,
        name: avatarName,
        heygenGender: heygenGender,
      };

      // Use multilingual greeting based on detected language
      const greeting = getAvatarGreeting(avatar as any, language as SupportedLanguage);

      // Delay to let the video stabilize
      const timer = setTimeout(() => {
        // Only send to HeyGen for lip-sync (no audio - VAPI handles audio)
        sendHeyGenText(greeting);
        setAssistantTranscript(greeting);
        setTimeout(() => setAssistantTranscript(""), 3000);
      }, 1500);

      // Hide welcome animation and start session tracking
      setTimeout(() => {
        setShowWelcome(false);
        startInsightSession();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isHeyGenConnected, showWelcome, sendHeyGenText, avatarId, avatarName, heygenGender, language, startInsightSession]);

  // Sync Vapi transcript to HeyGen lip-sync with buffering
  useEffect(() => {
    if (assistantTranscript && isHeyGenConnected && !isHeyGenSpeaking) {
      sendHeyGenText(assistantTranscript);
    } else if (assistantTranscript && isHeyGenConnected && isHeyGenSpeaking) {
      // Queue the text if already speaking
      setPendingText(prev => [...prev, assistantTranscript]);
    }
  }, [assistantTranscript, isHeyGenConnected, isHeyGenSpeaking, sendHeyGenText]);

  // Attach HeyGen stream to video element
  useEffect(() => {
    if (heygenStream && heygenVideoRef.current) {
      heygenVideoRef.current.srcObject = heygenStream;
      heygenVideoRef.current.play().catch(console.error);

      // Register for audio output management
      if (isAudioOutputSupported) {
        registerAudioElement(heygenVideoRef.current);
      }
    }

    return () => {
      if (heygenVideoRef.current && isAudioOutputSupported) {
        unregisterAudioElement(heygenVideoRef.current);
      }
    };
  }, [heygenStream, isAudioOutputSupported, registerAudioElement, unregisterAudioElement]);

  // Handle first frame - stop ringtone and show video
  useEffect(() => {
    const video = heygenVideoRef.current;
    if (!video || !heygenStream) return;

    const handleLoadedData = () => {
      if (!firstFrameReceived.current) {
        firstFrameReceived.current = true;
        console.log("[ImmersiveVideoCall] First frame received - stopping ringtone");

        // Stop the ringtone immediately
        stopRingtone();

        // Ensure the WhatsApp overlay is visible for at least a short moment
        const MIN_OVERLAY_MS = 800;
        const elapsed = Date.now() - (overlayShownAt.current || Date.now());
        const delayMs = Math.max(0, MIN_OVERLAY_MS - elapsed);

        window.setTimeout(() => {
          setCallState("connected");
          setShowVideoOverlay(true);
        }, delayMs);
      }
    };

    video.addEventListener("loadeddata", handleLoadedData);

    // Also check if video already has data
    if (video.readyState >= 2 && !firstFrameReceived.current) {
      handleLoadedData();
    }

    return () => {
      video.removeEventListener("loadeddata", handleLoadedData);
    };
  }, [heygenStream, stopRingtone]);

  // Start local camera
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

  // Initialize when modal opens - WhatsApp-style with ringtone
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      setShowWelcome(true);
      setLoadingStage("initializing");

      // STEP 1: Show WhatsApp overlay immediately (perceived latency = 0)
      setCallState("initiating");
      setShowVideoOverlay(false);
      overlayShownAt.current = Date.now();
      firstFrameReceived.current = false;

      // STEP 2: Start ringtone immediately for audio feedback
      startRingtone();

      // STEP 3: Start local camera
      startLocalCamera();

      // STEP 4: Parallel initialization for reduced latency
      // Start both Vapi and HeyGen in parallel
      const initTimer = setTimeout(() => {
        setCallState("connecting");
        setLoadingStage("connecting");

        // Start Vapi call
        if (vapiAssistantId) {
          startVapiCall();
        }

        // Start HeyGen session in parallel
        if (heygenAvatarId && heygenVideoRef.current) {
          setLoadingStage("stabilizing");
          startHeyGenSession(heygenVideoRef.current);
        }
      }, 100); // Minimal delay for UI to render

      return () => {
        clearTimeout(initTimer);
      };
    }

    if (!isOpen && isInitialized) {
      // Stop ringtone if still playing
      stopRingtone();

      stopLocalCamera();
      stopHeyGenSession();
      endVapiCall();
      setCallDuration(0);
      setIsInitialized(false);
      setShowWelcome(true);
      setCallState("ended");
      firstFrameReceived.current = false;
      setShowVideoOverlay(false);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [isOpen, isInitialized, heygenAvatarId, vapiAssistantId, startLocalCamera, startHeyGenSession, startVapiCall, stopLocalCamera, stopHeyGenSession, endVapiCall, startRingtone, stopRingtone]);

  // Call duration timer - only start after first response (welcome message)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Only start timer when we've received the first response from Marco
    if (hasReceivedFirstResponse && (isVapiConnected || isHeyGenConnected)) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVapiConnected, isHeyGenConnected, hasReceivedFirstResponse]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = async () => {
    // Track video call activity for gamification
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id && callDuration > 0) {
        // Record activity for gamification
        await recordActivity(session.user.id, 'video_call');

        // Record learning event
        await recordLearningEvent(
          session.user.id,
          avatarId,
          'message',
          `Video call duration: ${callDuration} seconds`,
          { type: 'video_call', duration: callDuration }
        );

        // Increment avatar affinity
        await incrementMessages();

        // End session insights tracking
        const messages = assistantTranscript ? [{ role: 'assistant' as const, content: assistantTranscript }] : [];
        await endInsightSession(messages, avatarId);
      }
    } catch (error) {
      console.error('Failed to record video call activity:', error);
    }

    stopLocalCamera();
    stopHeyGenSession();
    endVapiCall();
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onClose();
  };

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

  const isConnecting = isHeyGenConnecting || isVapiConnecting || vapiConnectionState === "checking-permissions";
  const isConnected = isHeyGenConnected || isVapiConnected;
  const isSpeaking = isHeyGenSpeaking || isVapiSpeaking;
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
          {/* WhatsApp-style Call Overlay - shows until first frame */}
          <CallOverlay
            isOpen={!showVideoOverlay}
            callState={callState}
            avatarName={avatarName}
            avatarImage={avatarImage}
            callDuration={callDuration}
            isMuted={!isMicOn}
            isCameraOn={isCameraOn}
            isSpeaking={isSpeaking}
            isUserSpeaking={isUserCurrentlySpeaking}
            connectionQuality={connectionQuality}
            onMuteToggle={handleToggleMic}
            onVideoToggle={handleToggleCamera}
            onAudioOutputChange={selectAudioDevice}
            onEndCall={handleClose}
            audioDevices={formattedAudioDevices}
            selectedAudioDevice={selectedAudioDevice}
          />

          {/* Main Video View - shows after first frame */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showVideoOverlay ? 1 : 0 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] bg-black ${!showVideoOverlay ? 'pointer-events-none' : ''}`}
          >
            {/* Dynamic Background with temporal lighting */}
            <DynamicBackground temporalContext={temporalContext}>
              {/* Responsive Video Container with Cinematic Effects */}
              <ResponsiveVideoContainer
                isConnecting={isConnecting}
                isConnected={isHeyGenConnected}
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

                {/* Main Avatar Video - Full Screen with Aspect Ratio */}
                {!isFallbackMode && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    {isHeyGenConnected ? (
                      <>
                        {/* CRITICAL: Video must be muted - audio comes from VAPI */}
                        <video
                        ref={heygenVideoRef}
                        id="heygen-video-render"
                        autoPlay
                        playsInline
                        muted={true}
                        className="w-full h-full object-cover"
                        style={{ filter: temporalContext.lightingFilter }}
                      />
                      {/* Cinematic overlay on video */}
                      <CinematicFilter
                        intensity="light"
                        warmth={temporalContext.timeOfDay === "evening" ? 45 : temporalContext.timeOfDay === "night" ? 30 : 20}
                        grain={true}
                        vignette={true}
                        isConnecting={false}
                      />
                    </>
                  ) : connectionError ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full bg-black/80 text-white p-8"
                    >
                      <div className="text-red-500 mb-4 text-4xl">⚠️</div>
                      <h3 className="text-xl font-semibold mb-2">Errore Connessione Video</h3>
                      <p className="text-white/70 text-center mb-4 max-w-md">{connectionError}</p>
                      <p className="text-sm text-white/50">Controlla la console per i dettagli debug</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      animate={isSpeaking ? { scale: [1, 1.02, 1] } : isUserCurrentlySpeaking ? { scale: [1, 1.01, 1] } : {}}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                      className="relative flex items-center justify-center"
                    >
                      {/* Glow effect */}
                      <motion.div 
                        animate={{ 
                          opacity: isSpeaking ? [0.6, 0.8, 0.6] : isUserCurrentlySpeaking ? [0.3, 0.5, 0.3] : [0.2, 0.4, 0.2],
                          scale: isSpeaking ? [1, 1.1, 1] : [1, 1.05, 1]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary blur-3xl"
                        style={{ width: '120%', height: '120%', left: '-10%', top: '-10%' }}
                      />
                      
                      {/* Avatar Image - Centered */}
                      <div className="relative z-10">
                        <img
                          src={avatarImage}
                          alt={avatarName}
                          className="w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 lg:w-80 lg:h-80 rounded-full object-cover border-4 border-white/30 shadow-2xl"
                        />
                        
                        {/* Speaking ring animation */}
                        {isSpeaking && (
                          <motion.div
                            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-4 border-primary"
                          />
                        )}
                        
                        {/* Listening indicator */}
                        {isUserCurrentlySpeaking && (
                          <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.3, 0.6] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 rounded-full border-2 border-white/50"
                          />
                        )}
                      </div>
                    </motion.div>
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

            {/* WebRTC Debug Panel */}
            <WebRTCDebugPanel
              logs={debugLogs}
              isVisible={true}
              connectionState={connectionState}
              iceConnectionState={iceConnectionState}
              iceGatheringState={iceGatheringState}
            />

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
                        ? "Verifica permessi..." 
                        : vapiConnectionState === "reconnecting"
                        ? "Riconnessione..."
                        : microphoneStatus === "denied"
                        ? "Microfono bloccato"
                        : isSpeaking 
                        ? "Sta parlando..." 
                        : isUserCurrentlySpeaking
                        ? "Ti sto ascoltando..."
                        : isConnected && hasReceivedFirstResponse
                        ? formatDuration(callDuration) 
                        : isConnected
                        ? "In attesa..."
                        : "Connessione..."}
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
                sendHeyGenText(text);
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
