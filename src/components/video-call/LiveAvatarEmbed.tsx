/**
 * LiveAvatarEmbed Component
 *
 * Displays HeyGen LiveAvatar using iframe embed approach.
 * Much simpler and more reliable than the SDK/WebRTC approach.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LiveAvatarEmbedProps {
  embedId: string;
  className?: string;
  onReady?: () => void;
  onError?: (error: Error) => void;
  showControls?: boolean;
}

export function LiveAvatarEmbed({
  embedId,
  className = "",
  onReady,
  onError,
  showControls = false,
}: LiveAvatarEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const embedUrl = `https://embed.liveavatar.com/v1/${embedId}`;

  const handleLoad = useCallback(() => {
    console.log("[LiveAvatarEmbed] Iframe loaded successfully");
    setIsLoading(false);
    setHasError(false);
    onReady?.();
  }, [onReady]);

  const handleError = useCallback(() => {
    console.error("[LiveAvatarEmbed] Failed to load iframe");
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error("Failed to load LiveAvatar embed"));
  }, [onError]);

  // Add timeout for loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn("[LiveAvatarEmbed] Loading timeout - may still be loading");
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* Loading state */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Connecting to avatar...</p>
        </motion.div>
      )}

      {/* Error state */}
      {hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 z-10"
        >
          <AlertCircle className="w-12 h-12 text-destructive mb-3" />
          <p className="text-sm text-muted-foreground mb-4">Failed to connect to avatar</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
              // Force iframe reload
              if (iframeRef.current) {
                iframeRef.current.src = embedUrl;
              }
            }}
          >
            Try Again
          </Button>
        </motion.div>
      )}

      {/* LiveAvatar iframe - fills parent container */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        allow="microphone; camera; autoplay"
        title="LiveAvatar"
        className="absolute inset-0 w-full h-full border-0"
        style={{ 
          backgroundColor: "#000",
          minHeight: "100%",
          minWidth: "100%",
        }}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Optional controls overlay */}
      {showControls && !isLoading && !hasError && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}

// Default embed ID
export const DEFAULT_LIVEAVATAR_EMBED_ID = "c3de1c12-a5ca-42b5-9091-277b885c7f30";
