import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import {
  Room,
  RoomEvent,
  ConnectionState,
  Track,
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  LocalParticipant,
  RemoteParticipant,
} from "livekit-client";

export type LiveKitConnectionState =
  | "idle"
  | "checking-permissions"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export type MicrophoneStatus =
  | "unknown"
  | "granted"
  | "denied"
  | "prompt"
  | "not-found";

interface UseLiveKitCallProps {
  avatarId?: string;
  avatarName?: string;
  roomName?: string;
  // Callbacks
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onTrackSubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
  onTrackUnsubscribed?: (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => void;
  onConnectionStateChange?: (state: LiveKitConnectionState) => void;
  onParticipantConnected?: (participant: RemoteParticipant) => void;
  onParticipantDisconnected?: (participant: RemoteParticipant) => void;
  onActiveSpeakerChange?: (speakers: Participant[]) => void;
}

export function useLiveKitCall({
  avatarId,
  avatarName = "Agent",
  roomName: customRoomName,
  onConnected,
  onDisconnected,
  onError,
  onTrackSubscribed,
  onTrackUnsubscribed,
  onConnectionStateChange,
  onParticipantConnected,
  onParticipantDisconnected,
  onActiveSpeakerChange,
}: UseLiveKitCallProps) {
  const { toast } = useToast();

  // Connection state
  const [connectionState, setConnectionState] = useState<LiveKitConnectionState>("idle");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>("unknown");
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [audioTrack, setAudioTrack] = useState<RemoteTrack | null>(null);
  const [videoTrack, setVideoTrack] = useState<RemoteTrack | null>(null);

  // Refs
  const roomRef = useRef<Room | null>(null);
  const isStartingRef = useRef(false);

  // Update connection state with callback
  const updateConnectionState = useCallback((state: LiveKitConnectionState) => {
    setConnectionState(state);
    onConnectionStateChange?.(state);

    setIsConnecting(state === "connecting" || state === "checking-permissions" || state === "reconnecting");
    setIsConnected(state === "connected");
  }, [onConnectionStateChange]);

  // Check microphone permissions
  const checkMicrophonePermissions = useCallback(async (): Promise<MicrophoneStatus> => {
    try {
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
      return "prompt";
    } catch (error) {
      console.warn('Permission API check failed:', error);
      return "prompt";
    }
  }, []);

  // Request microphone access
  const requestMicrophoneAccess = useCallback(async (): Promise<boolean> => {
    updateConnectionState("checking-permissions");

    try {
      const permStatus = await checkMicrophonePermissions();

      if (permStatus === "denied") {
        toast({
          title: "Microfono bloccato",
          description: "Il microfono è bloccato. Vai nelle impostazioni del browser per abilitarlo.",
          variant: "destructive",
        });
        updateConnectionState("error");
        return false;
      }

      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Release the stream immediately - LiveKit will handle audio
      stream.getTracks().forEach(track => track.stop());
      setMicrophoneStatus("granted");
      return true;

    } catch (error) {
      console.error('Microphone access error:', error);
      const err = error as Error;

      if (err.name === 'NotAllowedError') {
        setMicrophoneStatus("denied");
        toast({
          title: "Permesso negato",
          description: "Abilita l'accesso al microfono nelle impostazioni del browser.",
          variant: "destructive",
        });
      } else if (err.name === 'NotFoundError') {
        setMicrophoneStatus("not-found");
        toast({
          title: "Microfono non trovato",
          description: "Nessun microfono rilevato. Collega un dispositivo audio.",
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
      return false;
    }
  }, [checkMicrophonePermissions, toast, updateConnectionState]);

  // Fetch LiveKit token from backend
  const fetchToken = useCallback(async (): Promise<{ token: string; serverUrl: string; roomName: string } | null> => {
    try {
      const response = await supabase.functions.invoke('livekit-token', {
        body: {
          roomName: customRoomName,
          avatarId,
          participantName: "User",
          metadata: { avatarName },
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const { token, serverUrl, roomName } = response.data;
      
      if (!token || !serverUrl) {
        throw new Error("Invalid token response");
      }

      return { token, serverUrl, roomName };
    } catch (error) {
      console.error('Failed to fetch LiveKit token:', error);
      throw error;
    }
  }, [avatarId, avatarName, customRoomName]);

  // Clean up room
  const cleanupRoom = useCallback(async () => {
    console.log('[LiveKit] Cleaning up room...');
    
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect(true);
      } catch (e) {
        console.warn('Error disconnecting room:', e);
      }
      roomRef.current = null;
    }

    isStartingRef.current = false;
    setAudioTrack(null);
    setVideoTrack(null);
    setRemoteParticipants([]);
    setActiveSpeakers([]);
    setCallStartTime(null);
  }, []);

  // Start the call
  const startCall = useCallback(async (enableVideo = true) => {
    if (isStartingRef.current || connectionState === "connected" || connectionState === "connecting") {
      console.log('[LiveKit] Call already in progress, skipping...');
      return;
    }

    try {
      isStartingRef.current = true;

      // Check microphone permissions first
      const hasPermission = await requestMicrophoneAccess();
      if (!hasPermission) {
        isStartingRef.current = false;
        return;
      }

      updateConnectionState("connecting");

      // Fetch token from backend
      const tokenData = await fetchToken();
      if (!tokenData) {
        throw new Error("Failed to get LiveKit token");
      }

      console.log('[LiveKit] Connecting to room:', tokenData.roomName);

      // Create and configure room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480 },
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      roomRef.current = room;

      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('[LiveKit] Room connected');
        updateConnectionState("connected");
        setCallStartTime(Date.now());
        onConnected?.();
        
        toast({
          title: "Connesso!",
          description: `Stai parlando con ${avatarName}`,
        });
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('[LiveKit] Room disconnected');
        updateConnectionState("disconnected");
        onDisconnected?.();
        cleanupRoom();
      });

      room.on(RoomEvent.Reconnecting, () => {
        console.log('[LiveKit] Reconnecting...');
        updateConnectionState("reconnecting");
        toast({
          title: "Riconnessione in corso...",
          description: "Tentativo di riconnettersi alla stanza.",
        });
      });

      room.on(RoomEvent.Reconnected, () => {
        console.log('[LiveKit] Reconnected');
        updateConnectionState("connected");
        toast({
          title: "Riconnesso!",
          description: "La connessione è stata ripristinata.",
        });
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] Participant connected:', participant.identity);
        setRemoteParticipants(prev => [...prev, participant]);
        onParticipantConnected?.(participant);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] Participant disconnected:', participant.identity);
        setRemoteParticipants(prev => prev.filter(p => p.identity !== participant.identity));
        onParticipantDisconnected?.(participant);
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('[LiveKit] Track subscribed:', track.kind, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          setAudioTrack(track);
        } else if (track.kind === Track.Kind.Video) {
          setVideoTrack(track);
        }
        
        onTrackSubscribed?.(track, publication, participant);
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('[LiveKit] Track unsubscribed:', track.kind);
        
        if (track.kind === Track.Kind.Audio) {
          setAudioTrack(null);
        } else if (track.kind === Track.Kind.Video) {
          setVideoTrack(null);
        }
        
        onTrackUnsubscribed?.(track, publication, participant);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        setActiveSpeakers(speakers);
        onActiveSpeakerChange?.(speakers);
      });

      room.on(RoomEvent.MediaDevicesError, (error: Error) => {
        console.error('[LiveKit] Media devices error:', error);
        toast({
          title: "Errore dispositivo",
          description: error.message,
          variant: "destructive",
        });
      });

      // Connect to the room
      await room.connect(tokenData.serverUrl, tokenData.token);

      // Enable local tracks after connection
      await room.localParticipant.enableCameraAndMicrophone();

      // If video not enabled, disable camera
      if (!enableVideo) {
        await room.localParticipant.setCameraEnabled(false);
        setIsCameraOn(false);
      }

    } catch (error) {
      console.error('[LiveKit] Failed to start call:', error);
      updateConnectionState("error");

      const err = error as Error;
      toast({
        title: "Errore connessione",
        description: err.message || "Impossibile avviare la chiamata. Riprova.",
        variant: "destructive",
      });

      onError?.(err);
      cleanupRoom();
    } finally {
      isStartingRef.current = false;
    }
  }, [
    connectionState,
    avatarName,
    requestMicrophoneAccess,
    fetchToken,
    updateConnectionState,
    cleanupRoom,
    toast,
    onConnected,
    onDisconnected,
    onError,
    onParticipantConnected,
    onParticipantDisconnected,
    onTrackSubscribed,
    onTrackUnsubscribed,
    onActiveSpeakerChange,
  ]);

  // End call
  const endCall = useCallback(async () => {
    console.log('[LiveKit] Ending call...');
    updateConnectionState("disconnected");
    await cleanupRoom();

    toast({
      title: "Chiamata terminata",
      description: "La sessione è stata chiusa correttamente.",
    });
  }, [updateConnectionState, cleanupRoom, toast]);

  // Toggle mute
  const toggleMute = useCallback(async (muted?: boolean) => {
    if (!roomRef.current) return;
    
    const newMuteState = muted !== undefined ? muted : !isMuted;
    
    try {
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuteState);
      setIsMuted(newMuteState);
      console.log('[LiveKit] Microphone:', newMuteState ? 'muted' : 'unmuted');
    } catch (error) {
      console.error('[LiveKit] Failed to toggle microphone:', error);
    }
  }, [isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(async (enabled?: boolean) => {
    if (!roomRef.current) return;
    
    const newCameraState = enabled !== undefined ? enabled : !isCameraOn;
    
    try {
      await roomRef.current.localParticipant.setCameraEnabled(newCameraState);
      setIsCameraOn(newCameraState);
      console.log('[LiveKit] Camera:', newCameraState ? 'on' : 'off');
    } catch (error) {
      console.error('[LiveKit] Failed to toggle camera:', error);
    }
  }, [isCameraOn]);

  // Send data message
  const sendData = useCallback(async (data: string | Uint8Array, reliable = true) => {
    if (!roomRef.current || connectionState !== "connected") return;
    
    try {
      const payload = typeof data === "string" ? new TextEncoder().encode(data) : data;
      await roomRef.current.localParticipant.publishData(payload, { reliable });
    } catch (error) {
      console.error('[LiveKit] Failed to send data:', error);
    }
  }, [connectionState]);

  // Get call duration
  const getCallDuration = useCallback(() => {
    if (!callStartTime) return 0;
    return Math.floor((Date.now() - callStartTime) / 1000);
  }, [callStartTime]);

  // Get local participant
  const getLocalParticipant = useCallback((): LocalParticipant | null => {
    return roomRef.current?.localParticipant || null;
  }, []);

  // Check if agent is speaking
  const isAgentSpeaking = activeSpeakers.some(
    speaker => speaker instanceof RemoteParticipant
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[LiveKit] Hook unmounting - cleaning up...');
      cleanupRoom();
    };
  }, [cleanupRoom]);

  return {
    // State
    connectionState,
    isConnecting,
    isConnected,
    isMuted,
    isCameraOn,
    microphoneStatus,
    callStartTime,
    activeSpeakers,
    remoteParticipants,
    audioTrack,
    videoTrack,
    isAgentSpeaking,
    room: roomRef.current,

    // Actions
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    sendData,
    getCallDuration,
    getLocalParticipant,
    checkMicrophonePermissions,
  };
}
