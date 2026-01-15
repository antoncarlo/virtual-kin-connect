import { motion, useScroll, useTransform } from "framer-motion";
import { MessageCircle, Phone, Video, Brain, Heart, Shield, Zap, Star } from "lucide-react";
import { useRef, useState } from "react";

const features = [
  {
    icon: MessageCircle,
    title: "Emotional AI Chat",
    description: "Deep, meaningful conversations with AI that understands context, emotions, and remembers your history.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description: "Speak naturally with lifelike AI voices. Each avatar has a unique, realistic voice personality.",
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
    description: "Your companion remembers your conversations, preferences, and grows to understand you better.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: Heart,
    title: "Emotional Intelligence",
    description: "Advanced emotional analysis to provide empathetic, supportive responses when you need them most.",
    color: "from-red-500 to-pink-500",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description: "Your conversations are encrypted and private. We never share your personal data.",
    color: "from-emerald-500 to-teal-500",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);

  return (
    <section id="features" ref={sectionRef} className="py-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-subtle" />
      
      {/* Floating geometric shapes */}
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 border border-primary/20 rounded-full"
        style={{ rotate }}
      />
      <motion.div 
        className="absolute bottom-20 left-10 w-48 h-48 border border-accent/20 rotate-45"
        style={{ y }}
      />
      
      {/* Animated dots pattern */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          {/* Animated badge */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-foreground/80">Powerful Features</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
            Experience{" "}
            <span className="relative">
              <span className="text-gradient">True Connection</span>
              <motion.span
                className="absolute -bottom-2 left-0 right-0 h-1 rounded-full gradient-primary"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </span>
          </h2>
          
          <motion.p 
            className="text-lg text-muted-foreground"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Cutting-edge AI technology that creates genuine emotional bonds
          </motion.p>
        </motion.div>

        {/* Features Grid with 3D hover effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative group perspective-1000"
            >
              {/* Glow effect */}
              <motion.div
                className={`absolute -inset-0.5 bg-gradient-to-r ${feature.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`}
              />
              
              <motion.div
                className="relative glass border-gradient p-6 rounded-2xl h-full"
                whileHover={{ 
                  rotateX: 5,
                  rotateY: -5,
                  scale: 1.02,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Icon container with animated gradient */}
                <motion.div 
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 relative overflow-hidden`}
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ x: "-100%" }}
                    animate={hoveredIndex === index ? { x: "100%" } : { x: "-100%" }}
                    transition={{ duration: 0.6 }}
                  />
                  <feature.icon className="w-7 h-7 text-white relative z-10" />
                </motion.div>
                
                {/* Content */}
                <motion.h3 
                  className="text-xl font-display font-semibold mb-3 text-foreground"
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  {feature.title}
                </motion.h3>
                
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Animated corner accent */}
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                >
                  <svg viewBox="0 0 80 80" className="w-full h-full">
                    <motion.path
                      d="M 80 0 L 80 80 L 0 80"
                      fill="none"
                      stroke={`url(#gradient-${index})`}
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      transition={{ duration: 0.5 }}
                    />
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        
        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass"
            whileHover={{ scale: 1.05 }}
          >
            <Star className="w-5 h-5 text-gold fill-gold" />
            <span className="text-foreground font-medium">Trusted by 100,000+ users worldwide</span>
            <Star className="w-5 h-5 text-gold fill-gold" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
