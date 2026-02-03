// LiveKit Voice/Video Call Hook - Pure WebRTC implementation
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import {
  Room,
  RoomEvent,
  Track,
  Participant,
  RemoteTrack,
  RemoteTrackPublication,
  LocalParticipant,
  RemoteParticipant,
  LocalTrack,
  LocalVideoTrack,
  LocalAudioTrack,
  createLocalVideoTrack,
  createLocalAudioTrack,
  VideoPresets,
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
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>("unknown");
  const [callStartTime, setCallStartTime] = useState<number | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<Participant[]>([]);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  
  // Tracks
  const [remoteAudioTrack, setRemoteAudioTrack] = useState<RemoteTrack | null>(null);
  const [remoteVideoTrack, setRemoteVideoTrack] = useState<RemoteTrack | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<LocalVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<LocalAudioTrack | null>(null);

  // Refs
  const roomRef = useRef<Room | null>(null);
  const isStartingRef = useRef(false);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
  const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);

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

  // Request media permissions without acquiring stream (LiveKit will handle that)
  const requestMediaPermissions = useCallback(async (enableVideo: boolean): Promise<boolean> => {
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

      // Just verify we can get permissions - don't keep the stream
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };
      
      if (enableVideo) {
        constraints.video = {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      // Release immediately - LiveKit will create its own tracks
      stream.getTracks().forEach(track => track.stop());
      
      setMicrophoneStatus("granted");
      return true;

    } catch (error) {
      console.error('Media permission error:', error);
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
          title: "Errore dispositivo",
          description: "Impossibile accedere ai dispositivi media. Verifica i permessi.",
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

  // Create and publish local tracks
  const publishLocalTracks = useCallback(async (room: Room, enableVideo: boolean) => {
    console.log('[LiveKit] Creating and publishing local tracks...');
    
    try {
      // Create audio track
      const audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
      
      localAudioTrackRef.current = audioTrack;
      setLocalAudioTrack(audioTrack);
      
      // Publish audio track
      await room.localParticipant.publishTrack(audioTrack);
      console.log('[LiveKit] Audio track published');

      // Create and publish video track if enabled
      if (enableVideo) {
        const videoTrack = await createLocalVideoTrack({
          facingMode: "user",
          resolution: VideoPresets.h540.resolution,
        });
        
        localVideoTrackRef.current = videoTrack;
        setLocalVideoTrack(videoTrack);
        setIsCameraOn(true);
        
        await room.localParticipant.publishTrack(videoTrack);
        console.log('[LiveKit] Video track published');
      }
      
    } catch (error) {
      console.error('[LiveKit] Failed to publish local tracks:', error);
      throw error;
    }
  }, []);

  // Clean up local tracks
  const cleanupLocalTracks = useCallback(() => {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current = null;
      setLocalVideoTrack(null);
    }
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current = null;
      setLocalAudioTrack(null);
    }
    setIsCameraOn(false);
    setIsMuted(false);
  }, []);

  // Clean up room
  const cleanupRoom = useCallback(async () => {
    console.log('[LiveKit] Cleaning up room...');
    
    cleanupLocalTracks();
    
    if (roomRef.current) {
      try {
        await roomRef.current.disconnect(true);
      } catch (e) {
        console.warn('Error disconnecting room:', e);
      }
      roomRef.current = null;
    }

    isStartingRef.current = false;
    setRemoteAudioTrack(null);
    setRemoteVideoTrack(null);
    setRemoteParticipants([]);
    setActiveSpeakers([]);
    setCallStartTime(null);
  }, [cleanupLocalTracks]);

  // Start the call
  const startCall = useCallback(async (enableVideo = true) => {
    if (isStartingRef.current || connectionState === "connected" || connectionState === "connecting") {
      console.log('[LiveKit] Call already in progress, skipping...');
      return;
    }

    try {
      isStartingRef.current = true;

      // Check media permissions first
      const hasPermission = await requestMediaPermissions(enableVideo);
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
          resolution: VideoPresets.h540.resolution,
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
        console.log('[LiveKit] 👤 Participant connected:', participant.identity);
        console.log('[LiveKit] 📋 Participant tracks:', Array.from(participant.trackPublications.values()).map(p => ({
          trackSid: p.trackSid,
          kind: p.kind,
          source: p.source,
          isSubscribed: p.isSubscribed,
        })));
        setRemoteParticipants(prev => [...prev, participant]);
        onParticipantConnected?.(participant);
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('[LiveKit] 👤 Participant disconnected:', participant.identity);
        setRemoteParticipants(prev => prev.filter(p => p.identity !== participant.identity));
        onParticipantDisconnected?.(participant);
      });

      // Track published (before subscription)
      room.on(RoomEvent.TrackPublished, (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('[LiveKit] 📢 Track PUBLISHED:', {
          trackSid: publication.trackSid,
          trackName: publication.trackName,
          kind: publication.kind,
          source: publication.source,
          participant: participant.identity,
          isSubscribed: publication.isSubscribed,
        });
      });

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('[LiveKit] ✅ Track SUBSCRIBED:', {
          kind: track.kind,
          trackSid: track.sid,
          source: publication.source,
          participant: participant.identity,
          mediaStreamTrack: track.mediaStreamTrack?.id,
        });
        
        if (track.kind === Track.Kind.Audio) {
          console.log('[LiveKit] 🔊 Setting remote AUDIO track');
          setRemoteAudioTrack(track);
        } else if (track.kind === Track.Kind.Video) {
          console.log('[LiveKit] 📹 Setting remote VIDEO track');
          setRemoteVideoTrack(track);
        }
        
        onTrackSubscribed?.(track, publication, participant);
      });

      room.on(RoomEvent.TrackSubscriptionFailed, (trackSid: string, participant: RemoteParticipant, reason?: unknown) => {
        console.error('[LiveKit] ❌ Track subscription FAILED:', {
          trackSid,
          participant: participant.identity,
          reason: String(reason),
        });
      });

      room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        console.log('[LiveKit] 🚫 Track unsubscribed:', track.kind, 'from', participant.identity);
        
        if (track.kind === Track.Kind.Audio) {
          setRemoteAudioTrack(null);
        } else if (track.kind === Track.Kind.Video) {
          setRemoteVideoTrack(null);
        }
        
        onTrackUnsubscribed?.(track, publication, participant);
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        setActiveSpeakers(speakers);
        onActiveSpeakerChange?.(speakers);
      });

      room.on(RoomEvent.TrackMuted, (publication, participant) => {
        console.log('[LiveKit] 🔇 Track muted:', publication.kind, 'from', participant.identity);
      });

      room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
        console.log('[LiveKit] 🔈 Track unmuted:', publication.kind, 'from', participant.identity);
      });

      room.on(RoomEvent.MediaDevicesError, (error: Error) => {
        console.error('[LiveKit] Media devices error:', error);
        toast({
          title: "Errore dispositivo",
          description: error.message,
          variant: "destructive",
        });
      });

      // Connect to the room (without auto-publishing)
      await room.connect(tokenData.serverUrl, tokenData.token, {
        autoSubscribe: true,
      });

      // Manually publish local tracks after connection
      await publishLocalTracks(room, enableVideo);

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
    requestMediaPermissions,
    fetchToken,
    updateConnectionState,
    publishLocalTracks,
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
    const newMuteState = muted !== undefined ? muted : !isMuted;
    
    if (localAudioTrackRef.current) {
      if (newMuteState) {
        localAudioTrackRef.current.mute();
      } else {
        localAudioTrackRef.current.unmute();
      }
      setIsMuted(newMuteState);
      console.log('[LiveKit] Microphone:', newMuteState ? 'muted' : 'unmuted');
    } else if (roomRef.current) {
      // Fallback to room API
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuteState);
      setIsMuted(newMuteState);
    }
  }, [isMuted]);

  // Toggle camera
  const toggleCamera = useCallback(async (enabled?: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    
    const newCameraState = enabled !== undefined ? enabled : !isCameraOn;
    
    try {
      if (newCameraState) {
        // Enable camera - create and publish new video track if needed
        if (!localVideoTrackRef.current) {
          const videoTrack = await createLocalVideoTrack({
            facingMode: "user",
            resolution: VideoPresets.h540.resolution,
          });
          localVideoTrackRef.current = videoTrack;
          setLocalVideoTrack(videoTrack);
          await room.localParticipant.publishTrack(videoTrack);
          console.log('[LiveKit] Camera enabled and published');
        } else {
          // Just unmute existing track
          await room.localParticipant.setCameraEnabled(true);
        }
      } else {
        // Disable camera
        if (localVideoTrackRef.current) {
          await room.localParticipant.unpublishTrack(localVideoTrackRef.current);
          localVideoTrackRef.current.stop();
          localVideoTrackRef.current = null;
          setLocalVideoTrack(null);
          console.log('[LiveKit] Camera disabled and unpublished');
        }
      }
      setIsCameraOn(newCameraState);
    } catch (error) {
      console.error('[LiveKit] Failed to toggle camera:', error);
    }
  }, [isCameraOn]);

  // Switch camera (front/back for mobile)
  const switchCamera = useCallback(async () => {
    if (!localVideoTrackRef.current || !roomRef.current) return;
    
    try {
      const currentSettings = localVideoTrackRef.current.mediaStreamTrack.getSettings();
      const newFacingMode = currentSettings.facingMode === "user" ? "environment" : "user";
      
      // Stop and unpublish current track
      await roomRef.current.localParticipant.unpublishTrack(localVideoTrackRef.current);
      localVideoTrackRef.current.stop();
      
      // Create new track with different facing mode
      const newVideoTrack = await createLocalVideoTrack({
        facingMode: newFacingMode,
        resolution: VideoPresets.h540.resolution,
      });
      
      localVideoTrackRef.current = newVideoTrack;
      setLocalVideoTrack(newVideoTrack);
      
      await roomRef.current.localParticipant.publishTrack(newVideoTrack);
      console.log('[LiveKit] Camera switched to:', newFacingMode);
    } catch (error) {
      console.error('[LiveKit] Failed to switch camera:', error);
    }
  }, []);

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
    isAgentSpeaking,
    room: roomRef.current,

    // Local tracks (for rendering)
    localVideoTrack,
    localAudioTrack,
    
    // Remote tracks
    remoteAudioTrack,
    remoteVideoTrack,
    
    // Renamed for clarity
    audioTrack: remoteAudioTrack,
    videoTrack: remoteVideoTrack,

    // Actions
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
    switchCamera,
    sendData,
    getCallDuration,
    getLocalParticipant,
    checkMicrophonePermissions,
  };
}
