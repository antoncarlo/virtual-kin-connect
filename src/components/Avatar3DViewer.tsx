import { lazy, Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Lazy load the 3D canvas to avoid initialization issues
const Avatar3DCanvas = lazy(() => import("./Avatar3DCanvas"));

interface Avatar3DViewerProps {
  avatarUrl?: string;
  avatarImage?: string;
  className?: string;
  isSpeaking?: boolean;
}

// Fallback animated avatar component
function FallbackAvatar({ 
  avatarImage, 
  isSpeaking, 
  className 
}: { 
  avatarImage?: string; 
  isSpeaking: boolean; 
  className: string;
}) {
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
        {avatarImage ? (
          <img 
            src={avatarImage} 
            alt="Avatar" 
            className="w-48 h-48 rounded-full object-cover border-4 border-primary/30 shadow-2xl"
          />
        ) : (
          <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-4 border-primary/30 shadow-2xl flex items-center justify-center">
            <span className="text-4xl">👤</span>
          </div>
        )}
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

export function Avatar3DViewer({ 
  avatarUrl, 
  avatarImage,
  className = "", 
  isSpeaking = false 
}: Avatar3DViewerProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Set a timeout for loading - if it takes too long, show fallback
  useEffect(() => {
    if (avatarUrl && !isLoaded && !hasError) {
      const timer = setTimeout(() => {
        if (!isLoaded) {
          console.log('Avatar 3D loading timeout, showing fallback');
          setLoadTimeout(true);
        }
      }, 8000); // 8 second timeout
      
      return () => clearTimeout(timer);
    }
  }, [avatarUrl, isLoaded, hasError]);

  // Reset state when avatarUrl changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    setLoadTimeout(false);
  }, [avatarUrl]);

  // Show fallback if error, timeout, or no 3D avatar URL
  if (hasError || loadTimeout || !avatarUrl) {
    return (
      <FallbackAvatar 
        avatarImage={avatarImage} 
        isSpeaking={isSpeaking} 
        className={className} 
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}
    >
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Caricamento avatar 3D...</p>
          </div>
        </div>
      )}

      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        }
      >
        <Avatar3DCanvas 
          avatarUrl={avatarUrl} 
          isSpeaking={isSpeaking}
          onLoaded={() => {
            console.log('Avatar 3D loaded successfully');
            setIsLoaded(true);
          }}
          onError={() => {
            console.error('Avatar 3D failed to load');
            setHasError(true);
          }}
        />
      </Suspense>
      
      {/* Speaking indicator overlay */}
      {isSpeaking && isLoaded && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 pointer-events-none">
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
      )}
      
      {/* Instructions */}
      {isLoaded && (
        <div className="absolute bottom-2 left-2 right-2 text-center pointer-events-none">
          <p className="text-xs text-white/30">Trascina per ruotare • Scroll per zoom</p>
        </div>
      )}
    </motion.div>
  );
}
