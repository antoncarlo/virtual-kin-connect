import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase-client";
import { DebugLog } from "@/components/video-call/WebRTCDebugPanel";

// Public Avatar IDs from HeyGen
export const PUBLIC_AVATARS = {
  BRYAN_IT_SITTING: "Bryan_IT_Sitting_public",
  ELIAS_OUTDOORS: "Elias_Outdoors_public",
  // Add more public avatars as they become available
} as const;

interface UseHeyGenStreamingProps {
  avatarId?: string;
  voiceId?: string;
  quality?: "high" | "medium" | "low";
  onConnected?: () => void;
  onDisconnected?: () => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  onListening?: (isListening: boolean) => void;
  onError?: (error: Error) => void;
  onProcessing?: (isProcessing: boolean) => void;
  onDebugLog?: (step: string, status: DebugLog["status"], details?: string) => void;
  onConnectionStateChange?: (pc: RTCPeerConnection | null) => void;
}

interface SessionInfo {
  session_id: string;
  sdp: RTCSessionDescriptionInit;
  ice_servers2: RTCIceServer[];
  access_token?: string;
}

export function useHeyGenStreaming({
  avatarId = PUBLIC_AVATARS.BRYAN_IT_SITTING,
  voiceId,
  quality = "high",
  onConnected,
  onDisconnected,
  onSpeaking,
  onListening,
  onError,
  onProcessing,
  onDebugLog,
  onConnectionStateChange,
}: UseHeyGenStreamingProps = {}) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("idle");
  
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Debug logger
  const log = useCallback((step: string, status: DebugLog["status"] = "info", details?: string) => {
    console.log(`[HeyGen WebRTC] ${step}`, details || "");
    onDebugLog?.(step, status, details);
  }, [onDebugLog]);

  // Create WebRTC peer connection with HeyGen's ICE servers
  const createPeerConnection = useCallback((iceServers: RTCIceServer[]) => {
    log("Creating RTCPeerConnection", "pending", `${iceServers.length} ICE servers`);
    onConnectionStateChange?.(null);
    
    const pc = new RTCPeerConnection({
      iceServers: iceServers.length > 0 ? iceServers : [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    const updateStates = () => onConnectionStateChange?.(pc);

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        log("ICE Candidate", "info", event.candidate.candidate.substring(0, 40) + "...");
        iceCandidatesRef.current.push(event.candidate);
        
        if (sessionInfoRef.current) {
          try {
            await supabase.functions.invoke('heygen-streaming', {
              body: {
                action: 'ice-candidate',
                sessionId: sessionInfoRef.current.session_id,
                candidate: {
                  candidate: event.candidate.candidate,
                  sdpMid: event.candidate.sdpMid,
                  sdpMLineIndex: event.candidate.sdpMLineIndex,
                },
              },
            });
          } catch (error) {
            log("ICE candidate send error", "error", String(error));
          }
        }
      } else {
        log("ICE gathering complete", "success");
      }
    };

    pc.oniceconnectionstatechange = () => {
      updateStates();
      log("ICE connection state", "info", pc.iceConnectionState);
      setConnectionStatus(pc.iceConnectionState);
      
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        log("✅ WebRTC Stream Connected!", "success");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        onConnected?.();
      } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        log("❌ ICE connection failed", "error");
        setConnectionError("Connessione video persa");
        if (pc.iceConnectionState === "failed") {
          onError?.(new Error("WebRTC connection failed"));
        }
      }
    };

    pc.onconnectionstatechange = () => {
      updateStates();
      log("Connection state", "info", pc.connectionState);
      
      if (pc.connectionState === "connected") {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === "failed") {
        setConnectionError("Connessione fallita");
        onError?.(new Error("Peer connection failed"));
      } else if (pc.connectionState === "closed") {
        setIsConnected(false);
        onDisconnected?.();
      }
    };

    pc.onicegatheringstatechange = () => {
      updateStates();
      log("ICE gathering state", "info", pc.iceGatheringState);
    };

    // Handle incoming media tracks (video + audio from HeyGen)
    pc.ontrack = (event) => {
      log("🎥 Track received", "success", `${event.track.kind} - ${event.track.id.substring(0, 8)}`);
      
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = new MediaStream();
      }
      
      mediaStreamRef.current.addTrack(event.track);
      setMediaStream(new MediaStream(mediaStreamRef.current.getTracks()));
      
      const trackInfo = mediaStreamRef.current.getTracks().map(t => t.kind).join(", ");
      log("✅ Stream attached", "success", `Tracks: ${trackInfo}`);
    };

    return pc;
  }, [log, onConnected, onDisconnected, onError, onConnectionStateChange]);

  // Check if public avatars are available
  const checkAvatarAvailability = useCallback(async () => {
    try {
      log("Checking avatar availability...", "pending");
      
      const response = await supabase.functions.invoke('heygen-streaming', {
        body: { action: 'list-public-avatars' },
      });
      
      if (response.error) {
        log("Avatar check failed", "error", response.error.message);
        return false;
      }
      
      const data = response.data as any;
      const avatars = data?.data?.avatars || [];
      const targetAvatar = avatars.find((a: any) => a.avatar_id === avatarId);
      
      if (targetAvatar) {
        log("✅ Avatar available", "success", avatarId);
        return true;
      } else {
        log("Avatar not found, using fallback", "info", avatarId);
        return true; // Try anyway
      }
    } catch (error) {
      log("Avatar check error", "error", String(error));
      return true; // Try anyway
    }
  }, [avatarId, log]);

  // Start HeyGen streaming session with PUBLIC avatar
  const startSession = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isStartingRef.current || isConnected || sessionInfoRef.current) {
      log("Session already in progress", "info");
      return;
    }

    isStartingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);
    setConnectionStatus("connecting");
    iceCandidatesRef.current = [];
    
    log("🚀 Starting HeyGen Interactive Session", "pending", `Avatar: ${avatarId}`);

    try {
      // Optional: Check avatar availability first
      await checkAvatarAvailability();

      // Step 1: Create streaming session with PUBLIC avatar
      log("Step 1: Creating Interactive session...", "pending");
      
      const createResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'create-session',
          avatarId: avatarId,
          voiceId: voiceId || '',
          quality: quality,
        },
      });

      if (createResponse.error) {
        throw new Error(`Create session failed: ${createResponse.error.message}`);
      }

      const sessionData = createResponse.data;
      if (!sessionData?.data?.session_id) {
        throw new Error(`Invalid session response: ${JSON.stringify(sessionData)}`);
      }

      log("✅ Session Created", "success", sessionData.data.session_id.substring(0, 12) + "...");

      sessionInfoRef.current = {
        session_id: sessionData.data.session_id,
        sdp: sessionData.data.sdp,
        ice_servers2: sessionData.data.ice_servers2 || [],
        access_token: sessionData.data.access_token,
      };

      // Step 2: Create RTCPeerConnection
      log("Step 2: Creating RTCPeerConnection...", "pending");
      const pc = createPeerConnection(sessionInfoRef.current.ice_servers2);
      peerConnectionRef.current = pc;

      // Add transceivers for receiving video and audio
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      log("Transceivers added", "success", "video + audio (recvonly)");

      // Step 3: Set remote description (HeyGen's offer)
      log("Step 3: Setting remote description...", "pending");
      if (sessionInfoRef.current.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sessionInfoRef.current.sdp));
        log("✅ Remote SDP set", "success");
      }

      // Step 4: Create and set local answer
      log("Step 4: Creating SDP answer...", "pending");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log("✅ Local SDP set", "success");

      // Step 5: Send answer to HeyGen
      log("Step 5: Starting session with SDP...", "pending");
      const startResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'start-session',
          sessionId: sessionInfoRef.current.session_id,
          sdp: answer,
        },
      });

      if (startResponse.error) {
        throw new Error(`Start session failed: ${startResponse.error.message}`);
      }

      log("✅ SDP Exchange Complete", "success");

      // Attach stream to video element when tracks arrive
      if (videoElement) {
        const checkStream = setInterval(() => {
          if (mediaStreamRef.current && mediaStreamRef.current.getTracks().length > 0) {
            videoElement.srcObject = mediaStreamRef.current;
            videoElement.play().catch(e => log("Video play error", "error", String(e)));
            log("✅ Video element attached", "success");
            clearInterval(checkStream);
          }
        }, 100);

        // Clear interval after 10 seconds
        setTimeout(() => clearInterval(checkStream), 10000);
      }

      // Step 6: Pre-warm avatar with idle animation
      log("Step 6: Initializing avatar...", "pending");
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('heygen-streaming', {
            body: {
              action: 'set-listening',
              sessionId: sessionInfoRef.current!.session_id,
              isListening: true,
            },
          });
          log("✅ Avatar ready", "success");
        } catch (e) {
          log("Avatar init failed (non-critical)", "info", String(e));
        }
      }, 2000);

      toast({
        title: "Avatar connesso",
        description: "Streaming video HD attivo",
      });

    } catch (error) {
      console.error('[HeyGen WebRTC] Error:', error);
      setIsConnecting(false);
      setIsConnected(false);
      isStartingRef.current = false;
      
      const err = error as Error;
      setConnectionError(err.message);
      setConnectionStatus("error");
      log("❌ Connection failed", "error", err.message);
      onError?.(err);
      
      toast({
        title: "Errore connessione avatar",
        description: err.message || "Impossibile avviare lo streaming",
        variant: "destructive",
      });
    }
  }, [avatarId, voiceId, quality, isConnected, createPeerConnection, checkAvatarAvailability, log, onError, toast]);

  // Send text for avatar to lip-sync (connects to VAPI audio output)
  const sendText = useCallback(async (text: string, emotion?: string) => {
    if (!sessionInfoRef.current || !text.trim()) {
      return;
    }

    log("📢 Sending lip-sync text", "pending", text.substring(0, 40) + "...");
    
    setIsSpeaking(true);
    setIsProcessing(true);
    onSpeaking?.(true);
    onProcessing?.(true);

    try {
      const response = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'send-task',
          sessionId: sessionInfoRef.current.session_id,
          text: text.trim(),
          emotion,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      log("✅ Lip-sync task sent", "success");

      // Estimate speech duration (~15 chars/second)
      const estimatedDuration = Math.max(text.length * 65, 1500);
      
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }

      speakingTimeoutRef.current = setTimeout(() => {
        setIsSpeaking(false);
        setIsProcessing(false);
        onSpeaking?.(false);
        onProcessing?.(false);
      }, estimatedDuration);

    } catch (error) {
      log("Lip-sync error", "error", String(error));
      setIsSpeaking(false);
      setIsProcessing(false);
      onSpeaking?.(false);
      onProcessing?.(false);
    }
  }, [log, onSpeaking, onProcessing]);

  // Set active listening mode (head micro-movements)
  const setListeningMode = useCallback(async (listening: boolean) => {
    if (!sessionInfoRef.current) return;

    try {
      await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'set-listening',
          sessionId: sessionInfoRef.current.session_id,
          isListening: listening,
        },
      });
      
      setIsListening(listening);
      onListening?.(listening);
      log(listening ? "👂 Listening mode ON" : "Listening mode OFF", "info");
    } catch (error) {
      log("Set listening error", "error", String(error));
    }
  }, [log, onListening]);

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
      log(`Gesture sent: ${gesture}`, "info");
    } catch (error) {
      log("Gesture error", "error", String(error));
    }
  }, [log]);

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
      log(`Emotion set: ${emotion}`, "info");
    } catch (error) {
      log("Emotion error", "error", String(error));
    }
  }, [log]);

  // Interrupt current speech
  const interrupt = useCallback(async () => {
    if (!sessionInfoRef.current) return;

    try {
      await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'interrupt',
          sessionId: sessionInfoRef.current.session_id,
        },
      });
      
      setIsSpeaking(false);
      onSpeaking?.(false);
      log("Speech interrupted", "info");
    } catch (error) {
      log("Interrupt error", "error", String(error));
    }
  }, [log, onSpeaking]);

  // Stop session and cleanup
  const stopSession = useCallback(async () => {
    log("🛑 Stopping HeyGen session...", "pending");
    isStartingRef.current = false;
    
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

      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      sessionInfoRef.current = null;
      iceCandidatesRef.current = [];
      setIsConnected(false);
      setIsSpeaking(false);
      setIsListening(false);
      setMediaStream(null);
      setConnectionError(null);
      setConnectionStatus("idle");
      onDisconnected?.();
      
      log("✅ Session stopped", "success");

    } catch (error) {
      log("Stop session error", "error", String(error));
    }
  }, [log, onDisconnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSession();
    };
  }, [stopSession]);

  return {
    // State
    isConnecting,
    isConnected,
    isSpeaking,
    isListening,
    isProcessing,
    mediaStream,
    connectionError,
    connectionStatus,
    // Actions
    startSession,
    sendText,
    setListeningMode,
    sendGesture,
    setEmotion,
    interrupt,
    stopSession,
  };
}
