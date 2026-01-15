import { motion, useScroll, useTransform } from "framer-motion";
import { Check, Sparkles, Zap, Crown, Star, Coins, Phone, Video, ArrowRight, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

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
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredToken, setHoveredToken] = useState<number | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  return (
    <section id="pricing" ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Parallax background effects */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[200px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[200px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Floating geometric shapes */}
      <motion.div 
        className="absolute top-40 right-20 w-32 h-32 border border-primary/20 rounded-2xl rotate-12"
        animate={{ rotate: [12, -12, 12], y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-40 left-20 w-24 h-24 border border-accent/20 rotate-45"
        animate={{ rotate: [45, 90, 45], y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <Crown className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-foreground/80">Piani Flessibili</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
            Scegli il Tuo <span className="text-gradient">Piano</span>
          </h2>
          <p className="text-muted-foreground">
            Inizia il tuo viaggio con un compagno che ti capisce davvero
          </p>
        </motion.div>

        {/* Pricing Cards with parallax */}
        <motion.div 
          style={{ scale }}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-24"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              {/* Glow effect */}
              {plan.popular && (
                <motion.div 
                  className="absolute -inset-1 bg-gradient-to-r from-primary/40 via-accent/40 to-primary/40 rounded-3xl blur-xl"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
              
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.3 }}
                >
                  <div className="px-4 py-1.5 rounded-full gradient-primary text-primary-foreground text-sm font-medium shadow-lg">
                    🔥 Più Popolare
                  </div>
                </motion.div>
              )}
              
              <div className={`relative h-full rounded-2xl p-6 transition-all duration-500 ${
                plan.popular 
                  ? "glass border-2 border-primary/30 shadow-2xl" 
                  : "bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/20"
              }`}>
                {/* Plan Icon with animation */}
                <motion.div 
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${
                    plan.popular ? "gradient-primary" : "bg-secondary"
                  }`}
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <plan.icon className={`w-7 h-7 ${plan.popular ? "text-primary-foreground" : "text-foreground"}`} />
                </motion.div>

                <h3 className="text-2xl font-display font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.avatars} {plan.avatars === 1 ? "avatar" : "avatar"} AI inclusi
                </p>

                {/* Price with animation */}
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <span className="text-5xl font-display font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/mese</span>
                </motion.div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <motion.li 
                      key={feature} 
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        plan.popular ? "gradient-primary" : "bg-primary/10"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
                      </div>
                      <span className="text-sm text-foreground/80">{feature}</span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    className={`w-full group ${plan.popular ? "gradient-primary glow-primary" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/signup">
                      Inizia Ora
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* TOKEN SECTION - More Impactful */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Section divider */}
          <div className="flex items-center gap-4 mb-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <motion.div 
              className="flex items-center gap-2"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Coins className="w-6 h-6 text-gold" />
            </motion.div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Token Header - More impactful */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <motion.div 
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-gold/20 mb-6"
              whileHover={{ scale: 1.05 }}
              animate={{ 
                boxShadow: ["0 0 20px hsl(var(--gold) / 0)", "0 0 30px hsl(var(--gold) / 0.3)", "0 0 20px hsl(var(--gold) / 0)"],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-5 h-5 text-gold" />
              <span className="text-lg font-semibold text-foreground">Token per Chiamate</span>
              <Gift className="w-5 h-5 text-accent" />
            </motion.div>
            
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4">
              Ricarica i Tuoi <span className="text-gradient">Token</span>
            </h3>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              I token ti permettono di fare <span className="text-primary font-semibold">chiamate vocali</span> e{" "}
              <span className="text-accent font-semibold">videochiamate</span> con il tuo compagno AI. 
              Più parli, più il vostro legame diventa forte.
            </p>
            
            {/* Features row */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05, color: "hsl(var(--primary))" }}
              >
                <Phone className="w-4 h-4" />
                <span>Chiamate Vocali HD</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05, color: "hsl(var(--accent))" }}
              >
                <Video className="w-4 h-4" />
                <span>Videochiamate Real-time</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05, color: "hsl(var(--gold))" }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Non Scadono Mai</span>
              </motion.div>
            </div>
          </motion.div>

          {/* Token Cards - Redesigned */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {tokenPackages.map((pkg, index) => (
              <motion.div
                key={pkg.tokens}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                onMouseEnter={() => setHoveredToken(index)}
                onMouseLeave={() => setHoveredToken(null)}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative group"
              >
                {/* Popular badge */}
                {pkg.popular && (
                  <motion.div 
                    className="absolute -top-2 -right-2 z-10"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="px-2 py-1 rounded-full bg-gold text-background text-xs font-bold shadow-lg">
                      BEST
                    </div>
                  </motion.div>
                )}
                
                {/* Glow effect */}
                <motion.div
                  className={`absolute -inset-0.5 rounded-2xl blur-lg transition-opacity duration-300 ${
                    pkg.popular ? "bg-gradient-to-r from-gold/40 to-accent/40 opacity-60" : "bg-primary/20 opacity-0 group-hover:opacity-40"
                  }`}
                />
                
                <div className={`relative rounded-2xl p-5 md:p-6 text-center transition-all duration-300 ${
                  pkg.popular 
                    ? "glass border-2 border-gold/30" 
                    : "bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/30"
                }`}>
                  {/* Icon with animation */}
                  <motion.div 
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                      pkg.popular 
                        ? "bg-gradient-to-br from-gold to-accent" 
                        : "bg-gradient-to-br from-primary/20 to-accent/20"
                    }`}
                    animate={hoveredToken === index ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 0.6 }}
                  >
                    <Zap className={`w-7 h-7 md:w-8 md:h-8 ${pkg.popular ? "text-background" : "text-primary"}`} />
                  </motion.div>
                  
                  {/* Token amount */}
                  <motion.div 
                    className="text-3xl md:text-4xl font-display font-bold mb-1"
                    animate={hoveredToken === index ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {pkg.tokens}
                  </motion.div>
                  <div className="text-xs text-muted-foreground mb-2">token</div>
                  
                  {/* Bonus badge */}
                  {pkg.bonus && (
                    <motion.div 
                      className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold mb-3"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      🎁 {pkg.bonus}
                    </motion.div>
                  )}
                  
                  {/* Minutes estimate */}
                  <div className="text-xs text-muted-foreground mb-3">
                    {pkg.minutes} di chiamate
                  </div>
                  
                  {/* Price */}
                  <div className={`text-2xl md:text-3xl font-bold ${pkg.popular ? "text-gold" : "text-foreground"}`}>
                    ${pkg.price}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 text-center"
          >
            <div className="inline-flex flex-wrap justify-center gap-4 md:gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Mai scadono
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Acquista quando vuoi
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-primary" /> Pagamento sicuro
              </span>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-foreground font-medium">
              Prova gratuita di 7 giorni • Cancella quando vuoi
            </span>
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
