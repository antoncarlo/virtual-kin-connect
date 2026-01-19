/**
 * CallHeader Component
 *
 * WhatsApp-style glassmorphism header for video calls.
 * - Avatar name/logo on the left
 * - Audio/Video toggle icons on the right with generous spacing
 * - Semi-transparent blur effect
 */

import React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  Volume2,
  Bluetooth,
  Speaker,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: "audiooutput" | "audioinput";
}

export interface CallHeaderProps {
  /** Avatar name to display */
  avatarName: string;
  /** Avatar image URL */
  avatarImage?: string;
  /** Current call duration in seconds */
  callDuration?: number;
  /** Whether microphone is muted */
  isMuted: boolean;
  /** Whether camera is enabled */
  isCameraOn: boolean;
  /** Connection quality */
  connectionQuality?: "excellent" | "good" | "poor";
  /** Status text to display */
  statusText?: string;
  /** Callback when mute is toggled */
  onMuteToggle: () => void;
  /** Callback when camera is toggled */
  onVideoToggle: () => void;
  /** Callback when audio output device changes */
  onAudioOutputChange?: (deviceId: string) => void;
  /** Available audio output devices */
  audioDevices?: AudioDevice[];
  /** Currently selected audio output device */
  selectedAudioDevice?: string;
  /** Whether to show video toggle (hide in audio-only mode) */
  showVideoToggle?: boolean;
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getDeviceIcon = (label: string) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("bluetooth")) return Bluetooth;
  if (lowerLabel.includes("headphone") || lowerLabel.includes("cuffi")) return Headphones;
  if (lowerLabel.includes("speaker") || lowerLabel.includes("altoparlant")) return Speaker;
  return Volume2;
};

const getQualityColor = (quality: "excellent" | "good" | "poor") => {
  switch (quality) {
    case "excellent":
      return "text-green-400";
    case "good":
      return "text-yellow-400";
    case "poor":
      return "text-red-400";
    default:
      return "text-white/60";
  }
};

export function CallHeader({
  avatarName,
  avatarImage,
  callDuration = 0,
  isMuted,
  isCameraOn,
  connectionQuality = "good",
  statusText,
  onMuteToggle,
  onVideoToggle,
  onAudioOutputChange,
  audioDevices = [],
  selectedAudioDevice,
  showVideoToggle = true,
}: CallHeaderProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute top-0 left-0 right-0 z-50"
    >
      {/* Glassmorphism background */}
      <div className="bg-black/30 backdrop-blur-xl border-b border-white/10 safe-area-inset-top">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
          {/* Left side: Avatar info */}
          <div className="flex items-center gap-3">
            {avatarImage && (
              <img
                src={avatarImage}
                alt={avatarName}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-white/20"
              />
            )}
            <div className="flex flex-col">
              <h3 className="text-white font-medium text-base md:text-lg">
                {avatarName}
              </h3>
              <div className="flex items-center gap-2">
                <Wifi className={`w-3 h-3 ${getQualityColor(connectionQuality)}`} />
                <span className="text-white/60 text-xs md:text-sm">
                  {statusText || formatDuration(callDuration)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: Controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Microphone toggle */}
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={onMuteToggle}
                className={`w-11 h-11 md:w-12 md:h-12 rounded-full transition-all ${
                  isMuted
                    ? "bg-red-500/80 hover:bg-red-500 text-white"
                    : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                {isMuted ? (
                  <MicOff className="w-5 h-5 md:w-6 md:h-6" />
                ) : (
                  <Mic className="w-5 h-5 md:w-6 md:h-6" />
                )}
              </Button>
            </motion.div>

            {/* Video toggle */}
            {showVideoToggle && (
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onVideoToggle}
                  className={`w-11 h-11 md:w-12 md:h-12 rounded-full transition-all ${
                    !isCameraOn
                      ? "bg-red-500/80 hover:bg-red-500 text-white"
                      : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                >
                  {isCameraOn ? (
                    <Video className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <VideoOff className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </Button>
              </motion.div>
            )}

            {/* Audio output selector */}
            {audioDevices.length > 0 && (
              <motion.div whileTap={{ scale: 0.9 }}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-11 h-11 md:w-12 md:h-12 rounded-full bg-white/15 hover:bg-white/25 text-white"
                    >
                      <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-64 bg-slate-800/95 backdrop-blur-xl border-white/10"
                  >
                    <div className="px-3 py-2 text-xs text-white/50 uppercase tracking-wider">
                      Audio Output
                    </div>
                    {audioDevices.map((device) => {
                      const DeviceIcon = getDeviceIcon(device.label);
                      const isSelected = device.deviceId === selectedAudioDevice;
                      return (
                        <DropdownMenuItem
                          key={device.deviceId}
                          onClick={() => onAudioOutputChange?.(device.deviceId)}
                          className={`flex items-center gap-3 cursor-pointer ${
                            isSelected
                              ? "bg-primary/20 text-white"
                              : "text-white/80 hover:bg-white/10"
                          }`}
                        >
                          <DeviceIcon className="w-4 h-4" />
                          <span className="truncate text-sm">
                            {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                          </span>
                          {isSelected && (
                            <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CallHeader;
