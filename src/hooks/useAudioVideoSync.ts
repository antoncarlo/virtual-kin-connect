import { useCallback, useRef, useEffect, useState } from "react";

interface AudioVideoSyncConfig {
  onVapiAudioChunk?: (audioData: Float32Array) => void;
  onSpeechDetected?: (isSpeaking: boolean) => void;
  bufferSize?: number; // Minimum buffer for smooth playback (ms)
}

interface SyncState {
  isAudioPlaying: boolean;
  isVideoPlaying: boolean;
  latency: number;
  isSynced: boolean;
}

export function useAudioVideoSync({
  onVapiAudioChunk,
  onSpeechDetected,
  bufferSize = 100, // Minimal 100ms buffer for low latency
}: AudioVideoSyncConfig = {}) {
  const [syncState, setSyncState] = useState<SyncState>({
    isAudioPlaying: false,
    isVideoPlaying: false,
    latency: 0,
    isSynced: true,
  });

  // Timing refs for sync calculation
  const audioStartTimeRef = useRef<number>(0);
  const videoStartTimeRef = useRef<number>(0);
  const lastSyncCheckRef = useRef<number>(0);

  // Audio analysis for lip-sync timing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechThreshold = 0.02; // Threshold for speech detection

  // Initialize audio context for analysis
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: "interactive", // Prioritize low latency
        sampleRate: 48000,
      });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.3;
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Process incoming Vapi audio for sync
  const processVapiAudio = useCallback((audioData: Float32Array | ArrayBuffer) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    const now = performance.now();
    audioStartTimeRef.current = now;

    // Convert to Float32Array if needed
    let samples: Float32Array;
    if (audioData instanceof ArrayBuffer) {
      samples = new Float32Array(audioData);
    } else {
      samples = audioData;
    }

    // Detect speech from audio amplitude
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += Math.abs(samples[i]);
    }
    const average = sum / samples.length;
    const isSpeaking = average > speechThreshold;

    onSpeechDetected?.(isSpeaking);
    onVapiAudioChunk?.(samples);

    setSyncState(prev => ({
      ...prev,
      isAudioPlaying: isSpeaking,
    }));
  }, [onVapiAudioChunk, onSpeechDetected]);

  // Mark video frame start for sync calculation
  const markVideoStart = useCallback(() => {
    videoStartTimeRef.current = performance.now();
    setSyncState(prev => ({
      ...prev,
      isVideoPlaying: true,
    }));
  }, []);

  // Mark video frame end
  const markVideoEnd = useCallback(() => {
    setSyncState(prev => ({
      ...prev,
      isVideoPlaying: false,
    }));
  }, []);

  // Calculate current sync latency
  const calculateLatency = useCallback(() => {
    const now = performance.now();
    
    // Only check every 100ms to avoid overhead
    if (now - lastSyncCheckRef.current < 100) {
      return syncState.latency;
    }
    
    lastSyncCheckRef.current = now;

    // Calculate audio-video offset
    const audioOffset = now - audioStartTimeRef.current;
    const videoOffset = now - videoStartTimeRef.current;
    const latency = Math.abs(audioOffset - videoOffset);

    setSyncState(prev => ({
      ...prev,
      latency,
      isSynced: latency < bufferSize * 2, // Consider synced if within 2x buffer
    }));

    return latency;
  }, [bufferSize, syncState.latency]);

  // Connect Vapi audio stream to sync processor
  const connectVapiStream = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current || !analyserRef.current) return;

    try {
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Set up periodic analysis
      const dataArray = new Float32Array(analyserRef.current.frequencyBinCount);
      
      const analyze = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getFloatTimeDomainData(dataArray);
        processVapiAudio(dataArray);
        
        if (syncState.isAudioPlaying || syncState.isVideoPlaying) {
          requestAnimationFrame(analyze);
        }
      };

      analyze();
    } catch (error) {
      console.error("Failed to connect Vapi stream:", error);
    }
  }, [processVapiAudio, syncState.isAudioPlaying, syncState.isVideoPlaying]);

  // Get optimal text chunk timing for HeyGen
  const getOptimalChunkTiming = useCallback((textLength: number): number => {
    // Calculate optimal delay before sending text to HeyGen
    // Based on average speech rate (~15 chars/second for Italian)
    const speechDuration = (textLength / 15) * 1000;
    
    // Add minimal buffer for processing
    return Math.max(speechDuration - bufferSize, 0);
  }, [bufferSize]);

  // Prepare text for streaming to HeyGen with timing
  const prepareTextForStreaming = useCallback((text: string): { chunks: string[]; delays: number[] } => {
    // Split text into natural chunks (sentences or phrases)
    const chunks = text
      .split(/(?<=[.!?])\s+|(?<=[,;:])\s+/)
      .filter(chunk => chunk.trim().length > 0);

    // Calculate delays for each chunk
    const delays = chunks.map(chunk => getOptimalChunkTiming(chunk.length));

    return { chunks, delays };
  }, [getOptimalChunkTiming]);

  return {
    syncState,
    processVapiAudio,
    markVideoStart,
    markVideoEnd,
    calculateLatency,
    connectVapiStream,
    prepareTextForStreaming,
    getOptimalChunkTiming,
  };
}
