import { useEffect, useRef } from "react";
import { LocalVideoTrack as LKLocalVideoTrack } from "livekit-client";
import { motion, AnimatePresence } from "framer-motion";
import { VideoOff } from "lucide-react";

interface LocalVideoTrackProps {
  track: LKLocalVideoTrack | null;
  isCameraOn: boolean;
  className?: string;
  mirrored?: boolean;
}

/**
 * Component to render the local video track from LiveKit.
 * Handles attaching/detaching the track to a video element.
 */
export function LocalVideoTrack({
  track,
  isCameraOn,
  className = "",
  mirrored = true,
}: LocalVideoTrackProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !track) return;

    // Attach the track to the video element
    track.attach(videoRef.current);
    console.log("[LocalVideoTrack] Track attached");

    return () => {
      if (videoRef.current) {
        track.detach(videoRef.current);
        console.log("[LocalVideoTrack] Track detached");
      }
    };
  }, [track]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {track && isCameraOn ? (
          <motion.video
            key="video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`w-full h-full object-cover ${mirrored ? "scale-x-[-1]" : ""}`}
          />
        ) : (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full bg-slate-800 text-white/60"
          >
            <VideoOff className="w-6 h-6 mb-1" />
            <p className="text-xs">Camera off</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
