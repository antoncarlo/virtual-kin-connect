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
  onProcessing?: (isProcessing: boolean) => void;
}

interface SessionInfo {
  session_id: string;
  url: string;
  access_token: string;
}

// Text buffer for optimized lip-sync with streaming prefetch
interface TextBuffer {
  text: string;
  timestamp: number;
  emotion?: string;
  priority?: "high" | "normal" | "low";
}

// Streaming chunk for parallel processing
interface StreamingChunk {
  id: string;
  text: string;
  sentAt: number;
  completed: boolean;
}

export function useHeyGenStreaming({
  avatarId,
  voiceId,
  onConnected,
  onDisconnected,
  onSpeaking,
  onError,
  onProcessing,
}: UseHeyGenStreamingProps = {}) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const roomRef = useRef<Room | null>(null);
  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const textQueueRef = useRef<TextBuffer[]>([]);
  const processingRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingChunksRef = useRef<Map<string, StreamingChunk>>(new Map());
  const chunkIdRef = useRef(0);

  // Streaming prefetch - sends text chunks in parallel
  const sendStreamingChunk = useCallback(async (text: string, emotion?: string) => {
    if (!sessionInfoRef.current || !text.trim()) return;

    const chunkId = `chunk_${++chunkIdRef.current}`;
    const chunk: StreamingChunk = {
      id: chunkId,
      text: text.trim(),
      sentAt: Date.now(),
      completed: false,
    };

    streamingChunksRef.current.set(chunkId, chunk);

    try {
      // Send immediately without waiting (parallel prefetch)
      supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'send-task',
          sessionId: sessionInfoRef.current.session_id,
          text: chunk.text,
          emotion,
        },
      }).then(response => {
        if (response.error) {
          console.error(`Chunk ${chunkId} failed:`, response.error);
        }
        chunk.completed = true;
      }).catch(error => {
        console.error(`Chunk ${chunkId} error:`, error);
        chunk.completed = true;
      });

      return chunkId;
    } catch (error) {
      console.error('Streaming chunk error:', error);
      return null;
    }
  }, []);

  // Optimized text queue processor with prefetching
  const processTextQueue = useCallback(async () => {
    if (processingRef.current || textQueueRef.current.length === 0 || !sessionInfoRef.current) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    onProcessing?.(true);

    // Sort by priority and timestamp
    textQueueRef.current.sort((a, b) => {
      if (a.priority === "high" && b.priority !== "high") return -1;
      if (b.priority === "high" && a.priority !== "high") return 1;
      return a.timestamp - b.timestamp;
    });

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

      // Estimate speech duration based on text length
      // Optimized calculation: ~15 chars/second for Italian
      const estimatedDuration = Math.max(item.text.length * 65, 1200);
      
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }

      speakingTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        onSpeaking?.(false);
        processingRef.current = false;
        setIsProcessing(false);
        onProcessing?.(false);
        
        // Process next item immediately for minimal latency
        if (textQueueRef.current.length > 0) {
          requestAnimationFrame(() => processTextQueue());
        }
      }, estimatedDuration);

    } catch (error) {
      console.error('Send text error:', error);
      setIsSpeaking(false);
      onSpeaking?.(false);
      processingRef.current = false;
      setIsProcessing(false);
      onProcessing?.(false);
      
      if (textQueueRef.current.length > 0) {
        requestAnimationFrame(() => processTextQueue());
      }
    }
  }, [onSpeaking, onProcessing]);

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

  // Optimized text sending with streaming prefetch for minimal latency
  const sendText = useCallback(async (text: string, emotion?: string, options?: { priority?: "high" | "normal" | "low"; useStreaming?: boolean }) => {
    if (!sessionInfoRef.current || !text.trim()) {
      console.error('No active session or empty text');
      return;
    }

    const { priority = "normal", useStreaming = false } = options || {};

    // For high-priority or streaming mode, use parallel prefetch
    if (useStreaming || priority === "high") {
      return sendStreamingChunk(text, emotion);
    }

    // Add to queue with priority
    textQueueRef.current.push({
      text: text.trim(),
      timestamp: Date.now(),
      emotion,
      priority,
    });

    // Start processing if not already
    processTextQueue();
  }, [processTextQueue, sendStreamingChunk]);

  // Send text in streaming chunks (for parallel prefetching with Vapi)
  const sendTextStream = useCallback(async (chunks: string[], emotion?: string) => {
    if (!sessionInfoRef.current) return;

    setIsProcessing(true);
    onProcessing?.(true);
    setIsSpeaking(true);
    onSpeaking?.(true);

    // Send all chunks in parallel
    const promises = chunks.map(chunk => sendStreamingChunk(chunk, emotion));
    await Promise.allSettled(promises);

    // Estimate total duration
    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const estimatedDuration = Math.max(totalLength * 60, 1000);

    setTimeout(() => {
      setIsSpeaking(false);
      onSpeaking?.(false);
      setIsProcessing(false);
      onProcessing?.(false);
    }, estimatedDuration);
  }, [sendStreamingChunk, onProcessing, onSpeaking]);

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
    isProcessing,
    mediaStream,
    startSession,
    sendText,
    sendTextStream,
    sendGesture,
    setEmotion,
    interrupt,
    stopSession,
  };
}
