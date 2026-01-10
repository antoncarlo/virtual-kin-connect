import { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useToast } from '@/hooks/use-toast';

interface UseConversationAIProps {
  agentId?: string;
  onUserTranscript?: (transcript: string) => void;
  onAgentResponse?: (response: string) => void;
}

export function useConversationAI({ 
  agentId, 
  onUserTranscript, 
  onAgentResponse 
}: UseConversationAIProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to ElevenLabs agent');
      toast({
        title: "Chiamata connessa",
        description: "Puoi iniziare a parlare!",
      });
    },
    onDisconnect: () => {
      console.log('Disconnected from ElevenLabs agent');
      toast({
        title: "Chiamata terminata",
        description: "La conversazione è stata chiusa.",
      });
    },
    onMessage: (message: any) => {
      console.log('Message from agent:', message);
      
      // Handle user transcript
      if (message.type === 'user_transcript' && onUserTranscript) {
        const transcript = message.user_transcription_event?.user_transcript;
        if (transcript) {
          onUserTranscript(transcript);
        }
      }
      
      // Handle agent response
      if (message.type === 'agent_response' && onAgentResponse) {
        const response = message.agent_response_event?.agent_response;
        if (response) {
          onAgentResponse(response);
        }
      }
    },
    onError: (error) => {
      console.error('Conversation error:', error);
      toast({
        variant: "destructive",
        title: "Errore di connessione",
        description: "Impossibile connettersi all'agente vocale. Riprova.",
      });
    },
  });

  const startCall = useCallback(async () => {
    if (!agentId) {
      toast({
        variant: "destructive",
        title: "Agent non configurato",
        description: "Questo avatar non ha un agente vocale configurato.",
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation with public agent ID (WebRTC for better quality)
      await conversation.startSession({
        agentId: agentId,
        connectionType: "webrtc",
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        toast({
          variant: "destructive",
          title: "Microfono richiesto",
          description: "Abilita l'accesso al microfono per usare le chiamate vocali.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Errore",
          description: "Impossibile avviare la chiamata. Riprova.",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [agentId, conversation, toast]);

  const endCall = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return {
    isConnecting,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    startCall,
    endCall,
  };
}
