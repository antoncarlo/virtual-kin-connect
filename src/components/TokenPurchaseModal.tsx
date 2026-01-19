import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, Zap, Check, X, Phone, Video } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

const tokenPackages = [
  { id: "tokens_5", tokens: 5, price: 2, bonus: 0, minutes: "5 min" },
  { id: "tokens_15", tokens: 15, price: 5, bonus: 1, minutes: "16 min" },
  { id: "tokens_30", tokens: 30, price: 10, bonus: 2, minutes: "32 min", popular: true },
  { id: "tokens_60", tokens: 60, price: 20, bonus: 5, minutes: "65 min" },
];

export function TokenPurchaseModal({
  isOpen,
  onClose,
  currentBalance,
}: TokenPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { checkout, isLoading } = useStripeCheckout();

  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    await checkout({ type: "tokens", planId: packageId });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-gradient max-w-lg p-0 overflow-hidden z-[100]">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gold/30 to-amber-500/30">
              <Coins className="w-6 h-6 text-gold" />
            </div>
            <DialogTitle className="text-2xl font-display">
              Buy Tokens
            </DialogTitle>
          </div>
          <p className="text-center text-muted-foreground">
            1 token = 1 minute of voice or video call
          </p>
          <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Voice Calls
            </span>
            <span className="flex items-center gap-1.5">
              <Video className="w-4 h-4" /> Video Calls
            </span>
          </div>
        </DialogHeader>

        <div className="px-6 pb-2">
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/50">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-sm">Current balance:</span>
            <span className="font-bold text-lg">{currentBalance}</span>
            <span className="text-sm text-muted-foreground">tokens</span>
          </div>
        </div>

        <div className="p-6 pt-4 grid grid-cols-2 gap-3">
          {tokenPackages.map((pkg) => {
            const isSelected = selectedPackage === pkg.id;
            const totalTokens = pkg.tokens + pkg.bonus;

            return (
              <motion.div
                key={pkg.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  pkg.popular
                    ? "border-gold bg-gold/5"
                    : isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                onClick={() => !isLoading && handlePurchase(pkg.id)}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gold text-background text-xs">
                    Best Value
                  </Badge>
                )}

                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">
                    {pkg.tokens}
                    {pkg.bonus > 0 && (
                      <span className="text-lg text-accent">+{pkg.bonus}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    tokens
                  </div>

                  {pkg.bonus > 0 && (
                    <div className="inline-block px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium mb-2">
                      🎁 +{pkg.bonus} bonus
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mb-3">
                    {pkg.minutes} of calls
                  </div>

                  <div className={`text-xl font-bold ${pkg.popular ? "text-gold" : ""}`}>
                    €{pkg.price}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    €{(pkg.price / totalTokens).toFixed(2)}/min
                  </div>
                </div>

                {isLoading && isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 bg-secondary/30 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-primary" /> Tokens never expire
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-primary" /> Secure payment
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-primary" /> Instant delivery
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
