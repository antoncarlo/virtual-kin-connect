import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Room, RoomEvent, Track, RemoteTrack, RemoteTrackPublication, RemoteParticipant } from "livekit-client";

interface UseHeyGenStreamingProps {
  avatarId?: string;
  voiceId?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
}

interface SessionInfo {
  session_id: string;
  url: string;
  access_token: string;
}

export function useHeyGenStreaming({
  avatarId,
  voiceId,
  onConnected,
  onDisconnected,
  onSpeaking,
  onError,
}: UseHeyGenStreamingProps = {}) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const roomRef = useRef<Room | null>(null);
  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startSession = useCallback(async (videoElement?: HTMLVideoElement) => {
    try {
      setIsConnecting(true);

      // Create HeyGen streaming session
      const createResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'create-session',
          avatarId: avatarId || 'default',
          voiceId: voiceId,
        },
      });

      if (createResponse.error) {
        throw new Error(createResponse.error.message);
      }

      const sessionData = createResponse.data;
      if (!sessionData.data?.session_id) {
        throw new Error('Failed to create HeyGen session');
      }

      sessionInfoRef.current = {
        session_id: sessionData.data.session_id,
        url: sessionData.data.url,
        access_token: sessionData.data.access_token,
      };

      // Start the streaming session
      const startResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'start-session',
          sessionId: sessionInfoRef.current.session_id,
        },
      });

      if (startResponse.error) {
        throw new Error(startResponse.error.message);
      }

      // Create LiveKit room and connect
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720, frameRate: 30 },
        },
      });

      roomRef.current = room;
      mediaStreamRef.current = new MediaStream();

      // Handle track subscriptions
      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('Track subscribed:', track.kind);
        
        if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
          const mediaTrack = track.mediaStreamTrack;
          if (mediaTrack && mediaStreamRef.current) {
            mediaStreamRef.current.addTrack(mediaTrack);
            setMediaStream(new MediaStream(mediaStreamRef.current.getTracks()));
            
            if (videoElement && track.kind === Track.Kind.Video) {
              videoElement.srcObject = mediaStreamRef.current;
              videoElement.play().catch(console.error);
            }
          }
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        console.log('Track unsubscribed:', track.kind);
        if (track.mediaStreamTrack && mediaStreamRef.current) {
          mediaStreamRef.current.removeTrack(track.mediaStreamTrack);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('Room disconnected');
        setIsConnected(false);
        onDisconnected?.();
      });

      // Connect to LiveKit room
      await room.connect(sessionInfoRef.current.url, sessionInfoRef.current.access_token);
      
      setIsConnected(true);
      setIsConnecting(false);
      onConnected?.();

      toast({
        title: "Avatar connesso",
        description: "Streaming avatar HeyGen attivo",
      });

    } catch (error) {
      console.error('HeyGen streaming error:', error);
      setIsConnecting(false);
      setIsConnected(false);
      
      const err = error as Error;
      onError?.(err);
      
      toast({
        title: "Errore connessione",
        description: err.message || "Impossibile avviare lo streaming avatar",
        variant: "destructive",
      });
    }
  }, [avatarId, voiceId, onConnected, onDisconnected, onError, toast]);

  const sendText = useCallback(async (text: string) => {
    if (!sessionInfoRef.current) {
      console.error('No active session');
      return;
    }

    try {
      setIsSpeaking(true);
      onSpeaking?.(true);

      const response = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'send-task',
          sessionId: sessionInfoRef.current.session_id,
          text: text,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Avatar will speak for approximately text.length * 50ms
      const speakDuration = Math.max(text.length * 50, 2000);
      setTimeout(() => {
        setIsSpeaking(false);
        onSpeaking?.(false);
      }, speakDuration);

    } catch (error) {
      console.error('Send text error:', error);
      setIsSpeaking(false);
      onSpeaking?.(false);
    }
  }, [onSpeaking]);

  const stopSession = useCallback(async () => {
    try {
      if (sessionInfoRef.current) {
        await supabase.functions.invoke('heygen-streaming', {
          body: {
            action: 'stop-session',
            sessionId: sessionInfoRef.current.session_id,
          },
        });
      }

      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      sessionInfoRef.current = null;
      setIsConnected(false);
      setIsSpeaking(false);
      setMediaStream(null);
      onDisconnected?.();

    } catch (error) {
      console.error('Stop session error:', error);
    }
  }, [onDisconnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    isConnecting,
    isConnected,
    isSpeaking,
    mediaStream,
    startSession,
    sendText,
    stopSession,
  };
}
