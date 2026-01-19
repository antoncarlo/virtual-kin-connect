/**
 * useHeyGenPrewarm Hook
 *
 * Pre-warms the HeyGen streaming session when the user enters the chat page,
 * BEFORE they press the call button. This significantly reduces perceived latency.
 *
 * Features:
 * - Fetches and caches session token in advance
 * - Pre-loads the HeyGen SDK
 * - Optionally pre-creates a session (can be reused when call starts)
 * - Automatic cleanup on unmount
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";

interface PrewarmState {
  token: string | null;
  sessionId: string | null;
  sdkLoaded: boolean;
  isPrewarmed: boolean;
  error: string | null;
}

interface UseHeyGenPrewarmOptions {
  /** Avatar ID to pre-warm for */
  avatarId?: string;
  /** Whether to automatically start pre-warming on mount */
  autoPrewarm?: boolean;
  /** Whether to pre-create a session (more aggressive, uses API credits) */
  precreateSession?: boolean;
}

interface UseHeyGenPrewarmReturn {
  /** Current pre-warm state */
  state: PrewarmState;
  /** Whether pre-warming is in progress */
  isPrewarming: boolean;
  /** Whether pre-warm is complete and ready */
  isReady: boolean;
  /** Cached token (if available) */
  cachedToken: string | null;
  /** Pre-created session ID (if available) */
  cachedSessionId: string | null;
  /** Manually trigger pre-warming */
  prewarm: () => Promise<void>;
  /** Clear cached data */
  clear: () => void;
}

export function useHeyGenPrewarm({
  avatarId,
  autoPrewarm = true,
  precreateSession = false,
}: UseHeyGenPrewarmOptions = {}): UseHeyGenPrewarmReturn {
  const [state, setState] = useState<PrewarmState>({
    token: null,
    sessionId: null,
    sdkLoaded: false,
    isPrewarmed: false,
    error: null,
  });
  const [isPrewarming, setIsPrewarming] = useState(false);
  
  const prewarmStarted = useRef(false);
  const cachedSdkPromise = useRef<Promise<any> | null>(null);

  // Pre-load the HeyGen SDK
  const loadSdk = useCallback(async () => {
    if (cachedSdkPromise.current) {
      return cachedSdkPromise.current;
    }

    cachedSdkPromise.current = import("@heygen/streaming-avatar");
    try {
      await cachedSdkPromise.current;
      setState(prev => ({ ...prev, sdkLoaded: true }));
      console.log("[HeyGen Prewarm] SDK loaded successfully");
      return cachedSdkPromise.current;
    } catch (error) {
      console.error("[HeyGen Prewarm] SDK load failed:", error);
      throw error;
    }
  }, []);

  // Fetch authentication token
  const fetchToken = useCallback(async () => {
    try {
      const response = await supabase.functions.invoke("heygen-streaming", {
        body: { action: "getToken" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const token = response.data?.data?.token;
      if (!token) {
        throw new Error("No token received");
      }

      setState(prev => ({ ...prev, token }));
      console.log("[HeyGen Prewarm] Token fetched successfully");
      return token;
    } catch (error) {
      console.error("[HeyGen Prewarm] Token fetch failed:", error);
      throw error;
    }
  }, []);

  // Pre-create session (optional, more aggressive)
  const precreate = useCallback(async () => {
    if (!avatarId) return null;

    try {
      const response = await supabase.functions.invoke("heygen-streaming", {
        body: {
          action: "create-session",
          avatarId,
          quality: "high",
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const sessionId = response.data?.data?.session_id;
      if (sessionId) {
        setState(prev => ({ ...prev, sessionId }));
        console.log("[HeyGen Prewarm] Session pre-created:", sessionId.substring(0, 12));
      }
      return sessionId;
    } catch (error) {
      console.error("[HeyGen Prewarm] Session pre-creation failed:", error);
      // Non-critical failure, continue without session
      return null;
    }
  }, [avatarId]);

  // Main pre-warm function
  const prewarm = useCallback(async () => {
    if (state.isPrewarmed || isPrewarming) {
      return;
    }

    setIsPrewarming(true);
    setState(prev => ({ ...prev, error: null }));

    try {
      // Run SDK loading and token fetching in parallel
      const promises: Promise<any>[] = [loadSdk(), fetchToken()];
      
      if (precreateSession) {
        // Wait for token first, then create session
        promises.push(
          Promise.resolve().then(async () => {
            await fetchToken();
            return precreate();
          })
        );
      }

      await Promise.all(promises);
      
      setState(prev => ({ ...prev, isPrewarmed: true }));
      console.log("[HeyGen Prewarm] ✅ Pre-warm complete");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setState(prev => ({ ...prev, error: errorMessage }));
      console.error("[HeyGen Prewarm] Pre-warm failed:", error);
    } finally {
      setIsPrewarming(false);
    }
  }, [state.isPrewarmed, isPrewarming, loadSdk, fetchToken, precreate, precreateSession]);

  // Clear cached data
  const clear = useCallback(() => {
    setState({
      token: null,
      sessionId: null,
      sdkLoaded: false,
      isPrewarmed: false,
      error: null,
    });
    prewarmStarted.current = false;
    console.log("[HeyGen Prewarm] Cache cleared");
  }, []);

  // Auto pre-warm on mount
  useEffect(() => {
    if (autoPrewarm && !prewarmStarted.current && avatarId) {
      prewarmStarted.current = true;
      // Delay slightly to not block initial render
      const timer = setTimeout(() => {
        prewarm();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrewarm, avatarId, prewarm]);

  // Cleanup pre-created session on unmount
  useEffect(() => {
    return () => {
      if (state.sessionId) {
        // Fire-and-forget cleanup
        supabase.functions.invoke("heygen-streaming", {
          body: {
            action: "stop-session",
            sessionId: state.sessionId,
          },
        }).catch(() => {});
      }
    };
  }, [state.sessionId]);

  return {
    state,
    isPrewarming,
    isReady: state.isPrewarmed && state.sdkLoaded && !!state.token,
    cachedToken: state.token,
    cachedSessionId: state.sessionId,
    prewarm,
    clear,
  };
}

export default useHeyGenPrewarm;
