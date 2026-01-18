/**
 * Daily Challenges Component
 * Shows daily and weekly challenges with progress tracking
 */

import { motion } from "framer-motion";
import { Target, Clock, CheckCircle2, Gift, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Challenge } from "@/lib/gamification";

interface DailyChallengesProps {
  challenges: Challenge[];
  onChallengeClick?: (challengeId: string) => void;
}

export function DailyChallenges({ challenges, onChallengeClick }: DailyChallengesProps) {
  // Separate by type
  const dailyChallenges = challenges.filter(c => c.type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.type === 'weekly');

  // Calculate time remaining
  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();

    if (diff <= 0) return "Scaduta";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days}g ${hours % 24}h`;
    }

    return `${hours}h ${minutes}m`;
  };

  const ChallengeCard = ({ challenge }: { challenge: Challenge }) => {
    const isCompleted = !!challenge.completedAt;
    const progress = challenge.requirement.current
      ? Math.min(100, (challenge.requirement.current / challenge.requirement.target) * 100)
      : 0;

    return (
      <motion.div
        whileHover={{ scale: isCompleted ? 1 : 1.02 }}
        whileTap={{ scale: isCompleted ? 1 : 0.98 }}
        onClick={() => !isCompleted && onChallengeClick?.(challenge.id)}
        className={`relative p-4 rounded-xl border transition-all cursor-pointer ${
          isCompleted
            ? "bg-green-500/10 border-green-500/30"
            : "bg-card hover:bg-accent/50 border-border"
        }`}
      >
        {/* Completed Overlay */}
        {isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500/5 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        )}

        <div className={isCompleted ? "opacity-50" : ""}>
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                challenge.type === 'weekly'
                  ? "bg-purple-500/20 text-purple-500"
                  : "bg-primary/20 text-primary"
              }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{challenge.name}</h4>
                <Badge variant="outline" className="text-[10px] mt-0.5">
                  {challenge.type === 'weekly' ? 'Settimanale' : 'Giornaliera'}
                </Badge>
              </div>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {getTimeRemaining(challenge.expiresAt)}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground mb-3">
            {challenge.description}
          </p>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {challenge.requirement.current || 0} / {challenge.requirement.target}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Rewards */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1 text-xs">
              <Zap className="w-3 h-3 text-primary" />
              <span className="font-medium text-primary">+{challenge.xpReward} XP</span>
            </div>
            {challenge.tokenReward > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Gift className="w-3 h-3 text-gold" />
                <span className="font-medium text-gold">+{challenge.tokenReward} 💎</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Daily Challenges */}
      {dailyChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Sfide Giornaliere
          </h3>
          <div className="grid gap-3">
            {dailyChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Challenges */}
      {weeklyChallenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            Sfide Settimanali
          </h3>
          <div className="grid gap-3">
            {weeklyChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {challenges.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nessuna sfida attiva</p>
          <p className="text-xs mt-1">Torna domani per nuove sfide!</p>
        </div>
      )}
    </div>
  );
}
