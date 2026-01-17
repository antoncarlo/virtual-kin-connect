import { motion } from "framer-motion";
import { Crown, Zap, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SubscriptionWidgetProps {
  plan: string;
  trialDaysRemaining: number | null;
  tokensBalance: number;
  onUpgrade: () => void;
}

export function SubscriptionWidget({
  plan,
  trialDaysRemaining,
  tokensBalance,
  onUpgrade,
}: SubscriptionWidgetProps) {
  const isFreeTrial = plan === "Free" || plan === "trial";
  const totalTrialDays = 7;
  const daysUsed = trialDaysRemaining !== null ? totalTrialDays - trialDaysRemaining : 0;
  const progressPercent = trialDaysRemaining !== null 
    ? ((totalTrialDays - trialDaysRemaining) / totalTrialDays) * 100 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="relative overflow-hidden rounded-xl p-6 mb-8"
      style={{
        background: isFreeTrial
          ? `linear-gradient(135deg, 
              hsla(225, 30%, 15%, 0.95) 0%, 
              hsla(45, 80%, 35%, 0.3) 50%, 
              hsla(280, 50%, 25%, 0.9) 100%)`
          : "hsla(var(--card))",
        border: "1px solid hsla(var(--border))",
      }}
    >
      {/* Decorative elements */}
      {isFreeTrial && (
        <>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-gradient-to-tr from-accent/15 to-transparent rounded-full blur-2xl" />
        </>
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Plan Info */}
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl ${
              isFreeTrial
                ? "bg-gradient-to-br from-gold/30 to-amber-600/30"
                : "bg-gradient-to-br from-primary/20 to-accent/20"
            }`}
          >
            <Crown className={`w-6 h-6 ${isFreeTrial ? "text-gold" : "text-primary"}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-semibold ${isFreeTrial ? "text-white" : "text-foreground"}`}>
                {isFreeTrial ? "Free Trial" : plan}
              </h3>
              {isFreeTrial && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gold/20 text-gold">
                  Active
                </span>
              )}
            </div>

            {isFreeTrial && trialDaysRemaining !== null && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-white/70">
                    {trialDaysRemaining} days remaining
                  </span>
                  <span className="text-xs text-white/50">
                    Day {daysUsed} of {totalTrialDays}
                  </span>
                </div>
                <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full"
                  />
                </div>
              </div>
            )}

            {!isFreeTrial && (
              <p className="text-sm text-muted-foreground">
                Enjoy unlimited conversations with your AI companions
              </p>
            )}
          </div>
        </div>

        {/* Token Balance & Upgrade */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Zap className="w-4 h-4 text-gold" />
              <span className={`text-2xl font-bold ${isFreeTrial ? "text-white" : "text-foreground"}`}>
                {tokensBalance}
              </span>
            </div>
            <p className={`text-xs ${isFreeTrial ? "text-white/60" : "text-muted-foreground"}`}>
              tokens available
            </p>
          </div>

          {isFreeTrial && (
            <Button
              onClick={onUpgrade}
              className="relative overflow-hidden group px-6 py-6 rounded-xl font-semibold text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg, hsl(45 90% 50%) 0%, hsl(35 95% 45%) 100%)",
              }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gold/0 via-white/30 to-gold/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              <span className="relative flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Upgrade to Pro
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
