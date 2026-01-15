import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";

interface UseDailyCallProps {
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onError?: (error: Error) => void;
}

interface DailyRoom {
  name: string;
  url: string;
  token: string;
}

export function useDailyCall({
  onParticipantJoined,
  onParticipantLeft,
  onCallStart,
  onCallEnd,
  onError,
}: UseDailyCallProps = {}) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<DailyRoom | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<any[]>([]);
  const callFrameRef = useRef<DailyCall | null>(null);

  const createRoom = useCallback(async (): Promise<DailyRoom> => {
    const response = await supabase.functions.invoke('daily-room', {
      body: {
        action: 'create-room',
        expiryMinutes: 60,
      },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Failed to create room');
    }

    return response.data.room;
  }, []);

  const startVideoCall = useCallback(async (container: HTMLDivElement) => {
    try {
      setIsConnecting(true);

      // Request camera and microphone permissions
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      // Create a Daily room
      const roomData = await createRoom();
      setRoom(roomData);

      // Create the call frame using npm package
      const callFrame = DailyIframe.createFrame(container, {
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '12px',
        },
        showLeaveButton: true,
        showFullscreenButton: true,
      });

      callFrameRef.current = callFrame;

      // Set up event listeners
      callFrame.on('joined-meeting', () => {
        setIsConnected(true);
        setIsConnecting(false);
        onCallStart?.();
        toast({
          title: "Videochiamata iniziata",
          description: "Sei connesso alla videochiamata!",
        });
      });

      callFrame.on('left-meeting', () => {
        setIsConnected(false);
        setRoom(null);
        onCallEnd?.();
        toast({
          title: "Videochiamata terminata",
          description: "Hai lasciato la videochiamata.",
        });
      });

      callFrame.on('participant-joined', (event) => {
        if (event?.participant) {
          setRemoteParticipants(prev => [...prev, event.participant]);
          onParticipantJoined?.(event.participant);
        }
      });

      callFrame.on('participant-left', (event) => {
        if (event?.participant) {
          setRemoteParticipants(prev => 
            prev.filter(p => p.session_id !== event.participant.session_id)
          );
          onParticipantLeft?.(event.participant);
        }
      });

      callFrame.on('error', (event) => {
        console.error('Daily error:', event);
        setIsConnecting(false);
        setIsConnected(false);
        const errorMsg = event?.errorMsg || 'Video call error';
        onError?.(new Error(errorMsg));
        toast({
          title: "Errore videochiamata",
          description: errorMsg,
          variant: "destructive",
        });
      });

      callFrame.on('track-started', (event) => {
        if (event?.participant?.local && event?.track?.kind === 'video') {
          setLocalVideoTrack(event.track);
        }
      });

      // Join the room
      await callFrame.join({
        url: roomData.url,
        token: roomData.token,
      });

    } catch (error) {
      console.error('Failed to start Daily video call:', error);
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
  }, [createRoom, onParticipantJoined, onParticipantLeft, onCallStart, onCallEnd, onError, toast]);

  const endVideoCall = useCallback(async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave();
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    
    // Clean up the room on the server
    if (room) {
      try {
        await supabase.functions.invoke('daily-room', {
          body: {
            action: 'delete-room',
            roomName: room.name,
          },
        });
      } catch (error) {
        console.error('Failed to delete room:', error);
      }
    }
    
    setIsConnected(false);
    setRoom(null);
    setLocalVideoTrack(null);
    setRemoteParticipants([]);
  }, [room]);

  const toggleCamera = useCallback((enabled: boolean) => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalVideo(enabled);
    }
  }, []);

  const toggleMicrophone = useCallback((enabled: boolean) => {
    if (callFrameRef.current) {
      callFrameRef.current.setLocalAudio(enabled);
    }
  }, []);

  const getRoomUrl = useCallback(() => {
    return room?.url || null;
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, []);

  return {
    isConnecting,
    isConnected,
    room,
    localVideoTrack,
    remoteParticipants,
    startVideoCall,
    endVideoCall,
    toggleCamera,
    toggleMicrophone,
    getRoomUrl,
  };
}
