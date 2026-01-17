import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Sparkles, Calendar, Receipt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface BillingSettingsProps {
  profile: any;
  onUpgrade: () => void;
}

export function BillingSettings({ profile, onUpgrade }: BillingSettingsProps) {
  const plan = profile?.subscription_tier || "Free";
  const tokensBalance = profile?.tokens_balance || 0;
  const trialEndsAt = profile?.trial_ends_at;
  
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Mock payment methods (in production, these would come from Stripe)
  const [paymentMethods] = useState<any[]>([]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="space-y-6"
    >
      {/* Current Plan */}
      <div className="glass border-gradient rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> Current Plan
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary/20 text-primary">
                <Sparkles className="w-3 h-3 mr-1" /> {plan}
              </Badge>
              {trialDaysRemaining > 0 && (
                <Badge variant="outline" className="text-gold border-gold">
                  {trialDaysRemaining} days trial left
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tokensBalance} tokens available
            </p>
          </div>
          <Button className="gradient-primary" onClick={onUpgrade}>
            {plan === "Free" ? "Upgrade to Premium" : "Manage Plan"}
          </Button>
        </div>

        {plan === "Free" && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Upgrade to Premium</strong> to unlock unlimited conversations, 
              shared memories, priority support, and more!
            </p>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="glass border-gradient rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Payment Methods
        </h3>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-6">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              No payment methods added yet
            </p>
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Add Payment Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">•••• {method.last4}</p>
                    <p className="text-xs text-muted-foreground">Expires {method.expiry}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-2 w-full">
              <Plus className="w-4 h-4" /> Add New Card
            </Button>
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="glass border-gradient rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5" /> Billing History
        </h3>

        <div className="text-center py-6">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No billing history available
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your invoices and receipts will appear here
          </p>
        </div>
      </div>
    </motion.div>
  );
}
