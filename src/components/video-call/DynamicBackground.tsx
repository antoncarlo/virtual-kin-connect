import { motion } from "framer-motion";
import { TemporalContext } from "@/hooks/useTemporalContext";

interface DynamicBackgroundProps {
  temporalContext: TemporalContext;
  children: React.ReactNode;
}

export function DynamicBackground({ temporalContext, children }: DynamicBackgroundProps) {
  const { timeOfDay, ambientColor, backgroundTheme } = temporalContext;

  const gradients: Record<typeof backgroundTheme, string> = {
    warm: "from-orange-950/40 via-amber-900/30 to-slate-900",
    natural: "from-blue-950/30 via-slate-900 to-slate-900",
    cool: "from-blue-950/50 via-indigo-900/30 to-slate-900",
    dark: "from-slate-950 via-blue-950/40 to-slate-900",
  };

  return (
    <div className="relative w-full h-full">
      {/* Base gradient layer */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradients[backgroundTheme]} z-0`} />
      
      {/* Ambient color overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="absolute inset-0 z-0"
        style={{ backgroundColor: ambientColor }}
      />

      {/* Time-specific effects */}
      {timeOfDay === "night" && (
        <div className="absolute inset-0 z-0">
          {/* Subtle star-like particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              className="absolute w-1 h-1 bg-white/50 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 40}%`,
              }}
            />
          ))}
        </div>
      )}

      {timeOfDay === "evening" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          className="absolute inset-0 bg-gradient-to-t from-orange-500/20 via-transparent to-transparent z-0"
        />
      )}

      {timeOfDay === "morning" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.1 }}
          className="absolute inset-0 bg-gradient-to-br from-yellow-200/20 via-transparent to-transparent z-0"
        />
      )}

      {/* Content with lighting filter */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
