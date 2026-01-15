import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ReadyPlayerMeAvatarProps {
  avatarUrl?: string;
  onAvatarCreated?: (url: string) => void;
  className?: string;
  showCreator?: boolean;
}

export function ReadyPlayerMeAvatar({
  avatarUrl,
  onAvatarCreated,
  className = "",
  showCreator = false,
}: ReadyPlayerMeAvatarProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle messages from Ready Player Me iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://readyplayer.me") return;

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        
        if (data.source === "readyplayerme") {
          if (data.eventName === "v1.avatar.exported") {
            const newAvatarUrl = data.data.url;
            onAvatarCreated?.(newAvatarUrl);
            setIsLoading(false);
          }
          
          if (data.eventName === "v1.frame.ready") {
            iframeRef.current?.contentWindow?.postMessage(
              JSON.stringify({
                target: "readyplayerme",
                type: "subscribe",
                eventName: "v1.**",
              }),
              "*"
            );
          }
        }
      } catch (error) {
        console.error("Error parsing RPM message:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onAvatarCreated]);

  if (showCreator) {
    return (
      <div className={`relative ${className}`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src="https://readyplayer.me/avatar?frameApi"
          className="w-full h-full border-0 rounded-xl"
          allow="camera *; microphone *; clipboard-write"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
  }

  // Simple 3D avatar viewer using model-viewer (Google's web component)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {avatarUrl ? (
        <iframe
          src={`https://readyplayer.me/avatar/${avatarUrl.split('/').pop()?.replace('.glb', '')}?frameApi`}
          className="w-full h-full border-0 rounded-xl"
          allow="camera *; microphone *"
          onLoad={() => setIsLoading(false)}
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-xl">
          <p className="text-muted-foreground">Avatar non disponibile</p>
        </div>
      )}
    </motion.div>
  );
}
