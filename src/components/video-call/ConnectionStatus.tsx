import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ConnectionStatusProps {
  status: "connecting" | "connected" | "disconnected" | "reconnecting";
  avatarName: string;
}

export function ConnectionStatus({ status, avatarName }: ConnectionStatusProps) {
  const statusConfig = {
    connecting: {
      title: "Connessione in corso...",
      subtitle: `Preparando la videochiamata con ${avatarName}`,
      color: "text-primary",
    },
    connected: {
      title: "Connesso",
      subtitle: `Stai parlando con ${avatarName}`,
      color: "text-green-400",
    },
    disconnected: {
      title: "Disconnesso",
      subtitle: "La chiamata è terminata",
      color: "text-red-400",
    },
    reconnecting: {
      title: "Riconnessione...",
      subtitle: "Tentativo di riconnessione in corso",
      color: "text-yellow-400",
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md"
    >
      <div className="text-center">
        {/* Animated Loader */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-primary/20"
          />
          
          {/* Middle ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full border-2 border-primary/40"
          />
          
          {/* Inner spinning arc */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-4 rounded-full border-2 border-transparent border-t-primary"
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className={`w-8 h-8 animate-spin ${config.color}`} />
          </div>
        </div>

        {/* Status Text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`text-xl md:text-2xl font-semibold ${config.color}`}
        >
          {config.title}
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white/60 text-sm md:text-base mt-2"
        >
          {config.subtitle}
        </motion.p>

        {/* Progress dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-2 h-2 rounded-full bg-primary"
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
