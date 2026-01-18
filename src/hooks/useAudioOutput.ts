/**
 * useAudioOutput Hook
 *
 * Manages audio output device selection using the Web Audio API setSinkId.
 * Provides fallback for browsers that don't support setSinkId.
 *
 * Features:
 * - Lists available audio output devices
 * - Changes audio output for video/audio elements
 * - Permission handling
 * - Fallback for unsupported browsers
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

export interface UseAudioOutputOptions {
  /** Automatically request permissions on mount */
  autoRequestPermission?: boolean;
  /** Callback when device changes */
  onDeviceChange?: (deviceId: string) => void;
}

export interface UseAudioOutputReturn {
  /** List of available audio output devices */
  devices: AudioDevice[];
  /** Currently selected device ID */
  selectedDevice: string;
  /** Whether setSinkId is supported */
  isSupported: boolean;
  /** Whether permissions have been granted */
  hasPermission: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error if any */
  error: Error | null;
  /** Request microphone permission (needed to get device labels) */
  requestPermission: () => Promise<boolean>;
  /** Refresh the device list */
  refreshDevices: () => Promise<void>;
  /** Set audio output for a specific element */
  setAudioOutput: (element: HTMLMediaElement, deviceId?: string) => Promise<boolean>;
  /** Change selected device and apply to all registered elements */
  selectDevice: (deviceId: string) => Promise<void>;
  /** Register an element to be managed */
  registerElement: (element: HTMLMediaElement) => void;
  /** Unregister an element */
  unregisterElement: (element: HTMLMediaElement) => void;
}

// ============================================================================
// HELPER: Check if setSinkId is supported
// ============================================================================

const checkSinkIdSupport = (): boolean => {
  if (typeof HTMLMediaElement === "undefined") return false;
  return typeof (HTMLMediaElement.prototype as any).setSinkId === "function";
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useAudioOutput(
  options: UseAudioOutputOptions = {}
): UseAudioOutputReturn {
  const { autoRequestPermission = false, onDeviceChange } = options;

  // State
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("default");
  const [isSupported] = useState<boolean>(checkSinkIdSupport);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for managing elements
  const managedElements = useRef<Set<HTMLMediaElement>>(new Set());

  /**
   * Request microphone permission
   * This is needed to get proper device labels (privacy restriction)
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Request microphone permission to unlock device labels
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Stop the stream immediately (we just needed permission)
      stream.getTracks().forEach((track) => track.stop());

      setHasPermission(true);
      return true;
    } catch (err) {
      console.warn("[useAudioOutput] Permission denied:", err);
      setError(err instanceof Error ? err : new Error("Permission denied"));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh the list of audio output devices
   */
  const refreshDevices = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const allDevices = await navigator.mediaDevices.enumerateDevices();

      // Filter for audio output devices
      const audioOutputs = allDevices
        .filter((device) => device.kind === "audiooutput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
          kind: device.kind,
          groupId: device.groupId,
        }));

      // Always include a "default" option at the beginning
      if (!audioOutputs.some((d) => d.deviceId === "default")) {
        audioOutputs.unshift({
          deviceId: "default",
          label: "Predefinito del sistema",
          kind: "audiooutput",
          groupId: "",
        });
      }

      setDevices(audioOutputs);

      // Check if we have permission by checking for labels
      const hasLabels = audioOutputs.some(
        (d) => d.label && !d.label.startsWith("Speaker")
      );
      setHasPermission(hasLabels);
    } catch (err) {
      console.error("[useAudioOutput] Failed to enumerate devices:", err);
      setError(err instanceof Error ? err : new Error("Failed to get devices"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set audio output for a specific element
   */
  const setAudioOutput = useCallback(
    async (element: HTMLMediaElement, deviceId?: string): Promise<boolean> => {
      const targetDevice = deviceId || selectedDevice;

      if (!isSupported) {
        console.warn("[useAudioOutput] setSinkId not supported in this browser");
        return false;
      }

      try {
        await (element as any).setSinkId(targetDevice);
        console.log(`[useAudioOutput] Audio output set to: ${targetDevice}`);
        return true;
      } catch (err) {
        console.error("[useAudioOutput] Failed to set audio output:", err);

        // Common errors:
        // - NotFoundError: Device not found
        // - NotAllowedError: Permission denied
        // - AbortError: Setting interrupted

        if ((err as DOMException).name === "NotFoundError") {
          // Device was removed, fall back to default
          try {
            await (element as any).setSinkId("default");
            setSelectedDevice("default");
            return true;
          } catch {
            return false;
          }
        }

        return false;
      }
    },
    [isSupported, selectedDevice]
  );

  /**
   * Change selected device and apply to all registered elements
   */
  const selectDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      setSelectedDevice(deviceId);

      // Apply to all registered elements
      const promises: Promise<boolean>[] = [];
      managedElements.current.forEach((element) => {
        promises.push(setAudioOutput(element, deviceId));
      });

      await Promise.all(promises);

      // Notify callback
      onDeviceChange?.(deviceId);
    },
    [setAudioOutput, onDeviceChange]
  );

  /**
   * Register an element to be managed
   */
  const registerElement = useCallback(
    (element: HTMLMediaElement): void => {
      managedElements.current.add(element);

      // Apply current selection
      if (selectedDevice !== "default") {
        setAudioOutput(element, selectedDevice);
      }
    },
    [selectedDevice, setAudioOutput]
  );

  /**
   * Unregister an element
   */
  const unregisterElement = useCallback((element: HTMLMediaElement): void => {
    managedElements.current.delete(element);
  }, []);

  // -------------------------------------------------------------------------
  // EFFECTS
  // -------------------------------------------------------------------------

  // Initial device enumeration
  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  // Auto-request permission
  useEffect(() => {
    if (autoRequestPermission && !hasPermission && devices.length > 0) {
      requestPermission().then(() => refreshDevices());
    }
  }, [autoRequestPermission, hasPermission, devices.length, requestPermission, refreshDevices]);

  // Listen for device changes (plugging in/removing devices)
  useEffect(() => {
    const handleDeviceChange = () => {
      refreshDevices();
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [refreshDevices]);

  // Cleanup managed elements on unmount
  useEffect(() => {
    return () => {
      managedElements.current.clear();
    };
  }, []);

  return {
    devices,
    selectedDevice,
    isSupported,
    hasPermission,
    isLoading,
    error,
    requestPermission,
    refreshDevices,
    setAudioOutput,
    selectDevice,
    registerElement,
    unregisterElement,
  };
}

// ============================================================================
// UTILITY: Get default device for fallback
// ============================================================================

export async function getDefaultAudioOutput(): Promise<string> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const defaultOutput = devices.find(
      (d) => d.kind === "audiooutput" && d.deviceId === "default"
    );
    return defaultOutput?.deviceId || "default";
  } catch {
    return "default";
  }
}

export default useAudioOutput;
