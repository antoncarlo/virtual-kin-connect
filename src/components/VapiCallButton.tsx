import { forwardRef, useImperativeHandle } from "react";
import { Phone, PhoneOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVapiCall } from "@/hooks/useVapiCall";
import { cn } from "@/lib/utils";

interface VapiCallButtonProps {
  assistantId?: string;
  avatarName?: string;
  className?: string;
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
}

export interface VapiCallButtonRef {
  startCall: () => Promise<void>;
  endCall: () => void;
  isConnected: boolean;
}

export const VapiCallButton = forwardRef<VapiCallButtonRef, VapiCallButtonProps>(
  ({ assistantId, avatarName, className, onUserTranscript, onAgentResponse }, ref) => {
    const {
      isConnecting,
      isConnected,
      isSpeaking,
      startCall,
      endCall,
    } = useVapiCall({
      assistantId,
      onTranscript: (text, isFinal) => {
        if (isFinal && text) {
          onUserTranscript?.(text);
        }
      },
      onSpeechEnd: () => {
        // Agent finished speaking - could capture response here if needed
      },
    });

    useImperativeHandle(ref, () => ({
      startCall,
      endCall,
      isConnected,
    }));

    const handleClick = async () => {
      if (isConnected) {
        endCall();
      } else {
        await startCall();
      }
    };

    if (!assistantId) {
      return null;
    }

    return (
      <Button
        variant={isConnected ? "destructive" : "ghost"}
        size="icon"
        className={cn(
          "relative",
          isConnected && "animate-pulse",
          isSpeaking && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          className
        )}
        onClick={handleClick}
        disabled={isConnecting}
        title={isConnected ? `Termina chiamata con ${avatarName}` : `Chiama ${avatarName}`}
      >
        {isConnecting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isConnected ? (
          <PhoneOff className="w-5 h-5" />
        ) : (
          <Phone className="w-5 h-5" />
        )}
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
        )}
      </Button>
    );
  }
);

VapiCallButton.displayName = "VapiCallButton";
