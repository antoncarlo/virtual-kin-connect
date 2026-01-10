import { Phone, PhoneOff, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useConversationAI } from "@/hooks/useConversationAI";

interface VoiceCallButtonProps {
  agentId?: string;
  avatarName: string;
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
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
            className="flex items-center gap-2"
          >
            {/* Speaking indicator */}
            <motion.div
              animate={isSpeaking ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className={`w-2 h-2 rounded-full ${
                isSpeaking ? 'bg-primary' : 'bg-muted-foreground'
              }`}
            />
            
            <Button
              variant="ghost"
              size="icon"
              onClick={endCall}
              className="text-destructive hover:bg-destructive/10"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={startCall}
              disabled={isConnecting}
              className="text-primary hover:bg-primary/10"
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
