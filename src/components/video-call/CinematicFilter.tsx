import { motion } from "framer-motion";

interface CinematicFilterProps {
  intensity?: "light" | "medium" | "strong";
  warmth?: number; // 0-100
  grain?: boolean;
  vignette?: boolean;
  isConnecting?: boolean;
}

export function CinematicFilter({
  intensity = "medium",
  warmth = 30,
  grain = true,
  vignette = true,
  isConnecting = false,
}: CinematicFilterProps) {
  const grainOpacity = {
    light: 0.02,
    medium: 0.04,
    strong: 0.06,
  }[intensity];

  const vignetteIntensity = {
    light: 0.15,
    medium: 0.25,
    strong: 0.4,
  }[intensity];

  return (
    <>
      {/* Warm Color Correction Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 mix-blend-soft-light"
        style={{
          background: `linear-gradient(
            180deg, 
            rgba(255, ${200 + warmth * 0.5}, ${150 + warmth}, ${0.05 + warmth * 0.002}) 0%,
            rgba(255, ${180 + warmth * 0.4}, ${120 + warmth * 0.8}, ${0.08 + warmth * 0.003}) 100%
          )`,
        }}
      />

      {/* Film Grain Effect */}
      {grain && (
        <motion.div
          animate={{ 
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: grainOpacity,
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Vignette Effect */}
      {vignette && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `radial-gradient(
              ellipse at center,
              transparent 40%,
              rgba(0, 0, 0, ${vignetteIntensity}) 100%
            )`,
          }}
        />
      )}

      {/* Loading Blur Transition */}
      <motion.div
        initial={{ backdropFilter: "blur(20px)", opacity: 1 }}
        animate={{ 
          backdropFilter: isConnecting ? "blur(20px)" : "blur(0px)",
          opacity: isConnecting ? 1 : 0,
        }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none z-20 bg-black/30"
        style={{ display: isConnecting ? "block" : "none" }}
      />

      {/* Subtle Light Leak Effect */}
      <motion.div
        animate={{
          opacity: [0.03, 0.08, 0.03],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 pointer-events-none z-10"
        style={{
          background: "radial-gradient(circle, rgba(255,200,150,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
    </>
  );
}
