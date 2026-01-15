import { lazy, Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// Lazy load the 3D canvas component to avoid initialization issues
const Avatar3DCanvas = lazy(() => import("./Avatar3DCanvas"));

interface Avatar3DViewerProps {
  avatarUrl?: string;
  className?: string;
  isSpeaking?: boolean;
}

export function Avatar3DViewer({ avatarUrl, className = "", isSpeaking = false }: Avatar3DViewerProps) {
  const [error, setError] = useState(false);

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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative ${className} flex items-center justify-center bg-gradient-to-br from-background to-muted rounded-xl`}
      >
        <p className="text-muted-foreground">Errore nel caricamento dell'avatar</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative ${className}`}
    >
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Caricamento avatar 3D...</p>
            </div>
          </div>
        }
      >
        <Avatar3DCanvas 
          avatarUrl={avatarUrl} 
          isSpeaking={isSpeaking} 
          onError={() => setError(true)} 
        />
      </Suspense>
      
      {/* Instructions overlay */}
      <div className="absolute bottom-2 left-2 right-2 text-center">
        <p className="text-xs text-white/40">Trascina per ruotare • Scroll per zoom</p>
      </div>
    </motion.div>
  );
}
