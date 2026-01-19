import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const plans = [
  {
    id: "essential",
    name: "Essential",
    avatars: 1,
    price: 29,
    icon: Star,
    popular: true,
    features: [
      "1 AI companion avatar",
      "Unlimited chat messages",
      "Voice calls up to 10 min/day",
      "Conversation memory",
      "Priority support",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "premium",
    name: "Premium",
    avatars: 6,
    price: 49,
    icon: Crown,
    popular: false,
    features: [
      "All 6 AI companions",
      "Unlimited chat messages",
      "Voice & video calls",
      "Conversation memory",
      "Priority support",
      "Early access to new features",
    ],
    gradient: "from-gold to-amber-500",
  },
];

export function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan = "free",
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const { checkout, isLoading } = useStripeCheckout();

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    await checkout({ type: "subscription", planId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-gradient max-w-2xl p-0 overflow-hidden z-[100]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-display text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            {currentPlan.toLowerCase() !== "free" && currentPlan.toLowerCase() !== "trial" 
              ? `You're on ${currentPlan}. Upgrade to unlock more!`
              : "Unlock the full potential of MOMO"}
          </p>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan.toLowerCase() === plan.id;
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                className={`relative rounded-xl p-5 border-2 transition-all cursor-pointer ${
                  isCurrentPlan
                    ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/30"
                    : plan.popular
                    ? "border-primary bg-primary/5"
                    : isSelected
                    ? "border-primary/50"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => !isCurrentPlan && !isLoading && setSelectedPlan(plan.id)}
              >
                {isCurrentPlan && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white">
                    Current Plan
                  </Badge>
                )}
                {!isCurrentPlan && plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}

                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mx-auto mb-4`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-center mb-1">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  {plan.avatars} AI avatar{plan.avatars > 1 ? 's' : ''} included
                </p>

                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.popular ? "gradient-primary" : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                  disabled={isCurrentPlan || isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : isLoading && isSelected
                    ? "Redirecting..."
                    : "Subscribe"}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 bg-secondary/30 text-center text-sm text-muted-foreground">
          All plans include a 7-day free trial. Cancel anytime.
        </div>
      </DialogContent>
    </Dialog>
  );
}
