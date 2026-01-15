import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseVapiCallProps {
  assistantId?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

interface VapiMessage {
  type: string;
  transcript?: string;
  isFinal?: boolean;
  role?: string;
}

export function useVapiCall({
  assistantId,
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  onCallStart,
  onCallEnd,
  onError,
}: UseVapiCallProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [vapiPublicKey, setVapiPublicKey] = useState<string | null>(null);
  const vapiRef = useRef<any>(null);

  // Fetch Vapi public key from edge function
  const fetchVapiPublicKey = useCallback(async () => {
    if (vapiPublicKey) return vapiPublicKey;
    
    try {
      const response = await supabase.functions.invoke('vapi-public-key');
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      const key = response.data?.publicKey;
      if (key) {
        setVapiPublicKey(key);
        return key;
      }
      throw new Error('No public key returned');
    } catch (error) {
      console.error('Failed to fetch Vapi public key:', error);
      throw error;
    }
  }, [vapiPublicKey]);

  // Load Vapi SDK dynamically
  const loadVapiSDK = useCallback(async () => {
    if ((window as any).Vapi) {
      return (window as any).Vapi;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).Vapi) {
          resolve((window as any).Vapi);
        } else {
          reject(new Error('Vapi SDK failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Vapi SDK'));
      document.head.appendChild(script);
    });
  }, []);

  const startCall = useCallback(async () => {
    if (!assistantId) {
      toast({
        title: "Errore",
        description: "Assistente non configurato per le chiamate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);

      // Get public key from backend
      const publicKey = await fetchVapiPublicKey();
      
      if (!publicKey) {
        throw new Error('Chiave Vapi non configurata');
      }

      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Load SDK
      const VapiSDK = await loadVapiSDK();
      
      // Initialize Vapi instance
      const vapi = new VapiSDK(publicKey);
      vapiRef.current = vapi;

      // Set up event listeners
      vapi.on('call-start', () => {
        setIsConnected(true);
        setIsConnecting(false);
        onCallStart?.();
        toast({
          title: "Chiamata iniziata",
          description: "Sei connesso!",
        });
      });

      vapi.on('call-end', () => {
        setIsConnected(false);
        setIsSpeaking(false);
        onCallEnd?.();
      });

      vapi.on('speech-start', () => {
        setIsSpeaking(true);
        onSpeechStart?.();
      });

      vapi.on('speech-end', () => {
        setIsSpeaking(false);
        onSpeechEnd?.();
      });

      vapi.on('message', (message: VapiMessage) => {
        if (message.type === 'transcript') {
          onTranscript?.(message.transcript || '', message.isFinal || false);
        }
      });

      vapi.on('error', (error: Error) => {
        console.error('Vapi error:', error);
        setIsConnecting(false);
        setIsConnected(false);
        onError?.(error);
        toast({
          title: "Errore chiamata",
          description: error.message || "Si è verificato un errore durante la chiamata.",
          variant: "destructive",
        });
      });

      // Start the call
      await vapi.start(assistantId);

    } catch (error) {
      console.error('Failed to start Vapi call:', error);
      setIsConnecting(false);
      
      if ((error as Error).name === 'NotAllowedError') {
        toast({
          title: "Permesso negato",
          description: "Abilita l'accesso al microfono per effettuare chiamate.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: (error as Error).message || "Impossibile avviare la chiamata. Riprova.",
          variant: "destructive",
        });
      }
      
      onError?.(error as Error);
    }
  }, [assistantId, fetchVapiPublicKey, loadVapiSDK, onTranscript, onSpeechStart, onSpeechEnd, onCallStart, onCallEnd, onError, toast]);

  const endCall = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
      vapiRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback((muted: boolean) => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(muted);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    isSpeaking,
    startCall,
    endCall,
    toggleMute,
  };
}
