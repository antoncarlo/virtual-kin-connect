/**
 * useLiveAvatarEmbed Hook
 *
 * Simple React hook for HeyGen LiveAvatar using iframe embed.
 * Much simpler than the SDK approach - just uses an iframe.
 */

import { useState, useCallback, useRef } from "react";

interface UseLiveAvatarEmbedOptions {
  embedId: string; // The embed ID from liveavatar.com
  onReady?: () => void;
  onError?: (error: Error) => void;
}

interface UseLiveAvatarEmbedReturn {
  isReady: boolean;
  error: Error | null;
  embedUrl: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

export function useLiveAvatarEmbed(options: UseLiveAvatarEmbedOptions): UseLiveAvatarEmbedReturn {
  const { embedId, onReady, onError } = options;

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Construct embed URL
  const embedUrl = `https://embed.liveavatar.com/v1/${embedId}`;

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    console.log("[LiveAvatarEmbed] Iframe loaded");
    setIsReady(true);
    onReady?.();
  }, [onReady]);

  // Handle iframe error
  const handleIframeError = useCallback(() => {
    const err = new Error("Failed to load LiveAvatar embed");
    console.error("[LiveAvatarEmbed] Iframe error:", err);
    setError(err);
    onError?.(err);
  }, [onError]);

  return {
    isReady,
    error,
    embedUrl,
    iframeRef,
  };
}

// Default embed ID from user's configuration
export const DEFAULT_LIVEAVATAR_EMBED_ID = "c3de1c12-a5ca-42b5-9091-277b885c7f30";
