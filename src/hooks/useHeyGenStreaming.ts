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

// Text buffer for optimized lip-sync
interface TextBuffer {
  text: string;
  timestamp: number;
  emotion?: string;
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
  const isStartingRef = useRef(false);
  const textQueueRef = useRef<TextBuffer[]>([]);
  const processingRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process text queue with minimal latency
  const processTextQueue = useCallback(async () => {
    if (processingRef.current || textQueueRef.current.length === 0 || !sessionInfoRef.current) {
      return;
    }

    processingRef.current = true;
    const item = textQueueRef.current.shift()!;

    try {
      setIsSpeaking(true);
      onSpeaking?.(true);

      const response = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'send-task',
          sessionId: sessionInfoRef.current.session_id,
          text: item.text,
          emotion: item.emotion,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      // Estimate speech duration based on text length and speaking rate
      // Average speaking rate: ~150 words/min = ~2.5 words/sec = ~13 chars/sec
      const estimatedDuration = Math.max(item.text.length * 75, 1500);
      
      // Clear previous timeout
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }

      speakingTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        onSpeaking?.(false);
        processingRef.current = false;
        
        // Process next item if available
        if (textQueueRef.current.length > 0) {
          processTextQueue();
        }
      }, estimatedDuration);

    } catch (error) {
      console.error('Send text error:', error);
      setIsSpeaking(false);
      onSpeaking?.(false);
      processingRef.current = false;
      
      // Try next item
      if (textQueueRef.current.length > 0) {
        processTextQueue();
      }
    }
  }, [onSpeaking]);

  const startSession = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isStartingRef.current || isConnected || sessionInfoRef.current) {
      console.log('HeyGen session already in progress or connected, skipping...');
      return;
    }

    isStartingRef.current = true;
    console.log('Starting HeyGen session with avatarId:', avatarId);

    try {
      setIsConnecting(true);

      // Create HeyGen streaming session
      console.log('Calling heygen-streaming edge function...');
      const createResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'create-session',
          avatarId: avatarId || 'josh_lite3_20230714',
          voiceId: voiceId || 'it-IT-DiegoNeural',
        },
      });

      console.log('HeyGen create response:', createResponse);

      if (createResponse.error) {
        throw new Error(createResponse.error.message);
      }

      const sessionData = createResponse.data;
      console.log('Session data:', sessionData);
      
      if (sessionData.error) {
        throw new Error(sessionData.error);
      }
      
      if (!sessionData.data?.session_id) {
        throw new Error('Failed to create HeyGen session - no session_id returned');
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
        description: "Streaming avatar HeyGen attivo in HD",
      });

    } catch (error) {
      console.error('HeyGen streaming error:', error);
      setIsConnecting(false);
      setIsConnected(false);
      isStartingRef.current = false;
      
      const err = error as Error;
      onError?.(err);
      
      toast({
        title: "Errore connessione HeyGen",
        description: err.message || "Impossibile avviare lo streaming avatar",
        variant: "destructive",
      });
    }
  }, [avatarId, voiceId, isConnected, onConnected, onDisconnected, onError, toast]);

  // Optimized text sending with queue for minimal latency
  const sendText = useCallback(async (text: string, emotion?: string) => {
    if (!sessionInfoRef.current || !text.trim()) {
      console.error('No active session or empty text');
      return;
    }

    // Add to queue
    textQueueRef.current.push({
      text: text.trim(),
      timestamp: Date.now(),
      emotion,
    });

    // Start processing if not already
    processTextQueue();
  }, [processTextQueue]);

  // Send gesture (wave, nod, etc.)
  const sendGesture = useCallback(async (gesture: "wave" | "nod" | "smile") => {
    if (!sessionInfoRef.current) return;

    try {
      await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'send-gesture',
          sessionId: sessionInfoRef.current.session_id,
          gesture,
        },
      });
    } catch (error) {
      console.error('Gesture error:', error);
    }
  }, []);

  // Set emotional state
  const setEmotion = useCallback(async (emotion: "neutral" | "happy" | "sad" | "surprised" | "serious") => {
    if (!sessionInfoRef.current) return;

    try {
      await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'set-emotion',
          sessionId: sessionInfoRef.current.session_id,
          emotion,
        },
      });
    } catch (error) {
      console.error('Emotion error:', error);
    }
  }, []);

  // Interrupt current speech
  const interrupt = useCallback(async () => {
    if (!sessionInfoRef.current) return;

    try {
      // Clear queue
      textQueueRef.current = [];
      processingRef.current = false;
      
      await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'interrupt',
          sessionId: sessionInfoRef.current.session_id,
        },
      });
      
      setIsSpeaking(false);
      onSpeaking?.(false);
    } catch (error) {
      console.error('Interrupt error:', error);
    }
  }, [onSpeaking]);

  const stopSession = useCallback(async () => {
    console.log('Stopping HeyGen session...');
    isStartingRef.current = false;
    textQueueRef.current = [];
    processingRef.current = false;
    
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
    }
    
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
    sendGesture,
    setEmotion,
    interrupt,
    stopSession,
  };
}
