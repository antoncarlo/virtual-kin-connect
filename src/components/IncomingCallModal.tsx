import { Phone, PhoneOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useCallback } from "react";

interface IncomingCallModalProps {
  isOpen: boolean;
  avatarName: string;
  avatarImage: string;
  onAccept: () => void;
  onReject: () => void;
}

// Create ringtone using Web Audio API
function createRingtone() {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = () => {
    // Create oscillators for a pleasant ringtone
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Set frequencies for a nice chord
    oscillator1.frequency.value = 440; // A4
    oscillator2.frequency.value = 554.37; // C#5
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    
    // Connect oscillators to gain node
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Set volume
    gainNode.gain.value = 0.3;
    
    const now = audioContext.currentTime;
    
    // Envelope for smooth sound
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
    
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + 0.5);
    oscillator2.stop(now + 0.5);
  };
  
  return { audioContext, playTone };
}

export function IncomingCallModal({
  isOpen,
  avatarName,
  avatarImage,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const ringtoneRef = useRef<{ audioContext: AudioContext; playTone: () => void } | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopRingtone = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (ringtoneRef.current?.audioContext) {
      ringtoneRef.current.audioContext.close().catch(() => {});
      ringtoneRef.current = null;
    }
  }, []);

  // Play ringtone when modal opens
  useEffect(() => {
    if (isOpen) {
      // Initialize ringtone
      try {
        ringtoneRef.current = createRingtone();
        
        // Play immediately
        ringtoneRef.current.playTone();
        
        // Repeat every 1.5 seconds
        intervalRef.current = setInterval(() => {
          if (ringtoneRef.current) {
            ringtoneRef.current.playTone();
            // Second beep after 300ms for that classic ringtone feel
            setTimeout(() => {
              if (ringtoneRef.current) {
                ringtoneRef.current.playTone();
              }
            }, 300);
          }
        }, 2000);
      } catch (error) {
        console.error('Failed to create ringtone:', error);
      }
      
      // Vibration pattern
      if (navigator.vibrate) {
        const vibrationInterval = setInterval(() => {
          navigator.vibrate([500, 200, 500]);
        }, 1400);
        
        return () => {
          clearInterval(vibrationInterval);
          navigator.vibrate(0);
          stopRingtone();
        };
      }
      
      return () => {
        stopRingtone();
      };
    }
  }, [isOpen, stopRingtone]);

  const handleAccept = () => {
    stopRingtone();
    onAccept();
  };

  const handleReject = () => {
    stopRingtone();
    onReject();
  };

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
                Incoming call...
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
                  onClick={handleReject}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-destructive hover:bg-destructive/90 shadow-lg shadow-destructive/30"
                >
                  <PhoneOff className="w-7 h-7" />
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">Decline</p>
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
                  onClick={handleAccept}
                  size="lg"
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                >
                  <Phone className="w-7 h-7" />
                </Button>
                <p className="text-xs text-center mt-2 text-muted-foreground">Accept</p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}