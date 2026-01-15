import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, Star, Coins, Phone, Video, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";

const plans = [
  {
    name: "Starter",
    avatars: 1,
    price: 49,
    icon: Sparkles,
    popular: false,
    features: [
      "1 AI companion avatar",
      "Unlimited chat messages",
      "Voice calls included",
      "Conversation memory",
      "24/7 availability",
    ],
  },
  {
    name: "Plus",
    avatars: 2,
    price: 69,
    icon: Star,
    popular: true,
    features: [
      "2 AI companion avatars",
      "Unlimited chat messages",
      "Voice calls included",
      "Conversation memory",
      "Priority support",
      "Video calls (Coming Soon)",
    ],
  },
  {
    name: "Premium",
    avatars: 3,
    price: 110,
    icon: Crown,
    popular: false,
    features: [
      "3 AI companion avatars",
      "Unlimited chat messages",
      "Voice calls included",
      "Conversation memory",
      "Priority support",
      "Video calls (Coming Soon)",
      "Early access to new avatars",
    ],
  },
];

const tokenPackages = [
  { tokens: 100, price: 10, bonus: "", popular: false, minutes: "~15 min" },
  { tokens: 250, price: 20, bonus: "+25 bonus", popular: false, minutes: "~40 min" },
  { tokens: 500, price: 35, bonus: "+75 bonus", popular: true, minutes: "~90 min" },
  { tokens: 1000, price: 60, bonus: "+200 bonus", popular: false, minutes: "~180 min" },
];

export function PricingSection() {
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);

  return (
    <section id="pricing" className="py-24 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Crown className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-foreground/80">Flexible Plans</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Choose Your <span className="text-gradient">Plan</span>
          </h2>
          <p className="text-muted-foreground">
            Start your journey with a companion who truly understands you
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-medium">
                    🔥 Most Popular
                  </div>
                </div>
              )}
              
              <div className={`relative h-full rounded-2xl p-6 ${
                plan.popular 
                  ? "glass border-2 border-primary/30 shadow-xl" 
                  : "bg-card border border-border/50 hover:border-primary/20"
              }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.popular ? "gradient-primary" : "bg-secondary"
                }`}>
                  <plan.icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`} />
                </div>

                <h3 className="text-xl font-display font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.avatars} AI avatar{plan.avatars > 1 ? 's' : ''} included
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-display font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  size="lg"
                  className={`w-full ${plan.popular ? "gradient-primary" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/signup">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* TOKEN SECTION */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="flex-1 h-px bg-border" />
            <Coins className="w-5 h-5 text-gold" />
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
              <Zap className="w-4 h-4 text-gold" />
              <span className="font-medium">Call Tokens</span>
              <Gift className="w-4 h-4 text-accent" />
            </div>
            
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Top Up Your <span className="text-gradient">Tokens</span>
            </h3>
            
            <p className="text-muted-foreground max-w-xl mx-auto mb-4">
              Tokens let you make <span className="text-primary font-medium">voice calls</span> and{" "}
              <span className="text-accent font-medium">video calls</span> with your AI companion.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> HD Voice
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Real-time Video
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Never Expire
              </span>
            </div>
          </motion.div>

          {/* Token Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tokenPackages.map((pkg, index) => (
              <motion.div
                key={pkg.tokens}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredToken(index)}
                onMouseLeave={() => setHoveredToken(null)}
                whileHover={{ y: -4 }}
                className="relative group"
              >
                {pkg.popular && (
                  <div className="absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full bg-gold text-background text-xs font-bold">
                    BEST
                  </div>
                )}
                
                <div className={`rounded-xl p-4 text-center transition-all ${
                  pkg.popular 
                    ? "glass border-2 border-gold/30" 
                    : "bg-card border border-border/50 hover:border-primary/30"
                }`}>
                  <motion.div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                      pkg.popular 
                        ? "bg-gradient-to-br from-gold to-accent" 
                        : "bg-primary/10"
                    }`}
                    animate={hoveredToken === index ? { rotate: 360 } : {}}
                    transition={{ duration: 0.5 }}
                  >
                    <Zap className={`w-5 h-5 ${pkg.popular ? "text-background" : "text-primary"}`} />
                  </motion.div>
                  
                  <div className="text-2xl font-display font-bold">{pkg.tokens}</div>
                  <div className="text-xs text-muted-foreground mb-1">tokens</div>
                  
                  {pkg.bonus && (
                    <div className="inline-block px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-bold mb-2">
                      🎁 {pkg.bonus}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground mb-2">{pkg.minutes} calls</div>
                  
                  <div className={`text-xl font-bold ${pkg.popular ? "text-gold" : ""}`}>
                    ${pkg.price}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground flex flex-wrap justify-center gap-4">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> Never expire
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> Buy anytime
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-primary" /> Secure payment
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
