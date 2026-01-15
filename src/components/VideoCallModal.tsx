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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDailyCall } from "@/hooks/useDailyCall";
import { ReadyPlayerMeAvatar } from "./ReadyPlayerMeAvatar";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAvatar3D, setShowAvatar3D] = useState(true);

  const {
    isConnecting,
    isConnected,
    startVideoCall,
    endVideoCall,
    toggleCamera,
    toggleMicrophone,
  } = useDailyCall({
    onCallEnd: () => {
      onClose();
    },
  });

  // Start call when modal opens
  useEffect(() => {
    if (isOpen && containerRef.current && !isConnected && !isConnecting) {
      startVideoCall(containerRef.current);
    }
  }, [isOpen, isConnected, isConnecting, startVideoCall]);

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
                  <p className="text-xs text-green-400">
                    {isConnecting ? "Connessione..." : isConnected ? "In chiamata" : "In attesa"}
                  </p>
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
              {/* Daily.co iframe container */}
              <div
                ref={containerRef}
                className={`absolute inset-0 ${showAvatar3D ? 'w-2/3' : 'w-full'}`}
              />

              {/* 3D Avatar panel */}
              {showAvatar3D && (
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-background/30 backdrop-blur-sm border-l border-white/10">
                  <ReadyPlayerMeAvatar
                    avatarUrl={avatarModelUrl}
                    className="w-full h-full"
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
