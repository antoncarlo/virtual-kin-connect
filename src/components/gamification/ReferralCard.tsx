/**
 * Referral Card Component
 * Shows referral code, stats, and sharing options
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Copy,
  Check,
  Share2,
  Users,
  Gift,
  TrendingUp,
  Twitter,
  MessageCircle,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface ReferralCardProps {
  code: string;
  totalReferrals: number;
  convertedReferrals: number;
  totalEarned: number;
  currentTier: {
    minReferrals: number;
    tokensPerReferral: number;
    bonusMultiplier: number;
  };
  nextTier?: {
    minReferrals: number;
    tokensPerReferral: number;
    bonusMultiplier: number;
  };
}

export function ReferralCard({
  code,
  totalReferrals,
  convertedReferrals,
  totalEarned,
  currentTier,
  nextTier,
}: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const { toast } = useToast();

  const referralLink = `https://kindred.ai/signup?ref=${code}`;
  const shareText = `Unisciti a me su Kindred AI, il tuo compagno AI personale! Usa il mio codice ${code} per ottenere bonus token. 🎁`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "Codice copiato!",
        description: `Il codice ${code} è stato copiato negli appunti.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Errore",
        description: "Non è stato possibile copiare il codice.",
        variant: "destructive",
      });
    }
  };

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + referralLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`,
      email: `mailto:?subject=${encodeURIComponent("Ti invito su Kindred AI!")}&body=${encodeURIComponent(shareText + "\n\n" + referralLink)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank');
    }
    setShowShareOptions(false);
  };

  // Progress to next tier
  const progressToNextTier = nextTier
    ? Math.min(100, (convertedReferrals / nextTier.minReferrals) * 100)
    : 100;

  return (
    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-2xl p-5 border border-primary/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Gift className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold">Invita Amici</h3>
            <p className="text-xs text-muted-foreground">Guadagna token per ogni invito</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
          {currentTier.tokensPerReferral} 💎/invito
        </Badge>
      </div>

      {/* Referral Code */}
      <div className="bg-background/50 rounded-xl p-4 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Il tuo codice referral:</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-2xl font-mono font-bold tracking-wider text-primary">
            {code}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            className="flex-shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={() => setShowShareOptions(!showShareOptions)}
            className="flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Share Options */}
        <AnimatePresence>
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border/50"
            >
              <p className="text-xs text-muted-foreground mb-2">Condividi su:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('twitter')}
                  className="flex-1"
                >
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('whatsapp')}
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare('email')}
                  className="flex-1"
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-background/30">
          <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xl font-bold">{totalReferrals}</p>
          <p className="text-[10px] text-muted-foreground">Invitati</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-background/30">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
          <p className="text-xl font-bold text-green-500">{convertedReferrals}</p>
          <p className="text-[10px] text-muted-foreground">Attivi</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-background/30">
          <Gift className="w-4 h-4 mx-auto mb-1 text-gold" />
          <p className="text-xl font-bold text-gold">{totalEarned}</p>
          <p className="text-[10px] text-muted-foreground">Guadagnati 💎</p>
        </div>
      </div>

      {/* Tier Progress */}
      {nextTier && (
        <div className="bg-background/30 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Prossimo livello: {nextTier.tokensPerReferral} 💎/invito
            </span>
            <span className="text-xs font-medium">
              {convertedReferrals}/{nextTier.minReferrals}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNextTier}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <ChevronRight className="w-3 h-3" />
            Bonus ×{nextTier.bonusMultiplier} al prossimo livello
          </p>
        </div>
      )}

      {/* Max Tier */}
      {!nextTier && (
        <div className="text-center text-sm text-gold">
          🌟 Hai raggiunto il livello massimo! 🌟
        </div>
      )}
    </div>
  );
}
