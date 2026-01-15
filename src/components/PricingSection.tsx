import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, Star, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
  { tokens: 100, price: 10, bonus: "" },
  { tokens: 250, price: 20, bonus: "+25 bonus" },
  { tokens: 500, price: 35, bonus: "+75 bonus" },
  { tokens: 1000, price: 60, bonus: "+200 bonus" },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Choose Your <span className="text-gradient">Plan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Select the perfect plan for your companion journey
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className={`relative h-full rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] ${
                plan.popular 
                  ? "glass border-2 border-primary/30 shadow-xl shadow-primary/10" 
                  : "bg-card border border-border/50"
              }`}>
                {/* Plan Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.popular ? "gradient-primary" : "bg-secondary"
                }`}>
                  <plan.icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`} />
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-display font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.avatars} {plan.avatars === 1 ? "avatar" : "avatars"} included
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? "gradient-primary" : "bg-primary/10"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  size="lg"
                  className={`w-full ${plan.popular ? "gradient-primary glow-primary" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Token Packages Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent mb-4">
              <Coins className="w-4 h-4" />
              <span className="text-sm font-medium">Call Tokens</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-display font-bold mb-3">
              Purchase Tokens for Calls
            </h3>
            <p className="text-muted-foreground">
              Use tokens for voice calls and video calls with your AI companions
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tokenPackages.map((pkg, index) => (
              <motion.div
                key={pkg.tokens}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <div className="bg-card border border-border/50 rounded-xl p-5 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-2xl font-display font-bold mb-1">
                    {pkg.tokens}
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">tokens</div>
                  {pkg.bonus && (
                    <div className="text-xs text-accent font-medium mb-2">
                      {pkg.bonus}
                    </div>
                  )}
                  <div className="text-lg font-semibold text-foreground">
                    ${pkg.price}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Tokens never expire • Use for voice & video calls • Buy anytime
          </p>
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-16"
        >
          All plans include a 7-day free trial. Cancel anytime, no commitment required.
        </motion.p>
      </div>
    </section>
  );
}
