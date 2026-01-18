/**
 * Level Progress Component
 * Shows user's current level, XP progress, and next level preview
 */

import { motion } from "framer-motion";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { LEVELS } from "@/lib/gamification";

interface LevelProgressProps {
  totalXP: number;
  currentLevel: number;
  showDetails?: boolean;
}

export function LevelProgress({ totalXP, currentLevel, showDetails = true }: LevelProgressProps) {
  // Find current and next level
  const currentLevelData = LEVELS.find(l => l.level === currentLevel) || LEVELS[0];
  const nextLevelData = LEVELS.find(l => l.level === currentLevel + 1);

  // Calculate progress to next level
  const xpForCurrentLevel = currentLevelData.xpRequired;
  const xpForNextLevel = nextLevelData?.xpRequired || currentLevelData.xpRequired;
  const xpInCurrentLevel = totalXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = nextLevelData
    ? Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100)
    : 100;

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20">
      {/* Level Badge and Name */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl shadow-lg shadow-primary/30"
          >
            {currentLevelData.badge}
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Livello {currentLevel}</p>
            <h3 className="font-bold text-lg text-foreground">{currentLevelData.name}</h3>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{totalXP.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">XP totali</p>
        </div>
      </div>

      {/* Progress Bar */}
      {nextLevelData && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-primary" />
              {xpInCurrentLevel.toLocaleString()} / {xpNeededForNext.toLocaleString()} XP
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              Prossimo: {nextLevelData.name} {nextLevelData.badge}
            </span>
          </div>
          <div className="relative">
            <Progress value={progressPercent} className="h-3 bg-primary/10" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                {Math.round(progressPercent)}%
              </span>
            </motion.div>
          </div>
        </div>
      )}

      {/* Perks */}
      {showDetails && currentLevelData.perks.length > 0 && (
        <div className="mt-4 pt-3 border-t border-primary/10">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold" />
            I tuoi vantaggi:
          </p>
          <div className="flex flex-wrap gap-1">
            {currentLevelData.perks.map((perk, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {perk}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Max Level Message */}
      {!nextLevelData && (
        <div className="mt-4 pt-3 border-t border-gold/20 text-center">
          <p className="text-sm text-gold flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Hai raggiunto il livello massimo!
            <Sparkles className="w-4 h-4" />
          </p>
        </div>
      )}
    </div>
  );
}
