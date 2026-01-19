import { motion } from "framer-motion";

interface MomoLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function MomoLogo({ size = "md", showText = true, className = "" }: MomoLogoProps) {
  const sizes = {
    sm: { circle: 24, text: "text-lg", gap: "gap-2" },
    md: { circle: 32, text: "text-2xl", gap: "gap-3" },
    lg: { circle: 48, text: "text-4xl", gap: "gap-4" },
  };

  const { circle, text, gap } = sizes[size];

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {/* Pulsing gradient circle - symbol of calm presence */}
      <motion.div
        className="relative flex-shrink-0"
        style={{ width: circle, height: circle }}
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/40 to-accent/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.4, 0.2, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Main circle with gradient */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Inner highlight */}
        <div 
          className="absolute rounded-full bg-white/30"
          style={{
            width: circle * 0.35,
            height: circle * 0.35,
            top: circle * 0.15,
            left: circle * 0.15,
          }}
        />
      </motion.div>

      {/* Text: momo in lowercase, rounded font */}
      {showText && (
        <span 
          className={`${text} font-display font-semibold tracking-wide text-foreground`}
          style={{ fontFamily: "'Quicksand', 'Comfortaa', 'Plus Jakarta Sans', sans-serif" }}
        >
          momo
        </span>
      )}
    </div>
  );
}
