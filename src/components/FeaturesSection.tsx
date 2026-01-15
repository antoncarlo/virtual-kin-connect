import { motion } from "framer-motion";
import { MessageCircle, Phone, Video, Brain, Heart, Shield, Zap, Star } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Emotional AI Chat",
    description: "Deep, meaningful conversations with AI that understands context and emotions.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Speak naturally with lifelike AI voices. Each avatar has a unique personality.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Video,
    title: "Video Calls",
    description: "Face-to-face conversations with animated avatars that react in real-time.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Brain,
    title: "Memory & Learning",
    description: "Your companion remembers your conversations and grows to understand you.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Emotional Intelligence",
    description: "Advanced emotional analysis to provide empathetic, supportive responses.",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your conversations are encrypted and private. We never share your data.",
    color: "from-emerald-500 to-teal-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-subtle" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Powerful Features</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Experience <span className="text-gradient">True Connection</span>
          </h2>
          
          <p className="text-muted-foreground">
            Cutting-edge AI technology that creates genuine emotional bonds
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="relative glass border border-border/50 p-5 rounded-xl h-full hover:border-primary/20 transition-colors">
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                
                <h3 className="text-lg font-display font-semibold mb-2 text-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass text-sm">
            <Star className="w-4 h-4 text-gold fill-gold" />
            <span className="text-foreground/80">Trusted by 100,000+ users worldwide</span>
            <Star className="w-4 h-4 text-gold fill-gold" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
