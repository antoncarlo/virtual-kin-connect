import { Phone, PhoneOff, Loader2, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useConversationAI } from "@/hooks/useConversationAI";

interface VoiceCallButtonProps {
  agentId?: string;
  avatarName: string;
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
}

// Audio wave animation component
function AudioWaveIndicator({ isActive, color }: { isActive: boolean; color: string }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-4">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`w-0.5 rounded-full ${color}`}
          animate={isActive ? {
            height: [4, 12, 6, 14, 4],
          } : {
            height: 4,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Pulsing ring animation
function PulsingRing({ color }: { color: string }) {
  return (
    <motion.div
      className={`absolute inset-0 rounded-full ${color}`}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.5, 0, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

export function VoiceCallButton({ 
  agentId, 
  avatarName,
  onUserTranscript,
  onAgentResponse,
}: VoiceCallButtonProps) {
  const { 
    isConnecting, 
    status, 
    isSpeaking, 
    startCall, 
    endCall 
  } = useConversationAI({ 
    agentId, 
    onUserTranscript, 
    onAgentResponse 
  });

  const isConnected = status === 'connected';
  const isListening = isConnected && !isSpeaking;

  if (!agentId) {
    return null;
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="connected"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="flex items-center gap-3"
          >
            {/* Status indicator with icon and wave */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/50"
              animate={{
                borderColor: isSpeaking 
                  ? "hsl(var(--primary))" 
                  : "hsl(var(--accent))",
              }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon based on state */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="relative"
              >
                {isSpeaking ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <Mic className="w-4 h-4 text-accent-foreground" />
                )}
              </motion.div>

              {/* Audio wave visualization */}
              <AudioWaveIndicator 
                isActive={isSpeaking || isListening} 
                color={isSpeaking ? "bg-primary" : "bg-accent-foreground"}
              />

              {/* Status text */}
              <span className={`text-xs font-medium ${
                isSpeaking ? "text-primary" : "text-accent-foreground"
              }`}>
                {isSpeaking ? "Parla" : "Ascolta"}
              </span>
            </motion.div>
            
            {/* End call button with pulsing effect */}
            <div className="relative">
              <PulsingRing color="bg-destructive/30" />
              <Button
                variant="ghost"
                size="icon"
                onClick={endCall}
                className="relative text-destructive hover:bg-destructive/10 rounded-full"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative"
          >
            {isConnecting && (
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/20"
                animate={{
                  scale: [1, 1.8],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={startCall}
              disabled={isConnecting}
              className="relative text-primary hover:bg-primary/10 rounded-full"
              title={`Chiama ${avatarName}`}
            >
              {isConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
