import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Sparkles, Calendar, Receipt, ExternalLink, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { TokenPurchaseModal } from "@/components/TokenPurchaseModal";

interface BillingSettingsProps {
  profile: any;
  onUpgrade: () => void;
}

export function BillingSettings({ profile, onUpgrade }: BillingSettingsProps) {
  const plan = profile?.subscription_tier || "Free";
  const tokensBalance = profile?.tokens_balance || 0;
  const trialEndsAt = profile?.trial_ends_at;
  const hasStripeCustomer = !!profile?.stripe_customer_id;
  
  const [showTokenModal, setShowTokenModal] = useState(false);
  const { openPortal, isLoading } = useStripeCheckout();
  
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleManageBilling = () => {
    if (hasStripeCustomer) {
      openPortal();
    } else {
      onUpgrade();
    }
  };

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
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowTokenModal(true)}
              className="gap-2"
            >
              <Coins className="w-4 h-4" /> Buy Tokens
            </Button>
            <Button 
              className="gradient-primary" 
              onClick={handleManageBilling}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : plan === "Free" || plan === "trial" ? "Upgrade" : "Manage Billing"}
            </Button>
          </div>
        </div>

        {(plan === "Free" || plan === "trial") && (
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Upgrade to Essential or Premium</strong> to unlock voice calls, 
              video calls, priority support, and more!
            </p>
          </div>
        )}
      </div>

      {/* Token Balance */}
      <div className="glass border-gradient rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Coins className="w-5 h-5 text-gold" /> Token Balance
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{tokensBalance}</div>
            <p className="text-sm text-muted-foreground">
              tokens = {tokensBalance} minutes of calls
            </p>
          </div>
          <Button 
            onClick={() => setShowTokenModal(true)}
            className="bg-gradient-to-r from-gold to-amber-500 text-background hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" /> Buy More
          </Button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-secondary/30 text-sm text-muted-foreground">
          💡 1 token = 1 minute of voice or video call. Tokens never expire!
        </div>
      </div>

      {/* Payment Methods - Link to Stripe Portal */}
      <div className="glass border-gradient rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" /> Payment Methods
        </h3>

        <div className="text-center py-6">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            {hasStripeCustomer 
              ? "Manage your payment methods in the billing portal"
              : "Make your first purchase to add a payment method"
            }
          </p>
          {hasStripeCustomer && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => openPortal()}
              disabled={isLoading}
            >
              <ExternalLink className="w-4 h-4" /> Open Billing Portal
            </Button>
          )}
        </div>
      </div>

      {/* Billing History */}
      <div className="glass border-gradient rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5" /> Billing History
        </h3>

        <div className="text-center py-6">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {hasStripeCustomer
              ? "View your billing history in the billing portal"
              : "No billing history available"
            }
          </p>
          {hasStripeCustomer && (
            <Button 
              variant="link" 
              className="mt-2 gap-2"
              onClick={() => openPortal()}
              disabled={isLoading}
            >
              <ExternalLink className="w-4 h-4" /> View Invoices
            </Button>
          )}
        </div>
      </div>

      {/* Token Purchase Modal */}
      <TokenPurchaseModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        currentBalance={tokensBalance}
      />
    </motion.div>
  );
}
