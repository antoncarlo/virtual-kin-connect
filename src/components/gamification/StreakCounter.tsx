/**
 * Streak Counter Component
 * Shows daily streak with fire animation and bonus multiplier
 */

import { motion } from "framer-motion";
import { Flame, Calendar, Trophy } from "lucide-react";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  multiplier?: number;
  compact?: boolean;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  multiplier = 1,
  compact = false,
}: StreakCounterProps) {
  const isOnFire = currentStreak >= 3;
  const isSuperStreak = currentStreak >= 7;
  const isLegendary = currentStreak >= 30;

  // Determine flame color based on streak
  const flameColor = isLegendary
    ? "text-purple-500"
    : isSuperStreak
    ? "text-orange-500"
    : isOnFire
    ? "text-yellow-500"
    : "text-muted-foreground";

  const bgGradient = isLegendary
    ? "from-purple-500/20 via-purple-500/10 to-transparent"
    : isSuperStreak
    ? "from-orange-500/20 via-orange-500/10 to-transparent"
    : isOnFire
    ? "from-yellow-500/20 via-yellow-500/10 to-transparent"
    : "from-muted/20 via-muted/10 to-transparent";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          animate={isOnFire ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <Flame className={`w-5 h-5 ${flameColor}`} />
        </motion.div>
        <span className="font-bold text-foreground">{currentStreak}</span>
        {multiplier > 1 && (
          <span className="text-xs text-primary font-medium">×{multiplier.toFixed(1)}</span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br ${bgGradient} rounded-2xl p-4 border border-primary/10`}>
      <div className="flex items-center justify-between">
        {/* Streak Counter */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={isOnFire ? {
              scale: [1, 1.2, 1],
              rotate: [0, -5, 5, 0]
            } : {}}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              isLegendary
                ? "bg-gradient-to-br from-purple-500 to-pink-500"
                : isSuperStreak
                ? "bg-gradient-to-br from-orange-500 to-red-500"
                : isOnFire
                ? "bg-gradient-to-br from-yellow-500 to-orange-500"
                : "bg-muted"
            } shadow-lg`}
          >
            <Flame className="w-8 h-8 text-white" />
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Streak</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{currentStreak}</span>
              <span className="text-sm text-muted-foreground">giorni</span>
            </div>
          </div>
        </div>

        {/* Multiplier Badge */}
        {multiplier > 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-primary/20 rounded-xl px-3 py-2 text-center"
          >
            <p className="text-xs text-primary/70">Bonus XP</p>
            <p className="text-xl font-bold text-primary">×{multiplier.toFixed(1)}</p>
          </motion.div>
        )}
      </div>

      {/* Stats Row */}
      <div className="mt-4 pt-3 border-t border-primary/10 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="w-4 h-4 text-gold" />
          <span>Record: <strong className="text-foreground">{longestStreak}</strong> giorni</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Continua domani!</span>
        </div>
      </div>

      {/* Streak Milestones */}
      {!isLegendary && (
        <div className="mt-3">
          <div className="flex items-center gap-1">
            {[3, 7, 14, 30].map((milestone) => (
              <div
                key={milestone}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  currentStreak >= milestone
                    ? milestone >= 30
                      ? "bg-purple-500"
                      : milestone >= 14
                      ? "bg-orange-500"
                      : milestone >= 7
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
            <span>3</span>
            <span>7</span>
            <span>14</span>
            <span>30</span>
          </div>
        </div>
      )}
    </div>
  );
}
