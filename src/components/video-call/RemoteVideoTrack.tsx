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

    const el = videoRef.current;

    // Attach the track to the video element
    track.attach(el);
    console.log("[RemoteVideoTrack] Track attached", {
      kind: track.kind,
      trackSid: track.sid,
      muted: track.isMuted,
      mediaStreamTrackId: track.mediaStreamTrack?.id,
      mediaStreamTrackReadyState: track.mediaStreamTrack?.readyState,
    });

    // Some browsers require an explicit play() even with autoPlay.
    const tryPlay = (reason: string) => {
      const p = el.play();
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch((err) => {
          console.warn("[RemoteVideoTrack] video.play() blocked", { reason, err: String(err) });
        });
      }
    };

    const onLoadedMetadata = () => {
      console.log("[RemoteVideoTrack] loadedmetadata", {
        readyState: el.readyState,
        videoWidth: el.videoWidth,
        videoHeight: el.videoHeight,
      });
      tryPlay("loadedmetadata");
    };

    const onPlaying = () => {
      console.log("[RemoteVideoTrack] playing", {
        readyState: el.readyState,
        currentTime: el.currentTime,
      });
    };

    const onError = () => {
      console.error("[RemoteVideoTrack] video element error", el.error);
    };

    el.addEventListener("loadedmetadata", onLoadedMetadata);
    el.addEventListener("canplay", onLoadedMetadata);
    el.addEventListener("playing", onPlaying);
    el.addEventListener("error", onError);

    requestAnimationFrame(() => tryPlay("raf"));

    return () => {
      el.removeEventListener("loadedmetadata", onLoadedMetadata);
      el.removeEventListener("canplay", onLoadedMetadata);
      el.removeEventListener("playing", onPlaying);
      el.removeEventListener("error", onError);
      track.detach(el);
      console.log("[RemoteVideoTrack] Track detached", { trackSid: track.sid });
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
            muted
            preload="auto"
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
