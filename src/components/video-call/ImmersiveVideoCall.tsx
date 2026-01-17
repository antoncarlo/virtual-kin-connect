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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeyGenStreaming } from "@/hooks/useHeyGenStreaming";
import { useVapiCall } from "@/hooks/useVapiCall";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { QuickChatOverlay } from "./QuickChatOverlay";
import { ConnectionStatus } from "./ConnectionStatus";
import { WelcomeAnimation } from "./WelcomeAnimation";

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
  const [connectionQuality, setConnectionQuality] = useState<"excellent" | "good" | "poor">("good");
  
  // Transcripts for overlay
  const [userTranscript, setUserTranscript] = useState("");
  const [assistantTranscript, setAssistantTranscript] = useState("");
  const [pendingText, setPendingText] = useState<string[]>([]);

  // Stable callback refs
  const handleHeyGenConnected = useCallback(() => {
    console.log("HeyGen connected - sending welcome greeting");
    setConnectionQuality("excellent");
  }, []);

  const handleHeyGenError = useCallback((error: Error) => {
    console.error("HeyGen error:", error);
    setConnectionQuality("poor");
  }, []);

  const handleHeyGenSpeaking = useCallback((speaking: boolean) => {
    if (!speaking && pendingText.length > 0) {
      // Process next queued text
      const [next, ...rest] = pendingText;
      setPendingText(rest);
    }
  }, [pendingText]);

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

  // HeyGen streaming for realistic avatar
  const {
    isConnecting: isHeyGenConnecting,
    isConnected: isHeyGenConnected,
    isSpeaking: isHeyGenSpeaking,
    mediaStream: heygenStream,
    startSession: startHeyGenSession,
    sendText: sendHeyGenText,
    stopSession: stopHeyGenSession,
  } = useHeyGenStreaming({
    avatarId: heygenAvatarId,
    voiceId: heygenVoiceId,
    onConnected: handleHeyGenConnected,
    onSpeaking: handleHeyGenSpeaking,
    onError: handleHeyGenError,
  });

  // Vapi for voice conversation
  const {
    isConnecting: isVapiConnecting,
    isConnected: isVapiConnected,
    isSpeaking: isVapiSpeaking,
    startCall: startVapiCall,
    endCall: endVapiCall,
    toggleMute: toggleVapiMute,
  } = useVapiCall({
    assistantId: vapiAssistantId,
    onTranscript: handleVapiTranscript,
    onCallStart: handleVapiCallStart,
  });

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
      startLocalCamera();

      // Enter fullscreen on mobile
      if (window.innerWidth < 768) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      }

      // Start HeyGen session
      const heygenTimer = setTimeout(() => {
        if (heygenAvatarId && heygenVideoRef.current) {
          startHeyGenSession(heygenVideoRef.current);
        }
      }, 500);

      // Start Vapi call
      const vapiTimer = setTimeout(() => {
        if (vapiAssistantId) {
          startVapiCall();
        }
      }, 1500);

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

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVapiConnected || isHeyGenConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVapiConnected, isHeyGenConnected]);

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

  const isConnecting = isHeyGenConnecting || isVapiConnecting;
  const isConnected = isHeyGenConnected || isVapiConnected;
  const isSpeaking = isHeyGenSpeaking || isVapiSpeaking;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black"
        >
          {/* Full-screen video container */}
          <div className="relative w-full h-full overflow-hidden">
            {/* Main Avatar Video - Full Screen */}
            <div className="absolute inset-0">
              {isHeyGenConnected ? (
                <video
                  ref={heygenVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                  <motion.div
                    animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent blur-2xl opacity-50 animate-pulse" />
                    <img
                      src={avatarImage}
                      alt={avatarName}
                      className="w-56 h-56 md:w-72 md:h-72 rounded-full object-cover border-4 border-primary/50 shadow-2xl relative z-10"
                    />
                  </motion.div>
                </div>
              )}
            </div>

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
                      {isSpeaking ? "Sta parlando..." : isConnected ? formatDuration(callDuration) : "Connessione..."}
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

            {/* Bottom Control Bar - Glassmorphism */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-0 left-0 right-0 z-20"
            >
              <div className="flex items-center justify-center gap-4 md:gap-6 p-6 pb-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                {/* Camera Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full w-12 h-12 md:w-14 md:h-14 backdrop-blur-xl transition-all ${
                    isCameraOn 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-red-500/80 hover:bg-red-500 text-white"
                  }`}
                  onClick={handleToggleCamera}
                >
                  {isCameraOn ? <Video className="w-5 h-5 md:w-6 md:h-6" /> : <VideoOff className="w-5 h-5 md:w-6 md:h-6" />}
                </Button>

                {/* Switch Camera (mobile only) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-12 h-12 md:w-14 md:h-14 backdrop-blur-xl bg-white/10 hover:bg-white/20 text-white md:hidden"
                  onClick={switchCamera}
                >
                  <RefreshCw className="w-5 h-5" />
                </Button>

                {/* Mic Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full w-12 h-12 md:w-14 md:h-14 backdrop-blur-xl transition-all ${
                    isMicOn 
                      ? "bg-white/10 hover:bg-white/20 text-white" 
                      : "bg-red-500/80 hover:bg-red-500 text-white"
                  }`}
                  onClick={handleToggleMic}
                  disabled={!isVapiConnected}
                >
                  {isMicOn ? <Mic className="w-5 h-5 md:w-6 md:h-6" /> : <MicOff className="w-5 h-5 md:w-6 md:h-6" />}
                </Button>

                {/* End Call */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-14 h-14 md:w-16 md:h-16 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                  onClick={handleClose}
                >
                  <Phone className="w-6 h-6 md:w-7 md:h-7 rotate-[135deg]" />
                </Button>

                {/* Quick Chat */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full w-12 h-12 md:w-14 md:h-14 backdrop-blur-xl bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setShowQuickChat(true)}
                >
                  <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
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
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
