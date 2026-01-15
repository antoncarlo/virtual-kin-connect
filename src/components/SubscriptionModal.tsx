import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Sparkles, Zap, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: 9.99,
    period: "mese",
    features: [
      "1 avatar",
      "Chat illimitate",
      "50 minuti chiamate/mese",
      "Supporto email",
    ],
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500",
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19.99,
    period: "mese",
    features: [
      "3 avatar",
      "Chat illimitate",
      "200 minuti chiamate/mese",
      "Videochiamate",
      "Priorità supporto",
    ],
    icon: Sparkles,
    gradient: "from-purple-500 to-pink-500",
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: 49.99,
    period: "mese",
    features: [
      "6 avatar",
      "Chat illimitate",
      "Chiamate illimitate",
      "Videochiamate HD",
      "Avatar personalizzati",
      "Supporto prioritario 24/7",
    ],
    icon: Crown,
    gradient: "from-gold to-amber-500",
    popular: false,
  },
];

export function SubscriptionModal({
  isOpen,
  onClose,
  currentPlan = "free",
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    setSelectedPlan(planId);
    setIsProcessing(true);

    // Simulate processing - replace with actual Stripe checkout
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Pagamenti in arrivo! 🚀",
        description: "I pagamenti saranno disponibili presto. Ti avviseremo!",
      });
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-gradient max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-display text-center">
            Scegli il tuo piano
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Sblocca tutto il potenziale di Kindred
          </p>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan.toLowerCase() === plan.id;
            const isSelected = selectedPlan === plan.id;

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -4 }}
                className={`relative rounded-xl p-5 border-2 transition-all cursor-pointer ${
                  plan.popular
                    ? "border-primary bg-primary/5"
                    : isSelected
                    ? "border-primary/50"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => !isCurrentPlan && setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                    Più popolare
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

                <div className="text-center mb-4">
                  <span className="text-3xl font-bold">€{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
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
                  disabled={isCurrentPlan || isProcessing}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectPlan(plan.id);
                  }}
                >
                  {isCurrentPlan
                    ? "Piano attuale"
                    : isProcessing && isSelected
                    ? "Elaborazione..."
                    : "Scegli"}
                </Button>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 bg-secondary/30 text-center text-sm text-muted-foreground">
          Tutti i piani includono 7 giorni di prova gratuita. Cancella quando vuoi.
        </div>
      </DialogContent>
    </Dialog>
  );
}
