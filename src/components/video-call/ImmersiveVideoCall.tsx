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
import { useLiveKitCall, type LiveKitConnectionState } from "@/hooks/useLiveKitCall";
import { supabase } from "@/lib/supabase-client";
import { useToast } from "@/hooks/use-toast";
import { useBandwidthMonitor } from "@/hooks/useBandwidthMonitor";
import { useTemporalContext } from "@/hooks/useTemporalContext";
import { VisionResult } from "@/hooks/useVisionProcessing";
import { useLanguage } from "@/hooks/useLanguage";
import { useAvatarIdentity } from "@/hooks/useAvatarIdentity";
import { useSessionInsights } from "@/hooks/useSessionInsights";
import { useMem0 } from "@/hooks/useMem0";
import { recordActivity } from "@/lib/gamification";
import { recordLearningEvent } from "@/lib/adaptive-learning";
import { QuickChatOverlay } from "./QuickChatOverlay";
import { ConnectionStatus } from "./ConnectionStatus";
import { WelcomeAnimation } from "./WelcomeAnimation";
import { FallbackMode } from "./FallbackMode";
import { DynamicBackground } from "./DynamicBackground";
import { VisionUpload } from "./VisionUpload";
import { CinematicFilter } from "./CinematicFilter";
import { LoadingTransition } from "./LoadingTransition";
import { ResponsiveVideoContainer } from "./ResponsiveVideoContainer";
import { useHeyGenStreaming, PUBLIC_AVATARS } from "@/hooks/useHeyGenStreaming";
import { CallOverlay, type CallState } from "./CallOverlay";
import { useRingtone } from "@/hooks/useRingtone";
import { useAudioOutput } from "@/hooks/useAudioOutput";
import { Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant, Participant } from "livekit-client";

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
  videoEnabled = true,
  prewarmToken = null,
  isPrewarmed = false,
}: ImmersiveVideoCallProps) {
  const heygenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
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
  const [loadingStage, setLoadingStage] = useState<"initializing" | "connecting" | "stabilizing" | "ready">("initializing");

  // WhatsApp-style call state
  const [callState, setCallState] = useState<CallState>("initiating");
  const [showVideoOverlay, setShowVideoOverlay] = useState(false);
  const [isSlowConnection, setIsSlowConnection] = useState(false);
  const firstFrameReceived = useRef(false);
  const overlayShownAt = useRef<number>(0);
  const slowConnectionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transcripts for overlay
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");

  // Temporal context for dynamic backgrounds
  const temporalContext = useTemporalContext();

  // Multilingual support
  const { language } = useLanguage();

  // Ringtone for connection feedback
  const { start: startRingtone, stop: stopRingtone, isPlaying: isRingtonePlaying } = useRingtone({
    frequency: 425,
    frequency2: 450,
    toneDuration: 400,
    gapDuration: 200,
    volume: 0.25,
    europeanPattern: true,
  });

  // Audio output device selector
  const {
    devices: audioDevices,
    selectedDevice: selectedAudioDevice,
    selectDevice: selectAudioDevice,
  } = useAudioOutput({
    autoRequestPermission: true,
  });

  // HeyGen Streaming SDK hook for avatar video (optional, for video mode)
  const {
    isConnecting: isHeyGenConnecting,
    isConnected: isHeyGenConnected,
    isSpeaking: isAvatarSpeaking,
    mediaStream: heygenMediaStream,
    startSession: startHeyGenSession,
    stopSession: stopHeyGenSession,
  } = useHeyGenStreaming({
    avatarId: heygenAvatarId || PUBLIC_AVATARS.BRYAN_IT_SITTING,
    voiceId: heygenVoiceId,
    quality: "high",
    onConnected: () => {
      console.log("[ImmersiveVideoCall] HeyGen SDK connected");
      setConnectionQuality("excellent");
      setLoadingStage("ready");
      
      if (!firstFrameReceived.current) {
        firstFrameReceived.current = true;
        if (liveKitConnectionState === "connected") {
          setShowVideoOverlay(true);
        }
      }
    },
    onDisconnected: () => {
      console.log("[ImmersiveVideoCall] HeyGen SDK disconnected");
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

  // LiveKit call hook - replaces Vapi
  const {
    connectionState: liveKitConnectionState,
    isConnecting: isLiveKitConnecting,
    isConnected: isLiveKitConnected,
    isMuted: isLiveKitMuted,
    isCameraOn: isLiveKitCameraOn,
    activeSpeakers,
    audioTrack,
    videoTrack,
    isAgentSpeaking,
    startCall: startLiveKitCall,
    endCall: endLiveKitCall,
    toggleMute: toggleLiveKitMute,
    toggleCamera: toggleLiveKitCamera,
    microphoneStatus,
  } = useLiveKitCall({
    avatarId,
    avatarName,
    onConnected: () => {
      console.log("[ImmersiveVideoCall] LiveKit connected");
      
      toast({
        title: "Connected!",
        description: `You're now talking with ${avatarName}`,
      });
      
      if (firstFrameReceived.current) {
        setShowVideoOverlay(true);
      }
    },
    onDisconnected: () => {
      console.log("[ImmersiveVideoCall] LiveKit disconnected");
    },
    onError: (error) => {
      console.error("[ImmersiveVideoCall] LiveKit error:", error);
      setConnectionQuality("poor");
    },
    onConnectionStateChange: (state) => {
      console.log('[ImmersiveVideoCall] LiveKit connection state:', state);
      if (state === "error" || state === "reconnecting") {
        setConnectionQuality("poor");
      } else if (state === "connected") {
        setConnectionQuality("excellent");
      }
    },
    onActiveSpeakerChange: (speakers) => {
      // Check if user is speaking based on local participant being active
      const isUserActive = speakers.some(s => s.isLocal);
      setIsUserSpeaking(isUserActive);
    },
    onTrackSubscribed: (track, publication, participant) => {
      // Attach remote audio/video tracks
      if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
        track.attach(remoteAudioRef.current);
      } else if (track.kind === Track.Kind.Video && remoteVideoRef.current) {
        track.attach(remoteVideoRef.current);
      }
    },
    onTrackUnsubscribed: (track) => {
      track.detach();
    },
  });

  // Avatar identity and session tracking
  const { identity: avatarIdentity, affinity: userAffinity, incrementMessages } = useAvatarIdentity(avatarId);
  const { startSession: startInsightSession, endSession: endInsightSession } = useSessionInsights(avatarId);

  // Mem0 memory system
  const {
    memoryContext,
    addMemories,
    getRelevantContext,
    isInitialized: isMem0Ready,
  } = useMem0({ avatarId });

  // Show welcome animation effect
  useEffect(() => {
    if (isLiveKitConnected && showWelcome) {
      setTimeout(() => {
        setShowWelcome(false);
        startInsightSession();
      }, 2000);
    }
  }, [isLiveKitConnected, showWelcome, startInsightSession]);

  // Show video overlay when both HeyGen and LiveKit are ready
  useEffect(() => {
    if (isHeyGenConnected && liveKitConnectionState === "connected" && !firstFrameReceived.current) {
      firstFrameReceived.current = true;
      console.log("[ImmersiveVideoCall] HeyGen and LiveKit ready - showing video");
      setShowVideoOverlay(true);
    }
  }, [isHeyGenConnected, liveKitConnectionState]);

  // LiveKit state machine
  useEffect(() => {
    if (!isOpen || !isInitialized) return;

    if (liveKitConnectionState === "checking-permissions" || liveKitConnectionState === "connecting") {
      setCallState("connecting");
      return;
    }

    if (liveKitConnectionState === "reconnecting") {
      setCallState("reconnecting");
      return;
    }

    if (liveKitConnectionState === "connected") {
      console.log("[ImmersiveVideoCall] LiveKit Connected");

      if (isRingtonePlaying) {
        console.log("[ImmersiveVideoCall] Stop Ringtone");
        stopRingtone();
      }

      setCallState("connected");

      if (firstFrameReceived.current) {
        setShowVideoOverlay(true);
      }

      return;
    }

    if (liveKitConnectionState === "disconnected") {
      setCallState("ended");
      return;
    }

    if (liveKitConnectionState === "error") {
      setCallState("reconnecting");
    }
  }, [isOpen, isInitialized, liveKitConnectionState, isRingtonePlaying, stopRingtone]);

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

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      setShowWelcome(true);
      setLoadingStage("initializing");

      firstFrameReceived.current = false;
      overlayShownAt.current = Date.now();

      setCallState("initiating");
      setShowVideoOverlay(false);
      setIsSlowConnection(false);
      startRingtone();

      // Start 5-second timeout timer for friendly message
      slowConnectionTimerRef.current = setTimeout(() => {
        setIsSlowConnection(true);
      }, 5000);

      // Start LiveKit call
      console.log("[ImmersiveVideoCall] Starting LiveKit connection...");
      setLoadingStage("connecting");
      setCallState("connecting");
      startLiveKitCall(videoEnabled);

      // Video path: start local camera AND HeyGen SDK session
      if (videoEnabled) {
        startLocalCamera();
        setLoadingStage("stabilizing");

        console.log("[ImmersiveVideoCall] Starting HeyGen SDK session...");
        startHeyGenSession(heygenVideoRef.current || undefined);
      } else {
        setIsCameraOn(false);
        stopLocalCamera();
      }
    }

    if (!isOpen && isInitialized) {
      stopRingtone();

      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
        slowConnectionTimerRef.current = null;
      }

      stopLocalCamera();
      stopHeyGenSession();
      endLiveKitCall();

      setCallDuration(0);
      setIsInitialized(false);
      setShowWelcome(true);
      setCallState("ended");
      setIsSlowConnection(false);
      firstFrameReceived.current = false;
      setShowVideoOverlay(false);

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
    startLiveKitCall,
    endLiveKitCall,
    startRingtone,
    stopRingtone,
    startHeyGenSession,
    stopHeyGenSession,
  ]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveKitConnected || isHeyGenConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLiveKitConnected, isHeyGenConnected]);

  // Attach HeyGen media stream to video element
  useEffect(() => {
    if (heygenMediaStream && heygenVideoRef.current) {
      console.log("[ImmersiveVideoCall] Attaching HeyGen media stream to video element");
      heygenVideoRef.current.srcObject = heygenMediaStream;
      heygenVideoRef.current.play().catch((e) => {
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

    stopRingtone();

    if (slowConnectionTimerRef.current) {
      clearTimeout(slowConnectionTimerRef.current);
      slowConnectionTimerRef.current = null;
    }

    stopLocalCamera();

    try {
      stopHeyGenSession();
    } catch (e) {
      console.warn("[ImmersiveVideoCall] HeyGen cleanup error:", e);
    }

    try {
      endLiveKitCall();
    } catch (e) {
      console.warn("[ImmersiveVideoCall] LiveKit cleanup error:", e);
    }

    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }

    // Track activity and save memories in background
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user?.id && callDuration > 0) {
          await Promise.all([
            recordActivity(session.user.id, "video_call"),
            recordLearningEvent(session.user.id, avatarId, "message", `Video call duration: ${callDuration} seconds`, {
              type: "video_call",
              duration: callDuration,
            }),
            incrementMessages(),
          ]);

          const messages = assistantTranscript
            ? [{ role: "assistant" as const, content: assistantTranscript }]
            : [];
          await endInsightSession(messages, avatarId);

          // Save call transcript to Mem0
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
        console.error("[ImmersiveVideoCall] Failed to record activity:", error);
      }
    })();

    onClose();
  }, [
    stopRingtone,
    stopLocalCamera,
    endLiveKitCall,
    stopHeyGenSession,
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
    // Also toggle LiveKit camera
    toggleLiveKitCamera(!isCameraOn);
  };

  const handleToggleMic = () => {
    const newMicState = !isMicOn;
    setIsMicOn(newMicState);
    toggleLiveKitMute(!newMicState);
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

  const handleVisionResult = useCallback((result: VisionResult) => {
    setAssistantTranscript(result.suggestedResponse);
    setTimeout(() => setAssistantTranscript(""), 4000);
  }, []);

  const handleVisionEmotion = useCallback((_emotion: VisionResult["emotion"]) => {
    // Handle emotion changes if needed
  }, []);

  const isConnecting = isLiveKitConnecting || liveKitConnectionState === "checking-permissions";
  const isConnected = isHeyGenConnected || isLiveKitConnected;
  const isSpeaking = isAgentSpeaking || isAvatarSpeaking;
  const isUserCurrentlySpeaking = isUserSpeaking;

  // Format audio devices for CallOverlay
  const formattedAudioDevices = audioDevices.map((d) => ({
    deviceId: d.deviceId,
    label: d.label,
    kind: d.kind as "audiooutput" | "audioinput",
  }));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Hidden audio element for remote audio tracks */}
          <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
          
          {/* WhatsApp-style Call Overlay */}
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

          {/* Main Video View */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black"
          >
            <DynamicBackground temporalContext={temporalContext}>
              <ResponsiveVideoContainer
                isConnecting={isConnecting}
                isConnected={isHeyGenConnected}
                temporalWarmth={
                  temporalContext.timeOfDay === "evening" || temporalContext.timeOfDay === "night" ? 50 : 25
                }
              >
                {/* Fallback Mode */}
                <AnimatePresence>
                  {isFallbackMode && (
                    <FallbackMode avatarImage={avatarImage} avatarName={avatarName} isActive={isFallbackMode} />
                  )}
                </AnimatePresence>

                {/* Main Avatar Video - HeyGen SDK or Remote Video from LiveKit Agent */}
                {!isFallbackMode && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {/* HeyGen Video Element */}
                    <video
                      ref={heygenVideoRef}
                      autoPlay
                      playsInline
                      muted={false}
                      className="w-full h-full object-cover"
                      style={{ backgroundColor: "#000" }}
                    />

                    {/* Remote video from LiveKit Agent (if no HeyGen) */}
                    {!isHeyGenConnected && videoTrack && (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                        style={{ backgroundColor: "#000" }}
                      />
                    )}

                    {/* Loading overlay */}
                    {isHeyGenConnecting && !isHeyGenConnected && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-sm text-muted-foreground">Connecting to avatar...</p>
                      </div>
                    )}

                    {/* Cinematic overlay */}
                    {isHeyGenConnected && (
                      <CinematicFilter
                        intensity="light"
                        warmth={
                          temporalContext.timeOfDay === "evening"
                            ? 45
                            : temporalContext.timeOfDay === "night"
                            ? 30
                            : 20
                        }
                        grain={true}
                        vignette={true}
                        isConnecting={false}
                      />
                    )}
                  </div>
                )}

                {/* Loading Transition */}
                <LoadingTransition
                  isLoading={isConnecting && loadingStage !== "ready"}
                  avatarName={avatarName}
                  stage={loadingStage}
                />

                {/* Welcome Animation */}
                <AnimatePresence>{showWelcome && isConnecting && <WelcomeAnimation avatarName={avatarName} />}</AnimatePresence>

                {/* Connection Status */}
                <AnimatePresence>
                  {isConnecting && !showWelcome && <ConnectionStatus status="connecting" avatarName={avatarName} />}
                </AnimatePresence>

                {/* Top Status Bar */}
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute top-0 left-0 right-0 z-20"
                >
                  <div className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-xl">
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
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                            </motion.span>
                          )}
                        </h3>
                        <p className="text-xs text-white/60">
                          {liveKitConnectionState === "checking-permissions"
                            ? "Checking permissions..."
                            : liveKitConnectionState === "reconnecting"
                            ? "Reconnecting..."
                            : microphoneStatus === "denied"
                            ? "Microphone blocked"
                            : isSpeaking
                            ? "Speaking..."
                            : isUserCurrentlySpeaking
                            ? "Listening to you..."
                            : isConnected
                            ? formatDuration(callDuration)
                            : "Connecting..."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          connectionQuality === "excellent"
                            ? "bg-green-500/20 text-green-400"
                            : connectionQuality === "good"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
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

                {/* Speaking Indicator */}
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

                {/* Bottom Control Bar */}
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
                >
                  <div className="flex items-center justify-center gap-3 md:gap-4 p-4 px-6 bg-black/50 backdrop-blur-xl rounded-full border border-white/10">
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

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-11 h-11 md:hidden bg-white/10 hover:bg-white/20 text-white"
                      onClick={switchCamera}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full w-11 h-11 md:w-12 md:h-12 transition-all ${
                        isMicOn
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-red-500/80 hover:bg-red-500 text-white"
                      }`}
                      onClick={handleToggleMic}
                      disabled={!isLiveKitConnected}
                    >
                      {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-14 h-14 md:w-16 md:h-16 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 mx-2"
                      onClick={handleClose}
                    >
                      <Phone className="w-6 h-6 rotate-[135deg]" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full w-11 h-11 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 text-white"
                      onClick={() => setShowQuickChat(true)}
                    >
                      <MessageSquare className="w-5 h-5" />
                    </Button>

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

                {/* Quick Chat Overlay */}
                <QuickChatOverlay
                  isOpen={showQuickChat}
                  onClose={() => setShowQuickChat(false)}
                  avatarName={avatarName}
                  avatarImage={avatarImage}
                  avatarId={avatarId}
                  avatarPersonality={avatarPersonality}
                  onSendMessage={(text) => {
                    setAssistantTranscript(text);
                    setTimeout(() => setAssistantTranscript(""), 4000);
                  }}
                />

                {/* Vision Upload */}
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
