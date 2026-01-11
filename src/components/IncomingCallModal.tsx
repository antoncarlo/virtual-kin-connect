import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface IncomingCallModalProps {
  isOpen: boolean;
  avatarName: string;
  avatarImage: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallModal({
  isOpen,
  avatarName,
  avatarImage,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  // Play ringtone effect (vibration pattern simulation via visual)
  useEffect(() => {
    if (isOpen && navigator.vibrate) {
      // Vibrate pattern: vibrate 500ms, pause 200ms, repeat
      const interval = setInterval(() => {
        navigator.vibrate([500, 200, 500]);
      }, 1400);
      return () => {
        clearInterval(interval);
        navigator.vibrate(0);
      };
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex flex-col items-center gap-8 p-8"
          >
            {/* Pulsing rings behind avatar */}
            <div className="relative">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{
                    scale: [1, 1.5 + i * 0.3],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeOut",
                  }}
                />
              ))}
              
              {/* Avatar with bounce animation */}
              <motion.div
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Avatar className="w-32 h-32 border-4 border-primary shadow-lg shadow-primary/30">
                  <AvatarImage src={avatarImage} alt={avatarName} />
                  <AvatarFallback className="text-4xl">{avatarName[0]}</AvatarFallback>
                </Avatar>
              </motion.div>
            </div>

            {/* Caller info */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">{avatarName}</h2>
              <motion.p
                className="text-muted-foreground"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Chiamata in arrivo...
              </motion.p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-8 mt-4">
              {/* Reject button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={onReject}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30"
                >
                  <PhoneOff className="w-7 h-7" />
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">Rifiuta</p>
              </motion.div>

              {/* Accept button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Button
                  onClick={onAccept}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                >
                  <Phone className="w-7 h-7" />
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">Accetta</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
