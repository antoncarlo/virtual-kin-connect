import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DebugLog } from "@/components/video-call/WebRTCDebugPanel";

interface UseHeyGenStreamingProps {
  avatarId?: string;
  voiceId?: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onSpeaking?: (isSpeaking: boolean) => void;
  onError?: (error: Error) => void;
  onProcessing?: (isProcessing: boolean) => void;
  onDebugLog?: (step: string, status: DebugLog["status"], details?: string) => void;
  onConnectionStateChange?: (pc: RTCPeerConnection | null) => void;
}

interface SessionInfo {
  session_id: string;
  sdp: RTCSessionDescriptionInit;
  ice_servers2: RTCIceServer[];
}

export function useHeyGenStreaming({
  avatarId,
  voiceId,
  onConnected,
  onDisconnected,
  onSpeaking,
  onError,
  onProcessing,
  onDebugLog,
  onConnectionStateChange,
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

  // Debug logger that also sends to UI
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

    // Update connection states for debug panel
    const updateStates = () => onConnectionStateChange?.(pc);

    // Handle ICE candidates
    pc.onicecandidate = async (event) => {
      if (event.candidate) {
        log("ICE Candidate received", "info", event.candidate.candidate.substring(0, 50));
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
      
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        log("✅ Video Stream Connected!", "success");
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);
        onConnected?.();
      } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        log("❌ ICE connection failed/disconnected", "error");
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

    // Handle incoming media tracks
    pc.ontrack = (event) => {
      log("🎥 Track received", "success", `${event.track.kind} - ${event.track.id.substring(0, 8)}`);
      
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = new MediaStream();
      }
      
      // Add track to media stream
      mediaStreamRef.current.addTrack(event.track);
      setMediaStream(new MediaStream(mediaStreamRef.current.getTracks()));
      
      const trackInfo = mediaStreamRef.current.getTracks().map(t => t.kind).join(", ");
      log("✅ Video Stream Attached", "success", `Tracks: ${trackInfo}`);
    };

    return pc;
  }, [log, onConnected, onDisconnected, onError, onConnectionStateChange]);

  // Start HeyGen streaming session
  const startSession = useCallback(async (videoElement?: HTMLVideoElement) => {
    if (isStartingRef.current || isConnected || sessionInfoRef.current) {
      log("Session already in progress, skipping...", "info");
      return;
    }

    isStartingRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);
    iceCandidatesRef.current = [];
    
    log("🚀 Starting HeyGen session", "pending", `Avatar: ${avatarId}`);

    try {
      // Step 1: Create new streaming session
      log("Step 1: Creating session...", "pending");
      const createResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'create-session',
          avatarId: avatarId || 'josh_lite3_20230714',
          voiceId: voiceId || 'it-IT-DiegoNeural',
        },
      });

      if (createResponse.error) {
        log("Create session failed", "error", createResponse.error.message);
        throw new Error(`Create session failed: ${createResponse.error.message}`);
      }

      const sessionData = createResponse.data;
      if (!sessionData?.data?.session_id) {
        log("Invalid session response", "error", "No session_id");
        throw new Error(`Invalid session response: ${JSON.stringify(sessionData)}`);
      }

      log("✅ Session Created", "success", sessionData.data.session_id.substring(0, 12) + "...");

      // Store session info
      sessionInfoRef.current = {
        session_id: sessionData.data.session_id,
        sdp: sessionData.data.sdp,
        ice_servers2: sessionData.data.ice_servers2 || [],
      };

      // Step 2: Create RTCPeerConnection
      log("Step 2: Creating RTCPeerConnection...", "pending");
      const pc = createPeerConnection(sessionInfoRef.current.ice_servers2);
      peerConnectionRef.current = pc;
      log("RTCPeerConnection created", "success");

      // Add transceiver for receiving video and audio
      pc.addTransceiver("video", { direction: "recvonly" });
      pc.addTransceiver("audio", { direction: "recvonly" });
      log("Transceivers added", "success", "video + audio");

      // Step 3: Set remote description (HeyGen's offer)
      log("Step 3: Setting remote description...", "pending");
      if (sessionInfoRef.current.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(sessionInfoRef.current.sdp));
        log("✅ Remote description set", "success");
      }

      // Step 4: Create answer
      log("Step 4: Creating answer...", "pending");
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      log("✅ Local description set", "success", "SDP answer ready");

      // Step 5: Send answer to HeyGen via start-session
      log("Step 5: Sending SDP answer to HeyGen...", "pending");
      const startResponse = await supabase.functions.invoke('heygen-streaming', {
        body: {
          action: 'start-session',
          sessionId: sessionInfoRef.current.session_id,
          sdp: answer,
        },
      });

      if (startResponse.error) {
        log("Start session failed", "error", startResponse.error.message);
        throw new Error(`Start session failed: ${startResponse.error.message}`);
      }

      log("✅ SDP Exchange Complete", "success");

      // Attach stream to video element when ready
      if (videoElement && mediaStreamRef.current) {
        log("Attaching stream to video element", "pending");
        videoElement.srcObject = mediaStreamRef.current;
        videoElement.play().catch(e => log("Video play error", "error", String(e)));
        log("Stream attached to video", "success");
      }

      // Step 6: Send initial task to pre-warm avatar
      log("Step 6: Pre-warming avatar...", "pending");
      setTimeout(async () => {
        try {
          await supabase.functions.invoke('heygen-streaming', {
            body: {
              action: 'send-task',
              sessionId: sessionInfoRef.current!.session_id,
              text: " ", // Empty space to trigger avatar render
            },
          });
          log("✅ Avatar pre-warmed", "success");
        } catch (e) {
          log("Pre-warm failed (non-critical)", "error", String(e));
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
      log("❌ Connection failed", "error", err.message);
      onError?.(err);
      
      toast({
        title: "Errore connessione HeyGen",
        description: err.message || "Impossibile avviare lo streaming",
        variant: "destructive",
      });
    }
  }, [avatarId, voiceId, isConnected, createPeerConnection, log, onError, toast]);

  // Send text for avatar to speak
  const sendText = useCallback(async (text: string, emotion?: string) => {
    if (!sessionInfoRef.current || !text.trim()) {
      log("sendText: No active session or empty text", "info");
      return;
    }

    log("📢 Sending text to avatar", "pending", text.substring(0, 50));
    
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

      log("✅ Text sent successfully", "success");

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
      log("sendText error", "error", String(error));
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
