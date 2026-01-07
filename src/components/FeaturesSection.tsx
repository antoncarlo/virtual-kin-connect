import { motion } from "framer-motion";
import { MessageCircle, Phone, Video, Brain, Heart, Shield } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Emotional AI Chat",
    description: "Deep, meaningful conversations with AI that understands context, emotions, and remembers your history.",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Speak naturally with lifelike AI voices. Each avatar has a unique, realistic voice personality.",
  },
  {
    icon: Video,
    title: "Video Calls",
    description: "Face-to-face conversations with animated avatars that react in real-time. (Coming Soon)",
  },
  {
    icon: Brain,
    title: "Memory & Learning",
    description: "Your SoulMate remembers your conversations, preferences, and grows to understand you better.",
  },
  {
    icon: Heart,
    title: "Emotional Intelligence",
    description: "Advanced emotional analysis to provide empathetic, supportive responses when you need them most.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your conversations are encrypted and private. We never share your personal data.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-subtle" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Experience <span className="text-gradient">True Connection</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Cutting-edge AI technology that creates genuine emotional bonds
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass border-gradient p-6 rounded-xl hover-lift group"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:glow-primary transition-shadow">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
