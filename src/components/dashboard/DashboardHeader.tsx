import { motion } from "framer-motion";
import { Sparkles, Sun, Moon, Sunrise, Cloud } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface DashboardHeaderProps {
  user: User | null;
  displayName: string;
}

const inspirationalQuotes = [
  "Ogni giorno è una nuova opportunità per crescere.",
  "La gentilezza verso te stesso è il primo passo verso la felicità.",
  "Respira profondamente. Sei esattamente dove devi essere.",
  "I piccoli progressi ogni giorno portano a grandi risultati.",
  "La tua storia non è finita. Questo è solo un nuovo capitolo.",
  "Sii paziente con te stesso. La crescita richiede tempo.",
  "Oggi è un buon giorno per essere gentile con te stesso.",
  "Non devi essere perfetto, devi solo essere presente.",
];

function getTimeOfDay(): { greeting: string; icon: typeof Sun; period: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: "Good morning", icon: Sunrise, period: "morning" };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: "Good afternoon", icon: Sun, period: "afternoon" };
  } else if (hour >= 17 && hour < 21) {
    return { greeting: "Good evening", icon: Cloud, period: "evening" };
  } else {
    return { greeting: "Good night", icon: Moon, period: "night" };
  }
}

function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  return inspirationalQuotes[dayOfYear % inspirationalQuotes.length];
}

export function DashboardHeader({ user, displayName }: DashboardHeaderProps) {
  const { greeting, icon: TimeIcon, period } = getTimeOfDay();
  const dailyQuote = getDailyQuote();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-6 md:p-8 mb-8"
      style={{
        background: `linear-gradient(135deg, 
          hsla(225, 30%, 15%, 0.95) 0%, 
          hsla(260, 40%, 20%, 0.9) 50%, 
          hsla(280, 50%, 25%, 0.85) 100%)`,
      }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/15 to-primary/15 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-gold/10 rounded-full blur-xl" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
              <TimeIcon className="w-6 h-6 text-gold" />
            </div>
            <span className="text-white/70 text-sm font-medium">{greeting}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-display font-bold text-white mb-3"
          >
            {displayName}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-2 max-w-md"
          >
            <Sparkles className="w-4 h-4 text-gold mt-1 flex-shrink-0" />
            <p className="text-white/80 text-sm italic leading-relaxed">
              "{dailyQuote}"
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="hidden md:flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
        >
          <div className="text-center">
            <p className="text-xs text-white/60 uppercase tracking-wider">Marco says</p>
            <p className="text-sm text-white/90 font-medium mt-1">I'm here for you today</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
