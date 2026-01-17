import { motion } from "framer-motion";
import { Wifi, WifiOff, Phone } from "lucide-react";

interface FallbackModeProps {
  avatarImage: string;
  avatarName: string;
  isActive: boolean;
  onReconnect?: () => void;
}

export function FallbackMode({ avatarImage, avatarName, isActive }: FallbackModeProps) {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-10"
    >
      {/* Pulsing avatar with static image */}
      <div className="relative">
        {/* Animated glow ring */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/50 to-accent/50 blur-xl"
          style={{ margin: "-20px" }}
        />
        
        {/* Secondary pulse ring */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className="absolute inset-0 rounded-full bg-primary/30 blur-2xl"
          style={{ margin: "-30px" }}
        />

        {/* Avatar image with subtle breathing animation */}
        <motion.img
          src={avatarImage}
          alt={avatarName}
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="w-48 h-48 md:w-64 md:h-64 rounded-full object-cover border-4 border-primary/50 shadow-2xl relative z-10"
        />

        {/* Speaking indicator */}
        <motion.div
          animate={{
            scale: [0.8, 1, 0.8],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 rounded-full p-2 shadow-lg z-20"
        >
          <Phone className="w-4 h-4 text-white" />
        </motion.div>
      </div>

      {/* Voice-only indicator */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <WifiOff className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-500 text-sm font-medium">Connessione limitata</span>
        </div>
        <h3 className="text-white text-xl font-semibold">{avatarName}</h3>
        <p className="text-white/60 text-sm mt-1">Solo audio attivo</p>
      </motion.div>

      {/* Audio wave animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-1 mt-6"
      >
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              height: [8, 24, 8],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
            className="w-1 bg-primary/80 rounded-full"
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
