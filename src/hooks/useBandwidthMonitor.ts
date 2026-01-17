import { useState, useCallback, useRef, useEffect } from "react";

export interface BandwidthInfo {
  downlink: number; // Mbps
  effectiveType: "slow-2g" | "2g" | "3g" | "4g" | "5g" | "unknown";
  rtt: number; // Round trip time in ms
  quality: "excellent" | "good" | "poor" | "critical";
  shouldFallback: boolean;
}

const QUALITY_THRESHOLDS = {
  excellent: { minDownlink: 5, maxRtt: 100 },
  good: { minDownlink: 2, maxRtt: 200 },
  poor: { minDownlink: 0.5, maxRtt: 500 },
  // Below poor is critical
};

const FALLBACK_THRESHOLD = 0.3; // Mbps - switch to voice-only below this

export function useBandwidthMonitor(options?: {
  checkInterval?: number;
  onQualityChange?: (quality: BandwidthInfo["quality"]) => void;
  onFallbackTriggered?: () => void;
}) {
  const { 
    checkInterval = 5000, 
    onQualityChange, 
    onFallbackTriggered 
  } = options || {};

  const [bandwidthInfo, setBandwidthInfo] = useState<BandwidthInfo>({
    downlink: 10,
    effectiveType: "4g",
    rtt: 50,
    quality: "excellent",
    shouldFallback: false,
  });

  const previousQualityRef = useRef<BandwidthInfo["quality"]>("excellent");
  const consecutivePoorRef = useRef(0);

  const determineQuality = useCallback((downlink: number, rtt: number): BandwidthInfo["quality"] => {
    if (downlink >= QUALITY_THRESHOLDS.excellent.minDownlink && rtt <= QUALITY_THRESHOLDS.excellent.maxRtt) {
      return "excellent";
    }
    if (downlink >= QUALITY_THRESHOLDS.good.minDownlink && rtt <= QUALITY_THRESHOLDS.good.maxRtt) {
      return "good";
    }
    if (downlink >= QUALITY_THRESHOLDS.poor.minDownlink && rtt <= QUALITY_THRESHOLDS.poor.maxRtt) {
      return "poor";
    }
    return "critical";
  }, []);

  const checkBandwidth = useCallback(() => {
    // Use Network Information API if available
    const connection = (navigator as any).connection || 
                       (navigator as any).mozConnection || 
                       (navigator as any).webkitConnection;

    if (connection) {
      const downlink = connection.downlink || 10;
      const effectiveType = connection.effectiveType || "4g";
      const rtt = connection.rtt || 50;
      const quality = determineQuality(downlink, rtt);
      const shouldFallback = downlink < FALLBACK_THRESHOLD;

      // Track consecutive poor readings
      if (quality === "poor" || quality === "critical") {
        consecutivePoorRef.current++;
      } else {
        consecutivePoorRef.current = 0;
      }

      // Only trigger fallback after 3 consecutive poor readings
      const confirmedFallback = shouldFallback && consecutivePoorRef.current >= 3;

      if (quality !== previousQualityRef.current) {
        previousQualityRef.current = quality;
        onQualityChange?.(quality);
      }

      if (confirmedFallback) {
        onFallbackTriggered?.();
      }

      setBandwidthInfo({
        downlink,
        effectiveType: effectiveType as BandwidthInfo["effectiveType"],
        rtt,
        quality,
        shouldFallback: confirmedFallback,
      });

      return { downlink, effectiveType, rtt, quality, shouldFallback: confirmedFallback };
    }

    // Fallback: estimate based on performance timing
    return estimateBandwidth();
  }, [determineQuality, onQualityChange, onFallbackTriggered]);

  const estimateBandwidth = useCallback(async () => {
    // Simple bandwidth estimation using a small fetch
    const startTime = performance.now();
    
    try {
      const response = await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-store',
      });
      
      const endTime = performance.now();
      const rtt = endTime - startTime;
      
      // Estimate downlink based on typical favicon size and fetch time
      const estimatedDownlink = rtt < 100 ? 10 : rtt < 200 ? 5 : rtt < 500 ? 2 : 0.5;
      const quality = determineQuality(estimatedDownlink, rtt);
      const shouldFallback = estimatedDownlink < FALLBACK_THRESHOLD;

      const info: BandwidthInfo = {
        downlink: estimatedDownlink,
        effectiveType: estimatedDownlink > 5 ? "4g" : estimatedDownlink > 2 ? "3g" : "2g",
        rtt,
        quality,
        shouldFallback,
      };

      setBandwidthInfo(info);
      return info;
    } catch {
      return bandwidthInfo;
    }
  }, [determineQuality, bandwidthInfo]);

  // Periodic bandwidth monitoring
  useEffect(() => {
    checkBandwidth();
    const interval = setInterval(checkBandwidth, checkInterval);
    
    // Listen to connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener?.("change", checkBandwidth);
    }

    return () => {
      clearInterval(interval);
      connection?.removeEventListener?.("change", checkBandwidth);
    };
  }, [checkBandwidth, checkInterval]);

  return {
    bandwidthInfo,
    checkBandwidth,
    isLowBandwidth: bandwidthInfo.quality === "poor" || bandwidthInfo.quality === "critical",
  };
}
