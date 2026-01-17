import { motion } from "framer-motion";
import { Phone, Sparkles, Heart } from "lucide-react";

interface WelcomeAnimationProps {
  avatarName: string;
}

export function WelcomeAnimation({ avatarName }: WelcomeAnimationProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0,
              opacity: 0,
            }}
            animate={{
              y: [null, -100],
              scale: [0, 1, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.15,
              repeat: Infinity,
              repeatDelay: 2,
            }}
            className="absolute w-2 h-2 rounded-full bg-primary/50"
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative text-center px-6">
        {/* Animated Phone Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 10, stiffness: 100 }}
          className="relative inline-flex items-center justify-center mb-8"
        >
          {/* Glow rings */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-24 h-24 rounded-full bg-primary/20"
          />
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            className="absolute w-32 h-32 rounded-full bg-primary/10"
          />
          
          {/* Phone circle */}
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, repeat: 3, delay: 0.5 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Phone className="w-8 h-8 text-white" />
          </motion.div>
        </motion.div>

        {/* Welcome Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Connessione con{" "}
            <span className="text-gradient">{avatarName}</span>
          </h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/60 text-sm md:text-base flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Preparando videochiamata HD
            <Sparkles className="w-4 h-4 text-accent" />
          </motion.p>
        </motion.div>

        {/* Loading Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-8 w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </motion.div>

        {/* Heart Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, type: "spring" }}
          className="mt-6 flex items-center justify-center gap-1 text-white/40 text-xs"
        >
          <Heart className="w-3 h-3 text-red-400" />
          <span>La tua esperienza più realistica</span>
          <Heart className="w-3 h-3 text-red-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}
