/**
 * CallOverlay Component
 *
 * WhatsApp-style call overlay that provides immediate visual feedback
 * while the avatar connection is being established.
 *
 * Features:
 * - Instant visual feedback on call initiation
 * - Profile photo with pulsing animation
 * - Connection status text
 * - Mute/Unmute microphone
 * - Audio output device selector
 * - End call button
 * - Smooth transition to video when ready
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Phone,
  Volume2,
  VolumeX,
  Bluetooth,
  Speaker,
  Headphones,
  X,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// TYPES
// ============================================================================

export type CallState =
  | "initiating"      // User just pressed call, showing UI immediately
  | "connecting"      // Token obtained, SDK connecting
  | "buffering"       // Stream ready, waiting for first frame
  | "connected"       // Video playing
  | "reconnecting"    // Lost connection, trying to reconnect
  | "ended";          // Call ended

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: "audiooutput" | "audioinput";
}

export interface CallOverlayProps {
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Current call state */
  callState: CallState;
  /** Avatar name to display */
  avatarName: string;
  /** Avatar profile image URL */
  avatarImage: string;
  /** Current call duration in seconds */
  callDuration?: number;
  /** Whether microphone is muted */
  isMuted: boolean;
  /** Whether avatar is speaking */
  isSpeaking?: boolean;
  /** Whether user is speaking */
  isUserSpeaking?: boolean;
  /** Connection quality indicator */
  connectionQuality?: "excellent" | "good" | "poor";
  /** Video element to show when connected */
  videoElement?: React.ReactNode;
  /** Callback when mute is toggled */
  onMuteToggle: () => void;
  /** Callback when audio output device changes */
  onAudioOutputChange?: (deviceId: string) => void;
  /** Callback when call is ended */
  onEndCall: () => void;
  /** Available audio output devices */
  audioDevices?: AudioDevice[];
  /** Currently selected audio output device */
  selectedAudioDevice?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getStatusText = (state: CallState): string => {
  switch (state) {
    case "initiating":
      return "Connessione in corso...";
    case "connecting":
      return "Stabilendo connessione...";
    case "buffering":
      return "Preparazione video...";
    case "connected":
      return "Connesso";
    case "reconnecting":
      return "Riconnessione...";
    case "ended":
      return "Chiamata terminata";
    default:
      return "";
  }
};

