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
 * - Glassmorphism header with audio/video controls
 * - End call button at bottom
 * - Smooth transition to video when ready
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CallHeader, type AudioDevice } from "./CallHeader";

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
  /** Whether camera is enabled */
  isCameraOn: boolean;
  /** Whether avatar is speaking */
  isSpeaking?: boolean;
  /** Whether user is speaking */
  isUserSpeaking?: boolean;
  /** Connection quality indicator */
  connectionQuality?: "excellent" | "good" | "poor";
  /** Video element to show when connected */
  videoElement?: React.ReactNode;
  /** Whether connection is taking too long (show friendly message) */
  isSlowConnection?: boolean;
  /** Callback when mute is toggled */
  onMuteToggle: () => void;
  /** Callback when camera is toggled */
  onVideoToggle: () => void;
  /** Callback when audio output device changes */
  onAudioOutputChange?: (deviceId: string) => void;
  /** Callback when call is ended */
  onEndCall: () => void;
  /** Available audio output devices */
  audioDevices?: AudioDevice[];
  /** Currently selected audio output device */
  selectedAudioDevice?: string;
  /** Whether to show video toggle */
  showVideoToggle?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusText = (state: CallState, isSlowConnection: boolean = false): string => {
  // Show friendly timeout message when connection takes too long
  if (isSlowConnection && ["initiating", "connecting", "buffering"].includes(state)) {
    return "Preparing the room for us...";
  }
  
  switch (state) {
    case "initiating":
      return "Ringing...";
    case "connecting":
      return "Establishing connection...";
    case "buffering":
      return "Preparing video...";
    case "connected":
      return "Connected";
    case "reconnecting":
      return "Reconnecting...";
    case "ended":
      return "Call ended";
    default:
      return "";
  }
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
  isCameraOn,
  isSpeaking = false,
  isUserSpeaking = false,
  connectionQuality = "good",
  videoElement,
  isSlowConnection = false,
  onMuteToggle,
  onVideoToggle,
  onAudioOutputChange,
  onEndCall,
  audioDevices = [],
  selectedAudioDevice,
  showVideoToggle = true,
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
          className="fixed inset-0 z-[9999] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
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

          {/* Glassmorphism Header with controls */}
          <CallHeader
            avatarName={avatarName}
            avatarImage={avatarImage}
            callDuration={callDuration}
            isMuted={isMuted}
            isCameraOn={isCameraOn}
            connectionQuality={connectionQuality}
            statusText={isConnecting ? getStatusText(callState, isSlowConnection) : undefined}
            onMuteToggle={onMuteToggle}
            onVideoToggle={onVideoToggle}
            onAudioOutputChange={onAudioOutputChange}
            audioDevices={audioDevices}
            selectedAudioDevice={selectedAudioDevice}
            showVideoToggle={showVideoToggle}
          />

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full pt-20 pb-32">
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

              {/* Status text below avatar */}
              {!showVideo && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-8 text-center"
                >
                  {/* Connecting dots animation */}
                  {isConnecting && (
                    <div className="flex justify-center gap-1.5 mb-4">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            opacity: [0.3, 1, 0.3],
                            scale: [0.8, 1.2, 0.8],
                          }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                          className="w-2.5 h-2.5 bg-primary rounded-full"
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Bottom section - End call button */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="absolute bottom-0 left-0 right-0 pb-12 pt-6"
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
                      Listening to you...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* End call button */}
            <div className="flex justify-center">
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEndCall}
                  className="w-16 h-16 md:w-18 md:h-18 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30"
                >
                  <Phone className="w-7 h-7 rotate-[135deg]" />
                </Button>
                <p className="text-xs text-white/60 text-center mt-2">
                  End call
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CallOverlay;
