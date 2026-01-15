import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface Avatar3DViewerProps {
  avatarUrl?: string;
  avatarImage?: string;
  className?: string;
  isSpeaking?: boolean;
}

export function Avatar3DViewer({ 
  avatarUrl, 
  avatarImage,
  className = "", 
  isSpeaking = false 
}: Avatar3DViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [useIframe, setUseIframe] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state when URL changes
  useEffect(() => {
    if (avatarUrl) {
      setIsLoading(true);
    }
  }, [avatarUrl]);

  // Generate avatar ID from URL
  const getAvatarId = (url: string) => {
    const match = url.match(/\/([a-f0-9-]+)\.glb$/i);
    return match ? match[1] : null;
  };

  const avatarId = avatarUrl ? getAvatarId(avatarUrl) : null;
  const rpmViewerUrl = avatarId 
    ? `https://models.readyplayer.me/${avatarId}.glb?morphTargets=ARKit,Oculus Visemes&textureAtlas=1024`
    : null;

  // Fallback to animated image if no 3D avatar
  if (!avatarUrl && avatarImage) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800`}
      >
        <motion.div
          animate={isSpeaking ? {
            scale: [1, 1.02, 1],
            y: [0, -2, 0],
          } : {
            y: [0, -3, 0],
          }}
          transition={{
            duration: isSpeaking ? 0.3 : 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <img 
            src={avatarImage} 
            alt="Avatar" 
            className="w-48 h-48 rounded-full object-cover border-4 border-primary/30 shadow-2xl"
          />
          {isSpeaking && (
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
              }}
              className="absolute inset-0 rounded-full border-4 border-primary"
            />
          )}
        </motion.div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [8, 24, 8],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
                className="w-1 bg-primary rounded-full"
                style={{ minHeight: 8 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  if (!avatarUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-xl`}
      >
        <p className="text-muted-foreground">Avatar 3D non disponibile</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 z-10">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Caricamento avatar...</p>
          </div>
        </div>
      )}
      
      {/* Use Ready Player Me iframe viewer */}
      <iframe
        ref={iframeRef}
        src={`https://readyplayer.me/avatar/${avatarId}?background=transparent`}
        className="w-full h-full border-0"
        style={{ 
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        }}
        allow="camera *; microphone *"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setUseIframe(false);
        }}
      />
      
      {/* Speaking overlay effect */}
      {isSpeaking && !isLoading && (
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-primary/10"
          />
          
          {/* Audio wave indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
            {[...Array(7)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: [6, 20, 6],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.08,
                }}
                className="w-1 bg-primary rounded-full"
                style={{ minHeight: 6 }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
