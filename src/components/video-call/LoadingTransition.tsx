import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface LoadingTransitionProps {
  isLoading: boolean;
  avatarName: string;
  stage?: "initializing" | "connecting" | "stabilizing" | "ready";
}

export function LoadingTransition({
  isLoading,
  avatarName,
  stage = "initializing",
}: LoadingTransitionProps) {
  const stageMessages = {
    initializing: "Inizializzazione...",
    connecting: "Connessione a HeyGen...",
    stabilizing: "Stabilizzazione video...",
    ready: "Pronto!",
  };

  const stageProgress = {
    initializing: 25,
    connecting: 50,
    stabilizing: 75,
    ready: 100,
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center"
        >
          {/* Animated Blur Background */}
          <motion.div
            initial={{ backdropFilter: "blur(30px)" }}
            animate={{ 
              backdropFilter: stage === "ready" ? "blur(0px)" : "blur(20px)" 
            }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60"
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Pulsing Avatar Silhouette */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut" 
              }}
              className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent"
              />
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </motion.div>

            {/* Status Text */}
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h3 className="text-white font-medium text-lg mb-1">
                Connessione con {avatarName}
              </h3>
              <p className="text-white/60 text-sm">
                {stageMessages[stage]}
              </p>
            </motion.div>

            {/* Progress Bar */}
            <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: `${stageProgress[stage]}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
            </div>

            {/* Decorative Elements */}
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -z-10 w-64 h-64 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
