import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  "Unlimited AI chat with all avatars",
  "Voice calls with realistic AI voices",
  "Conversation memory & history",
  "Emotional intelligence responses",
  "24/7 availability",
  "Priority support",
  "Video calls (Coming Soon)",
  "New avatar releases",
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative">
      {/* Background effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[150px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Simple <span className="text-gradient">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            One plan, unlimited connections. No hidden fees.
          </p>
        </motion.div>

        {/* Pricing Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-md mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 gradient-primary rounded-2xl blur-lg opacity-50" />
            
            <div className="relative glass border border-primary/30 rounded-2xl p-8 text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Most Popular</span>
              </div>

              {/* Price */}
              <div className="mb-6">
                <span className="text-5xl font-display font-bold text-foreground">$20</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-8">
                Unlimited access to all features and avatars
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8 text-left">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                size="lg"
                className="w-full gradient-primary glow-primary text-lg py-6"
                asChild
              >
                <Link to="/signup">Start Your Journey</Link>
              </Button>

              <p className="text-xs text-muted-foreground mt-4">
                Cancel anytime. No commitment required.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
