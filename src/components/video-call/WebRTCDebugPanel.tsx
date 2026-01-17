import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, ChevronDown, ChevronUp, CheckCircle, XCircle, Loader2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DebugLog {
  timestamp: Date;
  step: string;
  status: "pending" | "success" | "error" | "info";
  details?: string;
}

interface WebRTCDebugPanelProps {
  logs: DebugLog[];
  isVisible?: boolean;
  connectionState?: RTCPeerConnectionState | string;
  iceConnectionState?: RTCIceConnectionState | string;
  iceGatheringState?: RTCIceGatheringState | string;
}

export function WebRTCDebugPanel({
  logs,
  isVisible = true,
  connectionState,
  iceConnectionState,
  iceGatheringState,
}: WebRTCDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const getStatusIcon = (status: DebugLog["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case "error":
        return <XCircle className="w-3 h-3 text-red-400" />;
      case "pending":
        return <Loader2 className="w-3 h-3 text-yellow-400 animate-spin" />;
      case "info":
      default:
        return <Circle className="w-3 h-3 text-blue-400" />;
    }
  };

  const getStateColor = (state?: string) => {
    if (!state) return "text-gray-400";
    if (["connected", "complete", "completed"].includes(state)) return "text-green-400";
    if (["checking", "gathering", "new"].includes(state)) return "text-yellow-400";
    if (["failed", "disconnected", "closed"].includes(state)) return "text-red-400";
    return "text-blue-400";
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`fixed bottom-24 left-4 z-[110] bg-black/90 backdrop-blur-md rounded-lg border border-white/20 shadow-2xl overflow-hidden ${
          isMinimized ? "w-auto" : "w-80 max-w-[90vw]"
        }`}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-3 py-2 bg-white/5 cursor-pointer"
          onClick={() => setIsMinimized(!isMinimized)}
        >
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-medium text-white">WebRTC Debug</span>
          </div>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-white/60 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-3">
            {/* Connection States */}
            <div className="mb-3 p-2 bg-white/5 rounded text-[10px] font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Connection:</span>
                <span className={getStateColor(connectionState)}>{connectionState || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">ICE:</span>
                <span className={getStateColor(iceConnectionState)}>{iceConnectionState || "N/A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gathering:</span>
                <span className={getStateColor(iceGatheringState)}>{iceGatheringState || "N/A"}</span>
              </div>
            </div>

            {/* Logs */}
            {isExpanded && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/20">
                {logs.length === 0 ? (
                  <div className="text-[10px] text-gray-500 text-center py-2">
                    Waiting for connection...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-2 text-[10px] font-mono"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {getStatusIcon(log.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white/90 truncate">{log.step}</div>
                        {log.details && (
                          <div className="text-gray-500 truncate">{log.details}</div>
                        )}
                      </div>
                      <div className="text-gray-600 flex-shrink-0">
                        {log.timestamp.toLocaleTimeString("it-IT", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// Custom hook to manage debug logs
export function useWebRTCDebugLogs() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [connectionState, setConnectionState] = useState<string>();
  const [iceConnectionState, setIceConnectionState] = useState<string>();
  const [iceGatheringState, setIceGatheringState] = useState<string>();

  const addLog = useCallback((step: string, status: DebugLog["status"] = "info", details?: string) => {
    setLogs(prev => [...prev, { timestamp: new Date(), step, status, details }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const updateConnectionStates = useCallback((pc: RTCPeerConnection | null) => {
    if (pc) {
      setConnectionState(pc.connectionState);
      setIceConnectionState(pc.iceConnectionState);
      setIceGatheringState(pc.iceGatheringState);
    } else {
      setConnectionState(undefined);
      setIceConnectionState(undefined);
      setIceGatheringState(undefined);
    }
  }, []);

  return {
    logs,
    connectionState,
    iceConnectionState,
    iceGatheringState,
    addLog,
    clearLogs,
    updateConnectionStates,
  };
}
