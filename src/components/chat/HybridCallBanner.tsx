import { motion, AnimatePresence } from "framer-motion";
import { Phone, Radio, Sparkles } from "lucide-react";

interface HybridCallBannerProps {
  isActive: boolean;
  avatarName: string;
  isSpeaking?: boolean;
}

export function HybridCallBanner({
  isActive,
  avatarName,
  isSpeaking = false,
}: HybridCallBannerProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className="overflow-hidden"
        >
          <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden">
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ backgroundSize: "200% 100%" }}
            />

            {/* Content */}
            <div className="relative z-10 px-4 py-3 flex items-center justify-between text-primary-foreground">
              <div className="flex items-center gap-3">
                {/* Animated phone icon */}
                <motion.div
                  animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
                  className="relative"
                >
                  <Phone className="w-5 h-5" />
                  {isSpeaking && (
                    <motion.div
                      className="absolute -inset-2 rounded-full bg-white/20"
                      animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                <div>
                  <p className="text-sm font-medium">
                    In chiamata con {avatarName}
                  </p>
                  <p className="text-xs opacity-80 flex items-center gap-1">
                    <Radio className="w-3 h-3" />
                    {isSpeaking ? "Sta parlando..." : "Modalità ibrida attiva"}
                  </p>
                </div>
              </div>

              {/* Sparkle indicator */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-5 h-5 opacity-80" />
              </motion.div>
            </div>

            {/* Listening indicator waves */}
            <div className="absolute bottom-0 left-0 right-0 h-1 flex gap-0.5 px-4 pb-1">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-white/30 rounded-full"
                  animate={isSpeaking ? {
                    height: [2, Math.random() * 8 + 2, 2],
                  } : { height: 2 }}
                  transition={{
                    duration: 0.3,
                    repeat: isSpeaking ? Infinity : 0,
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
