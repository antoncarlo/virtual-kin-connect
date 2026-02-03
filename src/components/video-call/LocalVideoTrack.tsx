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

    const el = videoRef.current;

    // Attach the track to the video element
    track.attach(el);
    console.log("[LocalVideoTrack] Track attached", {
      trackSid: track.sid,
      muted: track.isMuted,
      mediaStreamTrackEnabled: track.mediaStreamTrack?.enabled,
    });

    // Some browsers require an explicit play() even with autoPlay.
    const tryPlay = (reason: string) => {
      const p = el.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch((err) => {
          console.warn("[LocalVideoTrack] video.play() blocked", { reason, err: String(err) });
        });
      }
    };

    const onLoadedMetadata = () => {
      console.log("[LocalVideoTrack] loadedmetadata", {
        readyState: el.readyState,
        videoWidth: el.videoWidth,
        videoHeight: el.videoHeight,
      });
      tryPlay("loadedmetadata");
    };

    const onPlaying = () => {
      console.log("[LocalVideoTrack] playing", {
        readyState: el.readyState,
        currentTime: el.currentTime,
      });
    };

    const onError = () => {
      console.error("[LocalVideoTrack] video element error", el.error);
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("canplay", onLoadedMetadata);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);

    // Kick an initial play attempt (keeps gesture context if any)
    requestAnimationFrame(() => tryPlay("raf"));

    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("canplay", onLoadedMetadata);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
      track.detach(el);
      console.log("[LocalVideoTrack] Track detached", { trackSid: track.sid });
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
            preload="auto"
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
