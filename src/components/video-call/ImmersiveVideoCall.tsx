import { useRef, useEffect, useState, useCallback } from "react";
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
import { useHeyGenStreaming } from "@/hooks/useHeyGenStreaming";
import { useVapiCall } from "@/hooks/useVapiCall";
import { useToast } from "@/hooks/use-toast";
import { useBandwidthMonitor } from "@/hooks/useBandwidthMonitor";
import { useTemporalContext } from "@/hooks/useTemporalContext";
import { useIdleGestures } from "@/hooks/useIdleGestures";
import { useAudioVideoSync } from "@/hooks/useAudioVideoSync";
import { VisionResult } from "@/hooks/useVisionProcessing";
import { supabase } from "@/integrations/supabase/client";
import { QuickChatOverlay } from "./QuickChatOverlay";
import { ConnectionStatus } from "./ConnectionStatus";
import { WelcomeAnimation } from "./WelcomeAnimation";
import { FallbackMode } from "./FallbackMode";
import { DynamicBackground } from "./DynamicBackground";
import { VisionUpload } from "./VisionUpload";
import { CinematicFilter } from "./CinematicFilter";
import { LoadingTransition } from "./LoadingTransition";
import { ResponsiveVideoContainer } from "./ResponsiveVideoContainer";

interface ImmersiveVideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  avatarId: string;
  avatarPersonality?: string[];
  heygenAvatarId?: string;
  heygenVoiceId?: string;
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
  
  // Transcripts for overlay
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [pendingText, setPendingText] = useState<string[]>([]);

  // Temporal context for dynamic backgrounds
  const temporalContext = useTemporalContext();

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
  const { bandwidthInfo, isLowBandwidth } = useBandwidthMonitor({
    checkInterval: 5000,
    onQualityChange: (quality) => {
      setConnectionQuality(quality === "critical" ? "poor" : quality === "poor" ? "poor" : quality === "good" ? "good" : "excellent");
    },
    onFallbackTriggered: () => {
      if (!isFallbackMode) {
        setIsFallbackMode(true);
        toast({
          title: "Connessione limitata",
          description: "Passaggio a modalità solo audio per garantire la qualità",
        });
      }
    },
  });

  // Stable callback refs
  const handleHeyGenConnected = useCallback(() => {
    console.log("HeyGen connected - video stabilized");
    setConnectionQuality("excellent");
    setLoadingStage("ready");
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

  // HeyGen streaming for realistic avatar
  const {
    isConnecting: isHeyGenConnecting,
    isConnected: isHeyGenConnected,
    isSpeaking: isHeyGenSpeaking,
    isProcessing: isHeyGenProcessing,
    mediaStream: heygenStream,
    startSession: startHeyGenSession,
    sendText: sendHeyGenText,
    sendGesture: sendHeyGenGesture,
    setEmotion: setHeyGenEmotion,
    stopSession: stopHeyGenSession,
  } = useHeyGenStreaming({
    avatarId: heygenAvatarId,
    voiceId: heygenVoiceId,
    onConnected: handleHeyGenConnected,
    onSpeaking: handleHeyGenSpeaking,
    onError: handleHeyGenError,
    onProcessing: handleHeyGenProcessing,
  });

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
  } = useVapiCall({
    assistantId: vapiAssistantId,
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

  // Send welcome greeting when connected
  useEffect(() => {
    if (isHeyGenConnected && showWelcome) {
      const welcomeGreetings = [
        `Ciao! Che bello vederti!`,
        `Ehi, eccoti finalmente! Come stai?`,
        `Hey! Sono contento di parlarti faccia a faccia!`,
      ];
      const greeting = welcomeGreetings[Math.floor(Math.random() * welcomeGreetings.length)];
      
      // Delay to let the video stabilize
      const timer = setTimeout(() => {
        sendHeyGenText(greeting);
        setAssistantTranscript(greeting);
        setTimeout(() => setAssistantTranscript(""), 3000);
      }, 1500);

      // Hide welcome animation
      setTimeout(() => setShowWelcome(false), 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isHeyGenConnected, showWelcome, sendHeyGenText]);

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
    }
  }, [heygenStream]);

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

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      setShowWelcome(true);
      setLoadingStage("initializing");
      startLocalCamera();

      // Start Vapi call first (more reliable)
      const vapiTimer = setTimeout(() => {
        if (vapiAssistantId) {
          setLoadingStage("connecting");
          startVapiCall();
        }
      }, 500);

      // Start HeyGen session after Vapi
      const heygenTimer = setTimeout(() => {
        if (heygenAvatarId && heygenVideoRef.current) {
          setLoadingStage("stabilizing");
          startHeyGenSession(heygenVideoRef.current);
        }
      }, 1000);

      return () => {
        clearTimeout(heygenTimer);
        clearTimeout(vapiTimer);
      };
    }
    
    if (!isOpen && isInitialized) {
      stopLocalCamera();
      stopHeyGenSession();
      endVapiCall();
      setCallDuration(0);
      setIsInitialized(false);
      setShowWelcome(true);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  }, [isOpen, isInitialized, heygenAvatarId, vapiAssistantId, startLocalCamera, startHeyGenSession, startVapiCall, stopLocalCamera, stopHeyGenSession, endVapiCall]);

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

  return (
    <AnimatePresence>
      {isOpen && (
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
                      <video
                        ref={heygenVideoRef}
                        autoPlay
                        playsInline
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
      )}
    </AnimatePresence>
  );
}
