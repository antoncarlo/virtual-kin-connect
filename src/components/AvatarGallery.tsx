import { motion } from "framer-motion";
import { AvatarCard } from "./AvatarCard";
import { avatars, type Avatar } from "@/data/avatars";
import { useNavigate } from "react-router-dom";
import { Sparkles, Heart, MessageCircle, Zap } from "lucide-react";

export function AvatarGallery() {
  const navigate = useNavigate();

  const handleSelectAvatar = (avatar: Avatar) => {
    navigate(`/signup?avatar=${avatar.id}`);
  };

  return (
    <section id="avatars" className="py-32 relative overflow-hidden bg-background">
      {/* Premium background effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large ambient orbs */}
        <motion.div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[800px] h-[800px] rounded-full"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            y: [0, -40, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-30, 30, -30],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              delay: Math.random() * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Gradient mesh overlay */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-accent/5 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-primary mb-4 block">
            Meet Your
          </span>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            <span className="text-foreground">AI </span>
            <span className="text-gradient">Companions</span>
          </h2>
          
          <p className="text-muted-foreground">
            Six unique AI companions, each with their own personality. 
            <span className="text-foreground font-medium"> Choose who speaks to your heart.</span>
          </p>
        </motion.div>

        {/* Avatar Grid - 2 cols mobile, 3 cols desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {avatars.map((avatar, index) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              index={index}
              onSelect={handleSelectAvatar}
            />
          ))}
        </div>
        
        {/* Bottom features */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          {[
            { icon: Sparkles, label: "Advanced AI" },
            { icon: Heart, label: "Emotionally Intelligent" },
            { icon: MessageCircle, label: "Always Available" },
            { icon: Zap, label: "Instant Responses" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className="w-4 h-4 text-primary" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
