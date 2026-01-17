import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Quote, Target, CheckCircle, Sparkles, Info, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Goal {
  id: string;
  goal_description: string;
  goal_category: string | null;
  status: string;
  progress_notes: unknown;
  created_at: string;
  avatar_id: string;
}

interface GoalsProgressProps {
  lastAdvice: string | null;
  userId?: string;
}

const defaultAdvice =
  "Ricorda: ogni piccolo passo avanti è una vittoria. Non devi fare tutto oggi, ma puoi fare qualcosa oggi.";

export function GoalsProgress({ lastAdvice, userId }: GoalsProgressProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const displayAdvice = lastAdvice || defaultAdvice;

  useEffect(() => {
    if (userId) {
      fetchGoals();
    }
  }, [userId]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("temporal_goals")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "paused"])
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("Error fetching goals:", error);
        return;
      }

      setGoals(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (goal: Goal): number => {
    const notes = Array.isArray(goal.progress_notes) ? goal.progress_notes : [];
    if (notes.length === 0) return 10;
    return Math.min(90, 10 + notes.length * 20);
  };

  const getCategoryEmoji = (category: string | null): string => {
    const emojiMap: Record<string, string> = {
      health: "🏃",
      wellness: "🧘",
      habits: "🔄",
      mindfulness: "🧠",
      relationships: "❤️",
      career: "💼",
      learning: "📚",
      fitness: "💪",
    };
    return emojiMap[category?.toLowerCase() || ""] || "🎯";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Last Advice Card */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-xl p-6"
        style={{
          background: `linear-gradient(135deg, 
            hsla(225, 30%, 15%, 0.9) 0%, 
            hsla(260, 35%, 18%, 0.85) 100%)`,
          border: "1px solid hsla(260, 40%, 40%, 0.2)",
        }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 backdrop-blur-sm">
              <Quote className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Last Advice</h3>
              <p className="text-xs text-white/60">From your recent conversations</p>
            </div>
          </div>

          <blockquote className="text-white/90 text-sm leading-relaxed italic border-l-2 border-primary/50 pl-4">
            "{displayAdvice}"
          </blockquote>

          <div className="mt-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-xs text-white/50">Your companions are tracking your journey</span>
          </div>
        </div>
      </motion.div>

      {/* Goals in Progress Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="relative overflow-hidden rounded-xl p-6"
        style={{
          background: "hsla(var(--card))",
          backdropFilter: "blur(16px)",
          border: "1px solid hsla(var(--border))",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gold/20 to-orange-500/20">
              <Target className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Goals in Progress</h3>
              <p className="text-xs text-muted-foreground">Tracked across all conversations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[250px]">
                  <p className="text-sm">
                    I tuoi obiettivi vengono rilevati automaticamente dalle conversazioni con tutti gli avatar.
                    Quando raggiungi un obiettivo, ricevi <span className="font-bold text-gold">+5 crediti</span> bonus! 🎉
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="secondary" className="text-xs">
              {goals.length} active
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : goals.length > 0 ? (
            goals.slice(0, 3).map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="mt-0.5 text-lg">
                  {goal.status === "completed" ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <span>{getCategoryEmoji(goal.goal_category)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {goal.goal_description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {goal.goal_category && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {goal.goal_category}
                      </Badge>
                    )}
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                        style={{ width: `${calculateProgress(goal)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No goals set yet</p>
              <p className="text-xs mt-1">
                Tell your avatar what you want to achieve and they'll help you track it
              </p>
            </div>
          )}
        </div>

        {goals.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-gold/10 to-orange-500/10 border border-gold/20">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gold" />
              <span className="text-xs text-muted-foreground">
                Complete a goal to earn <span className="font-bold text-gold">+5 credits</span>!
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
