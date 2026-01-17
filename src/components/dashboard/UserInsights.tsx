import { motion } from "framer-motion";
import { MessageCircle, Clock, TrendingUp, Brain } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

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
  const displayMoodData = moodData.length > 0 ? moodData : defaultMoodData;
  const averageMood =
    displayMoodData.reduce((sum, d) => sum + d.mood, 0) / displayMoodData.length;

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
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Emotional Journey</h3>
            <p className="text-xs text-muted-foreground">Your mood over the last week</p>
          </div>
        </div>

        <div className="h-48">
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
      </motion.div>
    </div>
  );
}
