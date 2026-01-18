/**
 * Achievements Panel Component
 * Displays unlocked and locked achievements with progress
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lock, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ACHIEVEMENTS, type Achievement, type AchievementRarity } from "@/lib/gamification";

interface AchievementsPanelProps {
  unlockedAchievements: Array<{ id: string; unlockedAt: Date }>;
  userStats?: {
    totalMessages: number;
    totalCallMinutes: number;
    goalsCompleted: number;
    memoriesShared: number;
  };
  compact?: boolean;
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  uncommon: "bg-green-500/20 text-green-400 border-green-500/30",
  rare: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  legendary: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border-yellow-500/30",
};

const RARITY_LABELS: Record<AchievementRarity, string> = {
  common: "Comune",
  uncommon: "Non Comune",
  rare: "Raro",
  epic: "Epico",
  legendary: "Leggendario",
};

export function AchievementsPanel({
  unlockedAchievements,
  userStats,
  compact = false,
}: AchievementsPanelProps) {
  const [showAll, setShowAll] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));

  // Separate unlocked and locked
  const unlocked = ACHIEVEMENTS.filter(a => unlockedIds.has(a.id));
  const locked = ACHIEVEMENTS.filter(a => !unlockedIds.has(a.id) && !a.isSecret);

  // Calculate progress for locked achievements
  const getProgress = (achievement: Achievement): number => {
    if (!userStats) return 0;
    const { requirement } = achievement;

    let current = 0;
    switch (requirement.metric) {
      case 'messages':
        current = userStats.totalMessages;
        break;
      case 'call_minutes':
        current = userStats.totalCallMinutes;
        break;
      case 'goals_completed':
        current = userStats.goalsCompleted;
        break;
      case 'memories_shared':
        current = userStats.memoriesShared;
        break;
      default:
        current = 0;
    }

    return Math.min(100, (current / requirement.target) * 100);
  };

  // Get categories
  const categories = [...new Set(ACHIEVEMENTS.map(a => a.category))];

  // Filter achievements
  const filteredUnlocked = selectedCategory
    ? unlocked.filter(a => a.category === selectedCategory)
    : unlocked;
  const filteredLocked = selectedCategory
    ? locked.filter(a => a.category === selectedCategory)
    : locked;

  const displayedAchievements = compact
    ? [...filteredUnlocked.slice(0, 3), ...filteredLocked.slice(0, 3)]
    : showAll
    ? [...filteredUnlocked, ...filteredLocked]
    : [...filteredUnlocked.slice(0, 6), ...filteredLocked.slice(0, 6)];

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold" />
            Achievement
          </h3>
          <span className="text-xs text-muted-foreground">
            {unlocked.length}/{ACHIEVEMENTS.filter(a => !a.isSecret).length}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {unlocked.slice(0, 5).map((achievement) => (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.1 }}
              className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0 border border-primary/20"
              title={achievement.name}
            >
              {achievement.icon}
            </motion.div>
          ))}
          {unlocked.length > 5 && (
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
              +{unlocked.length - 5}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          Achievement
          <Badge variant="secondary" className="ml-2">
            {unlocked.length}/{ACHIEVEMENTS.filter(a => !a.isSecret).length}
          </Badge>
        </h3>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
          className="flex-shrink-0"
        >
          Tutti
        </Button>
        {categories.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category)}
            className="flex-shrink-0 capitalize"
          >
            {category.replace('_', ' ')}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {displayedAchievements.map((achievement, idx) => {
            const isUnlocked = unlockedIds.has(achievement.id);
            const progress = isUnlocked ? 100 : getProgress(achievement);
            const unlockedData = unlockedAchievements.find(a => a.id === achievement.id);

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
                className={`relative p-4 rounded-xl border ${
                  isUnlocked
                    ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
                    : "bg-muted/30 border-muted"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      isUnlocked
                        ? "bg-primary/20"
                        : "bg-muted grayscale"
                    }`}
                  >
                    {isUnlocked ? achievement.icon : <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold truncate ${!isUnlocked && "text-muted-foreground"}`}>
                        {achievement.name}
                      </h4>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${RARITY_COLORS[achievement.rarity]}`}>
                        {RARITY_LABELS[achievement.rarity]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {achievement.description}
                    </p>

                    {/* Progress or Unlocked Date */}
                    {isUnlocked ? (
                      <p className="text-xs text-primary mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Sbloccato {unlockedData && new Date(unlockedData.unlockedAt).toLocaleDateString('it-IT')}
                      </p>
                    ) : (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progresso</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/50 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rewards */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-primary">+{achievement.xpReward} XP</p>
                    {achievement.tokenReward > 0 && (
                      <p className="text-xs text-gold">+{achievement.tokenReward} 💎</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More Button */}
      {(filteredUnlocked.length + filteredLocked.length) > 6 && (
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll ? "Mostra meno" : "Mostra tutti"}
          <ChevronRight className={`w-4 h-4 ml-2 transition-transform ${showAll ? "rotate-90" : ""}`} />
        </Button>
      )}

      {/* Secret Achievements Hint */}
      {ACHIEVEMENTS.some(a => a.isSecret && !unlockedIds.has(a.id)) && (
        <p className="text-xs text-center text-muted-foreground italic">
          🔮 Ci sono achievement segreti da scoprire...
        </p>
      )}
    </div>
  );
}