const getDeviceIcon = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("bluetooth")) return Bluetooth;
  if (lowerLabel.includes("headphone") || lowerLabel.includes("cuffi")) return Headphones;
  if (lowerLabel.includes("speaker") || lowerLabel.includes("altoparlant")) return Speaker;
  return Volume2;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CallOverlay({
  isOpen,
  callState,
  avatarName,
  avatarImage,
  callDuration = 0,
  isMuted,
  isSpeaking = false,
  isUserSpeaking = false,
  connectionQuality = "good",
  videoElement,
  onMuteToggle,
  onAudioOutputChange,
  onEndCall,
  audioDevices = [],
  selectedAudioDevice,
}: CallOverlayProps) {
  const [showVideo, setShowVideo] = useState(false);

  // Show video only when connected and we have video element
  useEffect(() => {
    if (callState === "connected" && videoElement) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setShowVideo(true), 100);
      return () => clearTimeout(timer);
    } else {
      setShowVideo(false);
    }
  }, [callState, videoElement]);

  const isConnecting = ["initiating", "connecting", "buffering"].includes(callState);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
        >
          {/* Background blur effect */}
          <div className="absolute inset-0 backdrop-blur-3xl" />

          {/* Animated background circles */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/20"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.05, 0.1, 0.05],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/10"
            />
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-between h-full py-safe">
            {/* Top section - Status */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="pt-12 text-center"
            >
              {/* Connection quality indicator */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wifi
                  className={`w-4 h-4 ${
                    connectionQuality === "excellent"
                      ? "text-green-400"
                      : connectionQuality === "good"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }`}
                />
                <span className="text-xs text-white/60 uppercase tracking-wider">
                  {isConnecting ? "Chiamata in corso" : "Videochiamata"}
                </span>
              </div>
            </motion.div>

            {/* Center section - Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className="flex flex-col items-center"
            >
              {/* Video container (hidden initially, fades in when ready) */}
              <AnimatePresence>
                {showVideo && videoElement && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    {videoElement}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Profile photo (shown while connecting/buffering) */}
              <AnimatePresence>
                {!showVideo && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    {/* Pulsing ring animation */}
                    {isConnecting && (
                      <>
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1.3],
                            opacity: [0.5, 0, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                          className="absolute inset-0 rounded-full border-4 border-primary"
                        />
                        <motion.div
                          animate={{
                            scale: [1, 1.5, 1.5],
                            opacity: [0.3, 0, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: 0.5,
                          }}
                          className="absolute inset-0 rounded-full border-2 border-primary/50"
                        />
                      </>
                    )}

                    {/* Speaking indicator ring */}
                    {isSpeaking && !isConnecting && (
                      <motion.div
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.8, 0.4, 0.8],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                        className="absolute inset-0 rounded-full border-4 border-primary"
                      />
                    )}

                    {/* Avatar image */}
                    <img
                      src={avatarImage}
                      alt={avatarName}
                      className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                    />

                    {/* Online indicator */}
                    {callState === "connected" && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-slate-800"
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Avatar name */}
              {!showVideo && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 text-center"
                >
                  <h2 className="text-2xl md:text-3xl font-semibold text-white">
                    {avatarName}
                  </h2>
                  <p className="mt-2 text-white/60">
                    {callState === "connected"
                      ? formatDuration(callDuration)
                      : getStatusText(callState)}
                  </p>

                  {/* Connecting dots animation */}
                  {isConnecting && (
                    <div className="flex justify-center gap-1 mt-3">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            y: [0, -4, 0],
                          }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-2 h-2 bg-white/60 rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Bottom section - Controls */}
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="pb-12 w-full"
            >
              {/* User speaking indicator */}
              <AnimatePresence>
                {isUserSpeaking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex justify-center mb-6"
                  >
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 backdrop-blur-lg rounded-full border border-green-500/30">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-400">
                        Ti sto ascoltando...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Control buttons */}
              <div className="flex items-center justify-center gap-6">
                {/* Mute button */}
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onMuteToggle}
                    className={`w-16 h-16 rounded-full transition-all ${
                      isMuted
                        ? "bg-red-500/80 hover:bg-red-500 text-white"
                        : "bg-white/10 hover:bg-white/20 text-white"
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-7 h-7" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </Button>
                  <p className="text-xs text-white/60 text-center mt-2">
                    {isMuted ? "Attiva" : "Muto"}
                  </p>
                </motion.div>

                {/* End call button */}
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEndCall}
                    className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                  >
                    <Phone className="w-8 h-8 rotate-[135deg]" />
                  </Button>
                  <p className="text-xs text-white/60 text-center mt-2">
                    Chiudi
                  </p>
                </motion.div>

                {/* Audio output selector */}
                <motion.div whileTap={{ scale: 0.9 }}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 text-white"
                      >
                        <Volume2 className="w-7 h-7" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="w-64 bg-slate-800/95 backdrop-blur-xl border-white/10"
                    >
                      <div className="px-3 py-2 text-xs text-white/50 uppercase tracking-wider">
                        Uscita Audio
                      </div>
                      {audioDevices.length > 0 ? (
                        audioDevices.map((device) => {
                          const DeviceIcon = getDeviceIcon(device.label);
                          const isSelected = device.deviceId === selectedAudioDevice;
                          return (
                            <DropdownMenuItem
                              key={device.deviceId}
                              onClick={() => onAudioOutputChange?.(device.deviceId)}
                              className={`flex items-center gap-3 px-3 py-3 cursor-pointer ${
                                isSelected
                                  ? "bg-primary/20 text-white"
                                  : "text-white/80 hover:text-white"
                              }`}
                            >
                              <DeviceIcon className="w-5 h-5" />
                              <span className="flex-1 truncate">
                                {device.label || "Dispositivo sconosciuto"}
                              </span>
                              {isSelected && (
                                <div className="w-2 h-2 bg-primary rounded-full" />
                              )}
                            </DropdownMenuItem>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-center text-white/50 text-sm">
                          Nessun dispositivo rilevato
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="text-xs text-white/60 text-center mt-2">
                    Audio
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CallOverlay;
