import { useRef, useEffect, useState } from "react";
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
  TestTube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocalVideoCall } from "@/hooks/useLocalVideoCall";
import { Avatar3DViewer } from "./Avatar3DViewer";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarName: string;
  avatarImage: string;
  avatarModelUrl?: string;
}

export function VideoCallModal({
  isOpen,
  onClose,
  avatarName,
  avatarImage,
  avatarModelUrl,
}: VideoCallModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAvatar3D, setShowAvatar3D] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const {
    isConnecting,
    isConnected,
    startVideoCall,
    endVideoCall,
    toggleCamera,
    toggleMicrophone,
  } = useLocalVideoCall({
    onCallEnd: () => {
      onClose();
    },
  });

  // Start call when modal opens
  useEffect(() => {
    if (isOpen && videoRef.current && !isConnected && !isConnecting) {
      startVideoCall(videoRef.current);
    }
  }, [isOpen, isConnected, isConnecting, startVideoCall]);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isConnected]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle closing
  const handleClose = async () => {
    await endVideoCall();
    onClose();
  };

  const handleToggleCamera = () => {
    setIsCameraOn(!isCameraOn);
    toggleCamera(!isCameraOn);
  };

  const handleToggleMic = () => {
    setIsMicOn(!isMicOn);
    toggleMicrophone(!isMicOn);
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full h-full max-w-6xl max-h-[90vh] m-4 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-background/20 backdrop-blur-lg rounded-t-xl">
              <div className="flex items-center gap-3">
                <img
                  src={avatarImage}
                  alt={avatarName}
                  className="w-10 h-10 rounded-full border-2 border-primary"
                />
                <div>
                  <h3 className="font-semibold text-white">{avatarName}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-green-400">
                      {isConnecting ? "Connessione..." : isConnected ? "In chiamata" : "In attesa"}
                    </p>
                    {isConnected && (
                      <span className="text-xs text-white/70">{formatDuration(callDuration)}</span>
                    )}
                  </div>
                </div>
                {/* Test mode badge */}
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs">
                  <TestTube className="w-3 h-3" />
                  <span>Modalità Test</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAvatar3D(!showAvatar3D)}
                  className="text-white hover:bg-white/10"
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
            <div className="flex-1 relative bg-background/10 rounded-b-xl overflow-hidden">
              {/* Local video element */}
              <div className={`absolute inset-0 ${showAvatar3D ? 'w-2/3' : 'w-full'} flex items-center justify-center bg-black`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
                />
                {!isCameraOn && (
                  <div className="flex flex-col items-center justify-center text-white/60">
                    <VideoOff className="w-16 h-16 mb-4" />
                    <p>Camera disattivata</p>
                  </div>
                )}
              </div>

              {/* 3D Avatar panel */}
              {showAvatar3D && (
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-background/30 backdrop-blur-sm border-l border-white/10">
                  <Avatar3DViewer
                    avatarUrl={avatarModelUrl}
                    className="w-full h-full rounded-none"
                    isSpeaking={isConnected}
                  />
                </div>
              )}

              {/* Loading overlay */}
              {isConnecting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-white text-lg">Connessione in corso...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 p-4 bg-background/40 backdrop-blur-lg rounded-full">
              <Button
                variant={isCameraOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={handleToggleCamera}
              >
                {isCameraOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>

              <Button
                variant={isMicOn ? "secondary" : "destructive"}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={handleToggleMic}
              >
                {isMicOn ? (
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
