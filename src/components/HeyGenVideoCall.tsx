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
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeyGenStreaming } from "@/hooks/useHeyGenStreaming";
import { useVapiCall } from "@/hooks/useVapiCall";
import { useToast } from "@/hooks/use-toast";

interface HeyGenVideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  heygenAvatarId?: string;
  heygenVoiceId?: string;
  vapiAssistantId?: string;
}

export function HeyGenVideoCall({
  isOpen,
  onClose,
  avatarName,
  avatarImage,
  heygenAvatarId,
  heygenVoiceId,
  vapiAssistantId,
}: HeyGenVideoCallProps) {
  const heygenVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Stable callback refs to prevent hook re-initialization
  const handleHeyGenConnected = useCallback(() => {
    toast({
      title: "Avatar HeyGen connesso",
      description: "Streaming video realistico attivo",
    });
  }, [toast]);

  const handleHeyGenError = useCallback((error: Error) => {
    console.error("HeyGen error:", error);
  }, []);

  const handleVapiTranscript = useCallback((text: string, isFinal: boolean) => {
    setTranscript(text);
    if (isFinal) {
      setTimeout(() => setTranscript(""), 3000);
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

  // Send transcript to HeyGen for lip-sync
  useEffect(() => {
    if (transcript && isHeyGenConnected) {
      sendHeyGenText(transcript);
    }
  }, [transcript, isHeyGenConnected, sendHeyGenText]);

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

  // Initialize when modal opens - run only once per open
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      startLocalCamera();

      // Start HeyGen session with video element after a brief delay
      const heygenTimer = setTimeout(() => {
        if (heygenAvatarId && heygenVideoRef.current) {
          startHeyGenSession(heygenVideoRef.current);
        }
      }, 500);

      // Start Vapi call after HeyGen
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
      // Cleanup when modal closes
      stopLocalCamera();
      stopHeyGenSession();
      endVapiCall();
      setCallDuration(0);
      setTranscript("");
      setIsInitialized(false);
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
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const isConnecting = isHeyGenConnecting || isVapiConnecting;
  const isConnected = isHeyGenConnected || isVapiConnected;
  const isSpeaking = isHeyGenSpeaking || isVapiSpeaking;

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-background/20 backdrop-blur-lg rounded-t-xl border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={avatarImage}
                    alt={avatarName}
                    className="w-12 h-12 rounded-full border-2 border-primary object-cover"
                  />
                  {isConnected && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{avatarName}</h3>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${isConnected ? "text-green-400" : "text-yellow-400"}`}>
                      {getStatusText()}
                    </p>
                    {isConnected && (
                      <span className="text-sm text-white/60">• {formatDuration(callDuration)}</span>
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

            {/* Main Video Area */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-b-xl overflow-hidden">
              {/* HeyGen Avatar Video (main) */}
              <div className="absolute inset-0 flex items-center justify-center">
                {isHeyGenConnected ? (
                  <video
                    ref={heygenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <motion.img
                      src={avatarImage}
                      alt={avatarName}
                      animate={isSpeaking ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 0.3, repeat: Infinity }}
                      className="w-48 h-48 rounded-full object-cover border-4 border-primary/50 shadow-2xl"
                    />
                    {!heygenAvatarId && (
                      <div className="mt-6 flex items-center gap-2 text-yellow-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Avatar HeyGen non configurato</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Local video (picture-in-picture) */}
              {hasLocalVideo && (
                <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isCameraOn ? "hidden" : ""}`}
                  />
                  {!isCameraOn && (
                    <div className="flex flex-col items-center justify-center h-full text-white/60 bg-slate-800">
                      <VideoOff className="w-8 h-8 mb-1" />
                      <p className="text-xs">Camera off</p>
                    </div>
                  )}
                </div>
              )}

              {/* Transcript overlay */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-24 left-4 right-4 max-w-2xl mx-auto"
                >
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                    <p className="text-white text-sm">{transcript}</p>
                  </div>
                </motion.div>
              )}

              {/* Connection status overlay */}
              {isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-white text-xl font-medium">Connessione avatar realistico...</p>
                    <p className="text-white/60 text-sm mt-2">Streaming HeyGen in preparazione</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 p-4 bg-background/40 backdrop-blur-lg rounded-full border border-white/10">
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
                disabled={!isVapiConnected}
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
