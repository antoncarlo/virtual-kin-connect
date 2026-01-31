import { useEffect, useRef } from "react";
import { RemoteTrack } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

interface RemoteVideoTrackProps {
  track: RemoteTrack | null;
  className?: string;
  fallbackImage?: string;
  fallbackName?: string;
}

/**
 * Component to render a remote video track from LiveKit.
 * Shows a fallback avatar when no video is available.
 */
export function RemoteVideoTrack({
  track,
  className = "",
  fallbackImage,
  fallbackName,
}: RemoteVideoTrackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !track) return;

    // Attach the track to the video element
    track.attach(videoRef.current);
    console.log("[RemoteVideoTrack] Track attached");

    return () => {
      if (videoRef.current) {
        track.detach(videoRef.current);
        console.log("[RemoteVideoTrack] Track detached");
      }
    };
  }, [track]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {track ? (
          <motion.video
            key="video"
            ref={videoRef}
            autoPlay
            playsInline
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-full object-cover"
          />
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-800 to-slate-900"
          >
            {fallbackImage ? (
              <img
                src={fallbackImage}
                alt={fallbackName || "Avatar"}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center">
                <User className="w-12 h-12 text-white/40" />
              </div>
            )}
            {fallbackName && (
              <p className="mt-3 text-white/80 font-medium">{fallbackName}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
