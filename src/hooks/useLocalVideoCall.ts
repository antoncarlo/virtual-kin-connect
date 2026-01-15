import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseLocalVideoCallProps {
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useLocalVideoCall({
  onCallStart,
  onCallEnd,
  onError,
}: UseLocalVideoCallProps = {}) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVideoCall = useCallback(async (videoElement: HTMLVideoElement) => {
    if (streamRef.current || isConnecting) {
      console.log('Local call already in progress, skipping...');
      return;
    }

    try {
      setIsConnecting(true);
      videoRef.current = videoElement;

      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play();

      setIsConnected(true);
      setIsConnecting(false);
      onCallStart?.();
      
      toast({
        title: "Videochiamata test iniziata",
        description: "Modalità locale attiva - nessun server coinvolto",
      });

    } catch (error) {
      console.error('Failed to start local video call:', error);
      setIsConnecting(false);
      
      if ((error as Error).name === 'NotAllowedError') {
        toast({
          title: "Permesso negato",
          description: "Abilita l'accesso a camera e microfono per le videochiamate.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Errore",
          description: "Impossibile avviare la videochiamata. Riprova.",
          variant: "destructive",
        });
      }
      
      onError?.(error as Error);
    }
  }, [isConnecting, onCallStart, onError, toast]);

  const endVideoCall = useCallback(async () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    
    setIsConnected(false);
    setIsCameraEnabled(true);
    setIsMicEnabled(true);
    onCallEnd?.();
    
    toast({
      title: "Videochiamata terminata",
      description: "Hai lasciato la videochiamata test.",
    });
  }, [onCallEnd, toast]);

  const toggleCamera = useCallback((enabled: boolean) => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        setIsCameraEnabled(enabled);
      }
    }
  }, []);

  const toggleMicrophone = useCallback((enabled: boolean) => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        setIsMicEnabled(enabled);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    isCameraEnabled,
    isMicEnabled,
    startVideoCall,
    endVideoCall,
    toggleCamera,
    toggleMicrophone,
  };
}
