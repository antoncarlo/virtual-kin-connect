/**
 * useRingtone Hook
 *
 * Manages audio feedback during call connection.
 * Plays a dialing/ringing tone until the stream is ready.
 *
 * Features:
 * - Web Audio API for precise timing
 * - Configurable ringtone patterns
 * - Auto-stop on stream ready
 * - Fallback for browsers without Web Audio API
 */

import { useRef, useCallback, useEffect, useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface UseRingtoneOptions {
  /** Frequency of the dial tone in Hz (default: 440) */
  frequency?: number;
  /** Secondary frequency for dual-tone (default: 480) */
  frequency2?: number;
  /** Duration of each "tuuu" in ms (default: 400) */
  toneDuration?: number;
  /** Gap between tones in ms (default: 200) */
  gapDuration?: number;
  /** Volume 0-1 (default: 0.3) */
  volume?: number;
  /** Use European ringtone pattern (default: true) */
  europeanPattern?: boolean;
}

export interface UseRingtoneReturn {
  /** Start playing the ringtone */
  start: () => void;
  /** Stop playing the ringtone */
  stop: () => void;
  /** Whether ringtone is currently playing */
  isPlaying: boolean;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useRingtone(options: UseRingtoneOptions = {}): UseRingtoneReturn {
  const {
    frequency = 440,      // A4 note
    frequency2 = 480,     // Slightly higher for dual-tone
    toneDuration = 400,   // 400ms tone
    gapDuration = 200,    // 200ms silence
    volume = 0.3,
    europeanPattern = true,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const oscillator2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPlayingRef = useRef(false);

  /**
   * Create and configure oscillators for dual-tone dialing
   */
  const createOscillators = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Create gain node for volume control
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    // Create primary oscillator
    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = frequency;
    osc1.connect(gainNode);
    oscillatorRef.current = osc1;

    // Create secondary oscillator for dual-tone
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = frequency2;
    osc2.connect(gainNode);
    oscillator2Ref.current = osc2;

    // Start oscillators (they're silent due to gain=0)
    osc1.start();
    osc2.start();
  }, [frequency, frequency2]);

  /**
   * Play a single tone burst
   */
  const playToneBurst = useCallback(() => {
    if (!gainNodeRef.current || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const now = ctx.currentTime;

    // Fade in
    gainNodeRef.current.gain.cancelScheduledValues(now);
    gainNodeRef.current.gain.setValueAtTime(0, now);
    gainNodeRef.current.gain.linearRampToValueAtTime(volume, now + 0.02);

    // Fade out
    gainNodeRef.current.gain.setValueAtTime(volume, now + (toneDuration / 1000) - 0.02);
    gainNodeRef.current.gain.linearRampToValueAtTime(0, now + (toneDuration / 1000));
  }, [toneDuration, volume]);

  /**
   * Start the ringtone pattern
   */
  const start = useCallback(() => {
    if (isPlayingRef.current) return;

    isPlayingRef.current = true;
    setIsPlaying(true);

    // Create audio context on user interaction
    createOscillators();

    // Resume audio context if suspended
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
    }

    // Play first tone immediately
    playToneBurst();

    // European pattern: tuuu (400ms) - silence (200ms) - tuuu (400ms) - silence (4000ms)
    // Standard pattern: tuuu (400ms) - silence (200ms) repeating
    const patternDuration = europeanPattern
      ? toneDuration + gapDuration + toneDuration + 4000 // ~5s cycle
      : toneDuration + gapDuration; // ~600ms cycle

    let toneIndex = 0;

    intervalRef.current = setInterval(() => {
      if (!isPlayingRef.current) return;

      if (europeanPattern) {
        // European double-tone pattern
        toneIndex = (toneIndex + 1) % 3;
        if (toneIndex === 0) {
          playToneBurst();
        } else if (toneIndex === 1) {
          // Short gap, then second tone
          setTimeout(() => {
            if (isPlayingRef.current) playToneBurst();
          }, gapDuration);
        }
        // toneIndex === 2 is the long pause
      } else {
        // Standard repeating tone
        playToneBurst();
      }
    }, europeanPattern ? patternDuration / 3 : patternDuration);

  }, [createOscillators, playToneBurst, toneDuration, gapDuration, europeanPattern]);

  /**
   * Stop the ringtone
   */
  const stop = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Fade out gain
    if (gainNodeRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.setValueAtTime(gainNodeRef.current.gain.value, now);
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + 0.05);
    }

    // Stop oscillators
    setTimeout(() => {
      oscillatorRef.current?.stop();
      oscillator2Ref.current?.stop();
      oscillatorRef.current = null;
      oscillator2Ref.current = null;
      gainNodeRef.current = null;
    }, 100);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stop]);

  return {
    start,
    stop,
    isPlaying,
  };
}

// ============================================================================
// ALTERNATIVE: MP3-based ringtone (for custom sounds)
// ============================================================================

export interface UseAudioRingtoneOptions {
  /** URL to the audio file */
  audioUrl: string;
  /** Whether to loop the audio */
  loop?: boolean;
  /** Volume 0-1 */
  volume?: number;
}

export function useAudioRingtone(options: UseAudioRingtoneOptions): UseRingtoneReturn {
  const { audioUrl, loop = true, volume = 0.5 } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio
    const audio = new Audio(audioUrl);
    audio.loop = loop;
    audio.volume = volume;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl, loop, volume]);

  const start = useCallback(() => {
    if (!audioRef.current || isPlaying) return;

    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.warn);
    setIsPlaying(true);
  }, [isPlaying]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;

    // Fade out
    const fadeOut = setInterval(() => {
      if (audioRef.current && audioRef.current.volume > 0.05) {
        audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.1);
      } else {
        clearInterval(fadeOut);
        audioRef.current?.pause();
        if (audioRef.current) audioRef.current.volume = volume;
        setIsPlaying(false);
      }
    }, 50);
  }, [volume]);

  return {
    start,
    stop,
    isPlaying,
  };
}

export default useRingtone;
