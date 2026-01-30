import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Maximize2,
  Minimize2,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeyGenStreaming, PUBLIC_AVATARS } from "@/hooks/useHeyGenStreaming";
import { useLiveKitCall } from "@/hooks/useLiveKitCall";
import { useToast } from "@/hooks/use-toast";
import { Track } from "livekit-client";

interface HeyGenVideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  heygenAvatarId?: string;
  heygenVoiceId?: string;
  avatarId?: string;
}

export function HeyGenVideoCall({
  isOpen,
  onClose,
  avatarName,
  avatarImage,
  heygenAvatarId,
  heygenVoiceId,
  avatarId,
}: HeyGenVideoCallProps) {
  const heygenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showConnectingText, setShowConnectingText] = useState(true);

  // Stable callbacks
  const handleHeyGenConnected = useCallback(() => {
    setShowConnectingText(false);
    toast({
      title: "Avatar connesso",
      description: "Streaming video HD attivo",
    });
  }, [toast]);

  const handleHeyGenError = useCallback((error: Error) => {
    console.error("HeyGen error:", error);
    toast({
      title: "Errore avatar",
      description: error.message,
      variant: "destructive",
    });
  }, [toast]);

  // HeyGen streaming with PUBLIC avatar
  const {
    isConnecting: isHeyGenConnecting,
    isConnected: isHeyGenConnected,
    isSpeaking: isHeyGenSpeaking,
    isListening: isHeyGenListening,
    mediaStream: heygenStream,
    connectionStatus,
    startSession: startHeyGenSession,
    sendText: sendHeyGenText,
    setListeningMode,
    stopSession: stopHeyGenSession,
  } = useHeyGenStreaming({
    avatarId: heygenAvatarId || PUBLIC_AVATARS.BRYAN_IT_SITTING,
    voiceId: heygenVoiceId,
    quality: "high",
    onConnected: handleHeyGenConnected,
    onError: handleHeyGenError,
  });

  // LiveKit for voice conversation
  const {
    isConnecting: isLiveKitConnecting,
    isConnected: isLiveKitConnected,
    isAgentSpeaking,
    startCall: startLiveKitCall,
    endCall: endLiveKitCall,
    toggleMute: toggleLiveKitMute,
  } = useLiveKitCall({
    avatarId,
    avatarName,
    onConnected: () => {
      toast({
        title: "Connesso!",
        description: `Stai parlando con ${avatarName}`,
      });
    },
    onTrackSubscribed: (track) => {
      if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
        track.attach(remoteAudioRef.current);
      }
    },
    onTrackUnsubscribed: (track) => {
      track.detach();
    },
  });

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
        video: true,
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

  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      setShowConnectingText(true);
      startLocalCamera();

      // Start HeyGen session
      const heygenTimer = setTimeout(() => {
        if (heygenVideoRef.current) {
          startHeyGenSession(heygenVideoRef.current);
        }
      }, 500);

      // Start LiveKit call
      const liveKitTimer = setTimeout(() => {
        startLiveKitCall(true);
      }, 1500);

      return () => {
        clearTimeout(heygenTimer);
        clearTimeout(liveKitTimer);
      };
    }
    
    if (!isOpen && isInitialized) {
      stopLocalCamera();
      stopHeyGenSession();
      endLiveKitCall();
      setCallDuration(0);
      setTranscript("");
      setIsInitialized(false);
      setShowConnectingText(true);
    }
  }, [isOpen, isInitialized, startLocalCamera, startHeyGenSession, startLiveKitCall, stopLocalCamera, stopHeyGenSession, endLiveKitCall]);

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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClose = async () => {
    stopLocalCamera();
    stopHeyGenSession();
    endLiveKitCall();
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
    toggleLiveKitMute(!newMicState);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isConnecting = isHeyGenConnecting || isLiveKitConnecting;
  const isConnected = isHeyGenConnected || isLiveKitConnected;
  const isSpeaking = isHeyGenSpeaking || isAgentSpeaking;

  const getStatusText = () => {
    if (isConnecting) return "Connessione in corso...";
    if (isConnected && isSpeaking) return "Sta parlando...";
    if (isConnected) return "In ascolto...";
    return "In attesa";
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        >
          {/* Hidden audio element for remote audio */}
          <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full flex flex-col items-center justify-center"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-black/20 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarImage}
                    alt={avatarName}
                    className="w-10 h-10 rounded-full border-2 border-primary object-cover"
                  />
                  {isConnected ? (
                    <Wifi className="absolute -bottom-1 -right-1 w-4 h-4 text-green-400 bg-slate-900 rounded-full p-0.5" />
                  ) : (
                    <WifiOff className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-400 bg-slate-900 rounded-full p-0.5" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white">{avatarName}</h3>
                  <div className="flex items-center gap-2">
                    <p className={`text-xs ${isConnected ? "text-green-400" : "text-yellow-400"}`}>
                      {getStatusText()}
                    </p>
                    {isConnected && (
                      <span className="text-xs text-white/60">• {formatDuration(callDuration)}</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFullscreen}
                className="text-white hover:bg-white/10"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </Button>
            </div>

            {/* Centered Circular Avatar Video */}
            <div className="relative flex flex-col items-center justify-center">
              <div 
                className={`relative rounded-full overflow-hidden border-4 transition-all duration-300 ${
                  isSpeaking 
                    ? "border-primary shadow-[0_0_60px_rgba(139,92,246,0.5)]" 
                    : "border-white/20"
                }`}
                style={{ width: "320px", height: "320px" }}
              >
                {isHeyGenConnected ? (
                  <video
                    ref={heygenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover scale-150"
                    style={{ objectPosition: "center 30%" }}
                  />
                ) : (
                  <motion.div 
                    className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700"
                    animate={isConnecting ? { opacity: [0.7, 1, 0.7] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <img
                      src={avatarImage}
                      alt={avatarName}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                )}

                {isSpeaking && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-primary"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </div>

              <AnimatePresence>
                {showConnectingText && !isHeyGenConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-6 flex flex-col items-center"
                  >
                    <div className="flex items-center gap-2 text-white/80">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-lg font-medium">{avatarName} si sta connettendo...</span>
                    </div>
                    <p className="text-sm text-white/50 mt-2">Preparazione streaming video HD</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {isHeyGenConnected && !isSpeaking && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-white/60 text-sm"
                >
                  Parla con {avatarName}...
                </motion.p>
              )}
            </div>

            {/* Local video */}
            {hasLocalVideo && (
              <div className="absolute bottom-28 right-6 w-32 h-24 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`}
                />
                {!isCameraOn && (
                  <div className="flex flex-col items-center justify-center h-full text-white/60 bg-slate-800">
                    <VideoOff className="w-6 h-6" />
                  </div>
                )}
              </div>
            )}

            {/* Transcript overlay */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-36 left-4 right-4 max-w-xl mx-auto"
                >
                  <div className="bg-black/70 backdrop-blur-sm rounded-xl px-5 py-3 text-center">
                    <p className="text-white text-sm">{transcript}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-3 p-3 bg-black/40 backdrop-blur-lg rounded-full border border-white/10">
              <Button
                variant={isCameraOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={handleToggleCamera}
              >
                {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>

              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={handleToggleMic}
                disabled={!isLiveKitConnected}
              >
                {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14"
                onClick={handleClose}
              >
                <Phone className="w-6 h-6 rotate-[135deg]" />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
