import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CinematicFilter } from "./CinematicFilter";

interface ResponsiveVideoContainerProps {
  children: ReactNode;
  isConnecting?: boolean;
  isConnected?: boolean;
  temporalWarmth?: number; // Based on time of day
}

export function ResponsiveVideoContainer({
  children,
  isConnecting = false,
  isConnected = false,
  temporalWarmth = 30,
}: ResponsiveVideoContainerProps) {
  const [aspectRatio, setAspectRatio] = useState<"portrait" | "landscape">("portrait");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateAspectRatio = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      // Use 9:16 for mobile/portrait, 16:9 for desktop/landscape
      setAspectRatio(isMobile || isPortrait ? "portrait" : "landscape");
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateAspectRatio();
    window.addEventListener("resize", updateAspectRatio);
    window.addEventListener("orientationchange", updateAspectRatio);

    return () => {
      window.removeEventListener("resize", updateAspectRatio);
      window.removeEventListener("orientationchange", updateAspectRatio);
    };
  }, []);

  // Calculate optimal video dimensions maintaining aspect ratio
  const getVideoStyle = () => {
    const targetRatio = aspectRatio === "portrait" ? 9 / 16 : 16 / 9;
    const screenRatio = dimensions.width / dimensions.height;

    if (screenRatio > targetRatio) {
      // Screen is wider than target - fit to height
      return {
        height: "100%",
        width: "auto",
        maxWidth: "none",
      };
    } else {
      // Screen is taller than target - fit to width
      return {
        width: "100%",
        height: "auto",
        maxHeight: "none",
      };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden bg-black"
    >
      {/* Video Container with Optimal Aspect Ratio */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: "100%",
          height: "100%",
          ...getVideoStyle(),
        }}
      >
        {/* Main Video Content */}
        <div className="relative w-full h-full">
          {children}
        </div>

        {/* Cinematic Filter Overlay */}
        <CinematicFilter
          intensity="medium"
          warmth={temporalWarmth}
          grain={isConnected}
          vignette={true}
          isConnecting={isConnecting}
        />

        {/* Edge Softening for Natural Look */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            boxShadow: "inset 0 0 100px 20px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Aspect Ratio Indicator (debug, hidden in production) */}
      {process.env.NODE_ENV === "development" && (
        <div className="absolute top-20 left-4 text-xs text-white/40 z-50">
          {aspectRatio} • {dimensions.width}x{dimensions.height}
        </div>
      )}
    </motion.div>
  );
}
