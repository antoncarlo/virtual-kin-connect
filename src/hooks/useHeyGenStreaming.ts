import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  sdp: RTCSessionDescriptionInit;
  ice_servers2: RTCIceServer[];
}

// Debug logger
const log = (step: string, data?: unknown) => {
  console.log(`[HeyGen WebRTC] ${step}`, data ? data : "");
};

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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const sessionInfoRef = useRef<SessionInfo | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isStartingRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const iceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Create WebRTC peer connection with HeyGen's ICE servers
  const createPeerConnection = useCallback((iceServers: RTCIceServer[]) => {
    log("Creating RTCPeerConnection", { iceServers });
    
    const pc = new RTCPeerConnection({
      iceServers: iceServers.length > 0 ? iceServers : [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
      iceCandidatePoolSize: 10,
    });

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        log("ICE Candidate received", event.candidate.candidate.substring(0, 50));
        iceCandidatesRef.current.push(event.candidate);
        
        // Send ICE candidate to HeyGen
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
            log("ICE candidate send error", error);
          }
        }
      } else {
        log("ICE gathering complete");
      }
    };

    pc.oniceconnectionstatechange = () => {
      log("ICE connection state", pc.iceConnectionState);
      
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        log("✅ Video Stream Connected!");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        onConnected?.();
      } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        log("❌ ICE connection failed/disconnected");
        setConnectionError("Connessione video persa");
        if (pc.iceConnectionState === "failed") {
          onError?.(new Error("WebRTC connection failed"));
        }
      }
    };

    pc.onconnectionstatechange = () => {
      log("Connection state", pc.connectionState);
      
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

    // Handle incoming media tracks
    pc.ontrack = (event) => {
      log("🎥 Track received", { kind: event.track.kind, id: event.track.id });
      
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = new MediaStream();
      }
      
      // Add track to media stream
      mediaStreamRef.current.addTrack(event.track);
      setMediaStream(new MediaStream(mediaStreamRef.current.getTracks()));
      
      log("✅ Video Stream Attached", { 
        tracks: mediaStreamRef.current.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled }))
      });
    };

    return pc;
  }, [onConnected, onDisconnected, onError]);

  // Start HeyGen streaming session
  const startSession = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isStartingRef.current || isConnected || sessionInfoRef.current) {
      log("Session already in progress, skipping...");
      return;
    }

    isStartingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);
    iceCandidatesRef.current = [];
    
    log("🚀 Starting HeyGen session", { avatarId, voiceId });

    try {
      // Step 1: Create new streaming session
      log("Step 1: Creating session...");
      const createResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'create-session',
          avatarId: avatarId || 'josh_lite3_20230714',
          voiceId: voiceId || 'it-IT-DiegoNeural',
        },
      });

      log("Create session response", createResponse);

      if (createResponse.error) {
        throw new Error(`Create session failed: ${createResponse.error.message}`);
      }

      const sessionData = createResponse.data;
      if (!sessionData?.data?.session_id) {
        throw new Error(`Invalid session response: ${JSON.stringify(sessionData)}`);
      }

      log("✅ Session Created", { 
        session_id: sessionData.data.session_id,
        hasSdp: !!sessionData.data.sdp,
        hasIceServers: !!sessionData.data.ice_servers2
      });

      // Store session info
      sessionInfoRef.current = {
        session_id: sessionData.data.session_id,
        sdp: sessionData.data.sdp,
        ice_servers2: sessionData.data.ice_servers2 || [],
      };

      // Step 2: Create RTCPeerConnection
      log("Step 2: Creating RTCPeerConnection...");
      const pc = createPeerConnection(sessionInfoRef.current.ice_servers2);
      peerConnectionRef.current = pc;

      // Add transceiver for receiving video and audio
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });

      // Step 3: Set remote description (HeyGen's offer)
      log("Step 3: Setting remote description...");
      if (sessionInfoRef.current.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sessionInfoRef.current.sdp));
        log("✅ Remote description set");
      }

      // Step 4: Create answer
      log("Step 4: Creating answer...");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log("✅ Local description set (answer)");

      // Step 5: Send answer to HeyGen via start-session
      log("Step 5: Starting session with SDP answer...");
      const startResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'start-session',
          sessionId: sessionInfoRef.current.session_id,
          sdp: answer,
        },
      });

      log("Start session response", startResponse);

      if (startResponse.error) {
        throw new Error(`Start session failed: ${startResponse.error.message}`);
      }

      log("✅ SDP Exchange Complete");

      // Attach stream to video element when ready
      if (videoElement && mediaStreamRef.current) {
        log("Attaching stream to video element");
        videoElement.srcObject = mediaStreamRef.current;
        videoElement.play().catch(e => log("Video play error", e));
      }

      // Step 6: Send initial task to pre-warm avatar
      log("Step 6: Pre-warming avatar...");
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('heygen-streaming', {
            body: {
              action: 'send-task',
              sessionId: sessionInfoRef.current!.session_id,
              text: " ", // Empty space to trigger avatar render
            },
          });
          log("✅ Avatar pre-warmed");
        } catch (e) {
          log("Pre-warm failed (non-critical)", e);
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
      onError?.(err);
      
      toast({
        title: "Errore connessione HeyGen",
        description: err.message || "Impossibile avviare lo streaming",
        variant: "destructive",
      });
    }
  }, [avatarId, voiceId, isConnected, createPeerConnection, onError, toast]);

  // Send text for avatar to speak
  const sendText = useCallback(async (text: string, emotion?: string) => {
    if (!sessionInfoRef.current || !text.trim()) {
      log("sendText: No active session or empty text");
      return;
    }

    log("📢 Sending text to avatar", text.substring(0, 50));
    
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

      log("✅ Text sent successfully");

      // Estimate speech duration (~15 chars/second for Italian)
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
      log("sendText error", error);
      setIsSpeaking(false);
      setIsProcessing(false);
      onSpeaking?.(false);
      onProcessing?.(false);
    }
  }, [onSpeaking, onProcessing]);

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
      log("Gesture error", error);
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
      log("Emotion error", error);
    }
  }, []);

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
    } catch (error) {
      log("Interrupt error", error);
    }
  }, [onSpeaking]);

  // Stop session and cleanup
  const stopSession = useCallback(async () => {
    log("🛑 Stopping HeyGen session...");
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
      setMediaStream(null);
      setConnectionError(null);
      onDisconnected?.();
      
      log("✅ Session stopped");

    } catch (error) {
      log("Stop session error", error);
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
    connectionError,
    startSession,
    sendText,
    sendGesture,
    setEmotion,
    interrupt,
    stopSession,
  };
}
