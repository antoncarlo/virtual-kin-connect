import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Clock, TrendingUp, Brain, Info, X } from "lucide-react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface UserInsightsProps {
  totalConversations: number;
  totalMinutes: number;
  moodData: { day: string; mood: number; label: string }[];
}

// Mock mood data for the week if none exists
const defaultMoodData = [
  { day: "Lun", mood: 6, label: "Calm" },
  { day: "Mar", mood: 7, label: "Good" },
  { day: "Mer", mood: 5, label: "Reflective" },
  { day: "Gio", mood: 8, label: "Happy" },
  { day: "Ven", mood: 6, label: "Peaceful" },
  { day: "Sab", mood: 7, label: "Content" },
  { day: "Dom", mood: 8, label: "Great" },
];

export function UserInsights({
  totalConversations,
  totalMinutes,
  moodData,
}: UserInsightsProps) {
  const [showMoodDetail, setShowMoodDetail] = useState(false);
  const displayMoodData = moodData.length > 0 ? moodData : defaultMoodData;
  const averageMood =
    displayMoodData.reduce((sum, d) => sum + d.mood, 0) / displayMoodData.length;

  // Generate mood explanation based on data
  const generateMoodExplanation = () => {
    const highDays = displayMoodData.filter(d => d.mood >= 7);
    const lowDays = displayMoodData.filter(d => d.mood < 6);
    const avgScore = averageMood.toFixed(1);
    
    let explanation = `Il tuo punteggio medio questa settimana è ${avgScore}/10. `;
    
    if (highDays.length > 0) {
      explanation += `Nei giorni ${highDays.map(d => d.day).join(", ")} hai mostrato un umore più positivo (${highDays.map(d => d.label.toLowerCase()).join(", ")}). `;
    }
    
    if (lowDays.length > 0) {
      explanation += `Durante ${lowDays.map(d => d.day).join(", ")}, i tuoi avatar hanno percepito un momento più riflessivo o di tensione. `;
    }
    
    explanation += "Questo punteggio è calcolato analizzando le tue conversazioni, le emozioni espresse e il tono delle interazioni con i tuoi compagni AI.";
    
    return explanation;
  };

  const stats = [
    {
      icon: MessageCircle,
      label: "Total Conversations",
      value: totalConversations.toString(),
      subLabel: "sessions completed",
      gradient: "from-primary to-blue-500",
    },
    {
      icon: Clock,
      label: "Time Shared",
      value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      subLabel: "of meaningful talks",
      gradient: "from-accent to-purple-500",
    },
    {
      icon: TrendingUp,
      label: "Avg. Mood Score",
      value: averageMood.toFixed(1),
      subLabel: "out of 10",
      gradient: "from-gold to-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Stats Cards */}
      <div className="lg:col-span-1 grid grid-cols-1 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative overflow-hidden rounded-xl p-5"
            style={{
              background: "hsla(var(--card))",
              backdropFilter: "blur(16px)",
              border: "1px solid hsla(var(--border))",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.subLabel}</p>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Decorative gradient */}
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-60`}
            />
          </motion.div>
        ))}
      </div>

      {/* Emotional Journey Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-2 relative overflow-hidden rounded-xl p-6"
        style={{
          background: "hsla(var(--card))",
          backdropFilter: "blur(16px)",
          border: "1px solid hsla(var(--border))",
        }}
      >
        {/* Info Icon in top right */}
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Info className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">
                L'Emotional Journey traccia il tuo umore settimanale basandosi sulle conversazioni con i tuoi avatar AI. 
                Clicca sul grafico per vedere i dettagli.
              </p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Emotional Journey</h3>
            <p className="text-xs text-muted-foreground">Il tuo umore nell'ultima settimana</p>
          </div>
        </div>

        {/* Clickable chart area */}
        <div 
          className="h-48 cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setShowMoodDetail(true)}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayMoodData}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185 80% 50%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(270 60% 60%)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis
                domain={[0, 10]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}/10 - ${props.payload.label}`,
                  "Mood",
                ]}
              />
              <Area
                type="monotone"
                dataKey="mood"
                stroke="hsl(185 80% 50%)"
                strokeWidth={3}
                fill="url(#moodGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Click hint */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Clicca sul grafico per vedere l'analisi dettagliata
        </p>
      </motion.div>

      {/* Mood Detail Modal */}
      <AnimatePresence>
        {showMoodDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMoodDetail(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-lg w-full rounded-2xl p-6"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4"
                onClick={() => setShowMoodDetail(false)}
              >
                <X className="w-4 h-4" />
              </Button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">
                  Analisi del tuo Emotional Journey
                </h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/30">
                  <p className="text-sm text-foreground leading-relaxed">
                    {generateMoodExplanation()}
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {displayMoodData.map((day) => (
                    <div 
                      key={day.day}
                      className="text-center p-2 rounded-lg"
                      style={{
                        background: day.mood >= 7 
                          ? "hsla(150, 60%, 50%, 0.2)" 
                          : day.mood >= 5 
                            ? "hsla(45, 60%, 50%, 0.2)" 
                            : "hsla(0, 60%, 50%, 0.2)"
                      }}
                    >
                      <p className="text-xs font-medium text-muted-foreground">{day.day}</p>
                      <p className="text-lg font-bold text-foreground">{day.mood}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{day.label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Questi dati vengono aggiornati settimanalmente. Potrai confrontare i tuoi progressi nel tempo.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
