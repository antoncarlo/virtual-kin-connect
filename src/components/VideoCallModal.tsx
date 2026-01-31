import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  Maximize2,
  Minimize2,
  User,
  Loader2,
  Volume2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLiveKitCall } from "@/hooks/useLiveKitCall";
import { Avatar3DViewer } from "./Avatar3DViewer";
import { useToast } from "@/hooks/use-toast";
import { Track } from "livekit-client";
import { LocalVideoTrack } from "./video-call/LocalVideoTrack";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  avatarModelUrl?: string;
  avatarId?: string;
}

export function VideoCallModal({
  isOpen,
  onClose,
  avatarName,
  avatarImage,
  avatarModelUrl,
  avatarId,
}: VideoCallModalProps) {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAvatar3D, setShowAvatar3D] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState<string>("");

  // LiveKit voice call integration with full A/V management
  const {
    isConnecting: isLiveKitConnecting,
    isConnected: isLiveKitConnected,
    isAgentSpeaking: isAvatarSpeaking,
    isCameraOn,
    isMuted,
    localVideoTrack,
    startCall: startLiveKitCall,
    endCall: endLiveKitCall,
    toggleMute: toggleLiveKitMute,
    toggleCamera: toggleLiveKitCamera,
    switchCamera,
    remoteAudioTrack,
  } = useLiveKitCall({
    avatarId,
    avatarName,
    onConnected: () => {
      toast({
        title: "Connesso!",
        description: `Stai parlando con ${avatarName}. Puoi parlare liberamente.`,
      });
    },
    onDisconnected: () => {
      toast({
        title: "Chiamata terminata",
        description: `La chiamata con ${avatarName} è terminata.`,
      });
    },
    onError: (error) => {
      console.error("LiveKit error:", error);
      toast({
        title: "Errore chiamata",
        description: error.message || "Impossibile connettersi. Riprova.",
        variant: "destructive",
      });
    },
    onTrackSubscribed: (track) => {
      // Audio tracks are auto-attached via remoteAudioTrack state
      if (track.kind === Track.Kind.Audio && remoteAudioRef.current) {
        track.attach(remoteAudioRef.current);
      }
    },
    onTrackUnsubscribed: (track) => {
      track.detach();
    },
  });

  // Start LiveKit call when modal opens
  useEffect(() => {
    if (isOpen) {
      // Auto-start LiveKit call with video enabled
      if (!isLiveKitConnected && !isLiveKitConnecting) {
        const timer = setTimeout(() => {
          startLiveKitCall(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      // Cleanup when modal closes
      if (isLiveKitConnected) {
        endLiveKitCall();
      }
      setCallDuration(0);
      setTranscript("");
    }
  }, [isOpen, isLiveKitConnected, isLiveKitConnecting, startLiveKitCall, endLiveKitCall]);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveKitConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLiveKitConnected]);

  // Attach remote audio track
  useEffect(() => {
    if (remoteAudioTrack && remoteAudioRef.current) {
      remoteAudioTrack.attach(remoteAudioRef.current);
      return () => {
        remoteAudioTrack.detach();
      };
    }
  }, [remoteAudioTrack]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle closing
  const handleClose = async () => {
    if (isLiveKitConnected) {
      endLiveKitCall();
    }
    onClose();
  };

  const handleToggleCamera = () => {
    toggleLiveKitCamera();
  };

  const handleToggleMic = () => {
    toggleLiveKitMute();
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

  const getStatusText = () => {
    if (isLiveKitConnecting) return "Connessione in corso...";
    if (isLiveKitConnected && isAvatarSpeaking) return "Sta parlando...";
    if (isLiveKitConnected) return "In ascolto...";
    if (!avatarId) return "Assistente non configurato";
    return "In attesa";
  };

  const getStatusColor = () => {
    if (isLiveKitConnecting) return "text-yellow-400";
    if (isLiveKitConnected && isAvatarSpeaking) return "text-green-400";
    if (isLiveKitConnected) return "text-blue-400";
    return "text-muted-foreground";
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
          {/* Hidden audio element for remote audio */}
          <audio ref={remoteAudioRef} autoPlay style={{ display: "none" }} />
          
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
                  {isLiveKitConnected && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{avatarName}</h3>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${getStatusColor()}`}>
                      {getStatusText()}
                    </p>
                    {isLiveKitConnected && (
                      <span className="text-sm text-white/60">• {formatDuration(callDuration)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAvatar3D(!showAvatar3D)}
                  className={`text-white hover:bg-white/10 ${showAvatar3D ? 'bg-white/20' : ''}`}
                  title={showAvatar3D ? "Nascondi avatar" : "Mostra avatar"}
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFullscreen}
                  className="text-white hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-b-xl overflow-hidden">
              {/* Avatar section (main) */}
              <div className={`absolute inset-0 ${localVideoTrack && showAvatar3D ? 'right-1/4' : ''} flex items-center justify-center`}>
                {showAvatar3D ? (
                  <Avatar3DViewer
                    avatarUrl={avatarModelUrl}
                    avatarImage={avatarImage}
                    className="w-full h-full"
                    isSpeaking={isAvatarSpeaking}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <motion.div
                      animate={isAvatarSpeaking ? {
                        scale: [1, 1.05, 1],
                      } : {}}
                      transition={{
                        duration: 0.3,
                        repeat: Infinity,
                      }}
                    >
                      <img
                        src={avatarImage}
                        alt={avatarName}
                        className="w-40 h-40 rounded-full object-cover border-4 border-primary/50 shadow-2xl"
                      />
                    </motion.div>
                    
                    {/* Audio visualizer */}
                    {isAvatarSpeaking && (
                      <div className="flex items-center gap-1 mt-6">
                        {[...Array(7)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              height: [8, 28, 8],
                            }}
                            transition={{
                              duration: 0.4,
                              repeat: Infinity,
                              delay: i * 0.08,
                            }}
                            className="w-1.5 bg-primary rounded-full"
                            style={{ minHeight: 8 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Local video (picture-in-picture) - Now using LiveKit track */}
              <div className="absolute bottom-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                <LocalVideoTrack
                  track={localVideoTrack}
                  isCameraOn={isCameraOn}
                  className="w-full h-full"
                  mirrored={true}
                />
              </div>

              {/* Transcript overlay */}
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-24 left-4 right-4 max-w-2xl mx-auto"
                >
                  <div className="bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3 text-center">
                    <p className="text-white text-sm">{transcript}</p>
                  </div>
                </motion.div>
              )}

              {/* Connection status overlay */}
              {isLiveKitConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-white text-xl font-medium">Connessione in corso...</p>
                    <p className="text-white/60 text-sm mt-2">Preparazione chiamata vocale</p>
                  </div>
                </div>
              )}

              {/* No assistant warning */}
              {!avatarId && !isLiveKitConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="text-center bg-black/60 rounded-xl p-6 max-w-sm mx-4">
                    <Volume2 className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-white font-medium">Chiamata vocale non disponibile</p>
                    <p className="text-white/60 text-sm mt-2">
                      L'assistente vocale per {avatarName} non è configurato.
                    </p>
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
                title={isCameraOn ? "Disattiva camera" : "Attiva camera"}
              >
                {isCameraOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>

              {/* Switch camera button (mobile) */}
              <Button
                variant="secondary"
                size="icon"
                className="rounded-full w-12 h-12 md:hidden"
                onClick={switchCamera}
                disabled={!isCameraOn}
                title="Cambia camera"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>

              <Button
                variant={!isMuted ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={handleToggleMic}
                disabled={!isLiveKitConnected}
                title={!isMuted ? "Disattiva microfono" : "Attiva microfono"}
              >
                {!isMuted ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-14 h-14"
                onClick={handleClose}
                title="Termina chiamata"
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
