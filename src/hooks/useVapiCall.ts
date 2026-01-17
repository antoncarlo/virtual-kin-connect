import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Vapi from "@vapi-ai/web";

interface UseVapiCallProps {
  assistantId?: string;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
  onUserSpeechStart?: () => void;
  onUserSpeechEnd?: () => void;
  onConnectionStateChange?: (state: ConnectionState) => void;
}

interface VapiMessage {
  type: string;
  transcript?: string;
  isFinal?: boolean;
  role?: string;
  text?: string;
}

export type ConnectionState = 
  | "idle"
  | "checking-permissions"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error"
  | "ended";

export type MicrophoneStatus = 
  | "unknown"
  | "granted"
  | "denied"
  | "prompt"
  | "not-found";

export function useVapiCall({
  assistantId,
  onTranscript,
  onSpeechStart,
  onSpeechEnd,
  onCallStart,
  onCallEnd,
  onError,
  onUserSpeechStart,
  onUserSpeechEnd,
  onConnectionStateChange,
}: UseVapiCallProps) {
  const { toast } = useToast();
  
  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>("unknown");
  const [vapiPublicKey, setVapiPublicKey] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [hasReceivedFirstResponse, setHasReceivedFirstResponse] = useState(false);
  
  // Refs
  const vapiRef = useRef<Vapi | null>(null);
  const isStartingRef = useRef(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectionStateRef = useRef<ConnectionState>("idle");
  const maxReconnectAttempts = 3;

  // Update connection state with callback
  const updateConnectionState = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    connectionStateRef.current = state;
    onConnectionStateChange?.(state);
    
    // Sync with legacy state variables
    setIsConnecting(state === "connecting" || state === "checking-permissions" || state === "reconnecting");
    setIsConnected(state === "connected");
  }, [onConnectionStateChange]);

  // Check microphone permissions before starting call
  const checkMicrophonePermissions = useCallback(async (): Promise<MicrophoneStatus> => {
    try {
      // First check if permission API is available
      if (navigator.permissions) {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'denied') {
          setMicrophoneStatus("denied");
          return "denied";
        }
        
        if (permissionStatus.state === 'granted') {
          setMicrophoneStatus("granted");
          return "granted";
        }
      }

      // Permission is 'prompt' or API not available - try to get access
      return "prompt";
    } catch (error) {
      console.warn('Permission API check failed:', error);
      return "prompt";
    }
  }, []);

  // Request microphone access with proper cleanup
  const requestMicrophoneAccess = useCallback(async (): Promise<MediaStream | null> => {
    updateConnectionState("checking-permissions");
    
    try {
      // Check current permission state
      const permStatus = await checkMicrophonePermissions();
      
      if (permStatus === "denied") {
        toast({
          title: "Microfono bloccato",
          description: "Il microfono è bloccato. Vai nelle impostazioni del browser per abilitarlo.",
          variant: "destructive",
        });
        updateConnectionState("error");
        return null;
      }

      // Request microphone access with optimal settings for voice
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      // Verify stream has active audio tracks
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        toast({
          title: "Microfono non trovato",
          description: "Nessun dispositivo audio rilevato. Collega un microfono e riprova.",
          variant: "destructive",
        });
        updateConnectionState("error");
        return null;
      }

      // Store stream reference for cleanup
      micStreamRef.current = stream;
      setMicrophoneStatus("granted");
      
      console.log('Microphone access granted:', audioTracks[0].label);
      return stream;
      
    } catch (error) {
      console.error('Microphone access error:', error);
      
      const err = error as Error;
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicrophoneStatus("denied");
        toast({
          title: "Permesso negato",
          description: "Abilita l'accesso al microfono nelle impostazioni del browser.",
          variant: "destructive",
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicrophoneStatus("not-found");
        toast({
          title: "Microfono non trovato",
          description: "Nessun microfono rilevato. Collega un dispositivo audio.",
          variant: "destructive",
        });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast({
          title: "Microfono occupato",
          description: "Il microfono è in uso da un'altra applicazione. Chiudi le altre app e riprova.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore microfono",
          description: "Impossibile accedere al microfono. Verifica i permessi.",
          variant: "destructive",
        });
      }
      
      updateConnectionState("error");
      return null;
    }
  }, [checkMicrophonePermissions, toast, updateConnectionState]);

  // Release microphone resources
  const releaseMicrophone = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Released microphone track:', track.label);
      });
      micStreamRef.current = null;
    }
  }, []);

  // Fetch Vapi public key
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

  // Clean up Vapi instance completely
  const cleanupVapi = useCallback(() => {
    console.log('Cleaning up Vapi instance...');
    
    if (vapiRef.current) {
      try {
        // Remove all event listeners first
        vapiRef.current.removeAllListeners?.();
        vapiRef.current.stop();
      } catch (e) {
        console.warn('Error stopping Vapi:', e);
      }
      vapiRef.current = null;
    }
    
    // Release microphone
    releaseMicrophone();
    
    // Reset all states
    isStartingRef.current = false;
    setIsSpeaking(false);
    setIsUserSpeaking(false);
    setHasReceivedFirstResponse(false);
    setCallStartTime(null);
    reconnectAttemptsRef.current = 0;
  }, [releaseMicrophone]);

  // Start the call with full initialization
  const startCall = useCallback(async () => {
    // Prevent duplicate calls
    if (isStartingRef.current || connectionState === "connected" || connectionState === "connecting") {
      console.log('Vapi call already in progress, skipping...');
      return;
    }

    if (!assistantId) {
      toast({
        title: "Errore configurazione",
        description: "Assistente non configurato per le chiamate.",
        variant: "destructive",
      });
      return;
    }

    try {
      isStartingRef.current = true;
      
      // Step 1: Check and request microphone permissions
      const micStream = await requestMicrophoneAccess();
      if (!micStream) {
        isStartingRef.current = false;
        return;
      }

      updateConnectionState("connecting");

      // Step 2: Get public key
      const publicKey = await fetchVapiPublicKey();
      if (!publicKey) {
        throw new Error('Chiave Vapi non configurata');
      }

      // Step 3: Initialize Vapi with the SDK
      console.log('Initializing Vapi with assistant:', assistantId);
      const vapi = new Vapi(publicKey);
      vapiRef.current = vapi;

      // Step 4: Set up event listeners BEFORE starting
      vapi.on('call-start', () => {
        console.log('Vapi call-start event received');
        updateConnectionState("connected");
        reconnectAttemptsRef.current = 0;
        // Don't trigger onCallStart yet - wait for first response
      });

      vapi.on('call-end', () => {
        console.log('Vapi call-end event received');
        updateConnectionState("ended");
        onCallEnd?.();
        cleanupVapi();
      });

      // Avatar/Assistant speaking events
      vapi.on('speech-start', () => {
        console.log('Vapi speech-start (assistant speaking)');
        setIsSpeaking(true);
        onSpeechStart?.();
        
        // Mark first response received - NOW start the timer
        if (!hasReceivedFirstResponse) {
          setHasReceivedFirstResponse(true);
          setCallStartTime(Date.now());
          onCallStart?.();
          toast({
            title: "Connesso!",
            description: "Stai parlando con Marco",
          });
        }
      });

      vapi.on('speech-end', () => {
        console.log('Vapi speech-end (assistant stopped)');
        setIsSpeaking(false);
        onSpeechEnd?.();
      });

      // User speaking events (for UI sync)
      vapi.on('volume-level', (level: number) => {
        // Detect user speaking based on volume
        const threshold = 0.1;
        const newIsUserSpeaking = level > threshold;
        
        if (newIsUserSpeaking !== isUserSpeaking) {
          setIsUserSpeaking(newIsUserSpeaking);
          if (newIsUserSpeaking) {
            onUserSpeechStart?.();
          } else {
            onUserSpeechEnd?.();
          }
        }
      });

      // Message/Transcript handling
      vapi.on('message', (message: VapiMessage) => {
        if (message.type === 'transcript' && message.role === 'assistant') {
          onTranscript?.(message.transcript || message.text || '', message.isFinal || false);
        }
      });

      // Error handling with reconnection logic
      vapi.on('error', (error: Error) => {
        console.error('Vapi error event:', error);
        
        // Attempt reconnection for certain errors - use ref for current state
        if (reconnectAttemptsRef.current < maxReconnectAttempts && connectionStateRef.current === "connected") {
          reconnectAttemptsRef.current++;
          updateConnectionState("reconnecting");
          
          toast({
            title: "Riconnessione in corso...",
            description: `Tentativo ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`,
          });
          
          // Attempt to restart after short delay
          setTimeout(() => {
            if (vapiRef.current) {
              vapiRef.current.start(assistantId).catch(console.error);
            }
          }, 1000);
          
          return;
        }
        
        updateConnectionState("error");
        onError?.(error);
        
        toast({
          title: "Errore chiamata",
          description: error.message || "Connessione persa. Riprova.",
          variant: "destructive",
        });
        
        cleanupVapi();
      });

      // Step 5: Start the call
      console.log('Starting Vapi call...');
      await vapi.start(assistantId);

    } catch (error) {
      console.error('Failed to start Vapi call:', error);
      updateConnectionState("error");
      
      const err = error as Error;
      toast({
        title: "Errore avvio chiamata",
        description: err.message || "Impossibile avviare la chiamata. Riprova.",
        variant: "destructive",
      });
      
      onError?.(err);
      cleanupVapi();
    }
  }, [
    assistantId,
    connectionState,
    hasReceivedFirstResponse,
    isUserSpeaking,
    requestMicrophoneAccess,
    fetchVapiPublicKey,
    updateConnectionState,
    cleanupVapi,
    onTranscript,
    onSpeechStart,
    onSpeechEnd,
    onCallStart,
    onCallEnd,
    onError,
    onUserSpeechStart,
    onUserSpeechEnd,
    toast,
  ]);

  // End call with complete cleanup
  const endCall = useCallback(() => {
    console.log('Ending Vapi call...');
    updateConnectionState("ended");
    cleanupVapi();
    
    toast({
      title: "Chiamata terminata",
      description: "La sessione è stata chiusa correttamente.",
    });
  }, [updateConnectionState, cleanupVapi, toast]);

  // Toggle mute
  const toggleMute = useCallback((muted: boolean) => {
    if (vapiRef.current) {
      vapiRef.current.setMuted(muted);
      console.log('Vapi mute toggled:', muted);
    }
  }, []);

  // Send a message to the assistant (for text input)
  const sendMessage = useCallback((message: string) => {
    if (vapiRef.current && connectionState === "connected") {
      vapiRef.current.send({
        type: 'add-message',
        message: {
          role: 'user',
          content: message,
        },
      });
    }
  }, [connectionState]);

  // Get call duration
  const getCallDuration = useCallback(() => {
    if (!callStartTime) return 0;
    return Math.floor((Date.now() - callStartTime) / 1000);
  }, [callStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('useVapiCall unmounting - cleaning up...');
      cleanupVapi();
    };
  }, [cleanupVapi]);

  // Monitor microphone status changes
  useEffect(() => {
    if (!navigator.permissions) return;

    let permissionStatus: PermissionStatus | null = null;

    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then(status => {
        permissionStatus = status;
        status.onchange = () => {
          if (status.state === 'denied' && connectionState === "connected") {
            toast({
              title: "Microfono disabilitato",
              description: "I permessi del microfono sono stati revocati.",
              variant: "destructive",
            });
            endCall();
          }
        };
      })
      .catch(() => {});

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [connectionState, endCall, toast]);

  return {
    // State
    connectionState,
    isConnecting,
    isConnected,
    isSpeaking,
    isUserSpeaking,
    microphoneStatus,
    hasReceivedFirstResponse,
    callStartTime,
    
    // Actions
    startCall,
    endCall,
    toggleMute,
    sendMessage,
    getCallDuration,
    checkMicrophonePermissions,
  };
}
