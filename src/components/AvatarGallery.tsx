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

  // Reorganize avatars for featured layout - first 2 are featured
  const featuredAvatars = avatars.slice(0, 2);
  const regularAvatars = avatars.slice(2);

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
        {/* Section Header - Premium magazine style */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          {/* Eyebrow text */}
          <motion.div 
            className="inline-flex items-center gap-3 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-primary/50" />
            <span className="text-sm font-semibold tracking-[0.3em] uppercase text-primary">
              Incontra i tuoi
            </span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-primary/50" />
          </motion.div>
          
          {/* Main headline */}
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-8 leading-[1.1]">
            <motion.span 
              className="block text-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Compagni
            </motion.span>
            <motion.span 
              className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto]"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              style={{ 
                WebkitBackgroundClip: "text",
                animationDuration: "4s",
                animationIterationCount: "infinite",
              }}
            >
              Straordinari
            </motion.span>
          </h2>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sei compagni AI unici, ognuno con la propria personalità e stile.
            <span className="text-foreground font-medium"> Scegli chi ti fa battere il cuore.</span>
          </motion.p>
        </motion.div>

        {/* Featured avatars - Large showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8">
          {featuredAvatars.map((avatar, index) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              index={index}
              onSelect={handleSelectAvatar}
              featured
            />
          ))}
        </div>

        {/* Regular avatars grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {regularAvatars.map((avatar, index) => (
            <AvatarCard
              key={avatar.id}
              avatar={avatar}
              index={index + 2}
              onSelect={handleSelectAvatar}
            />
          ))}
        </div>
        
        {/* Bottom features strip */}
        <motion.div 
          className="mt-20 pt-12 border-t border-border/30"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Sparkles, label: "AI Avanzata", desc: "Conversazioni naturali" },
              { icon: Heart, label: "Emotivamente Intelligenti", desc: "Ti capiscono davvero" },
              { icon: MessageCircle, label: "Sempre Disponibili", desc: "24/7 per te" },
              { icon: Zap, label: "Risposte Istantanee", desc: "Mai un'attesa" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <motion.div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <item.icon className="w-5 h-5 text-primary" />
                </motion.div>
                <h4 className="font-semibold text-foreground mb-1">{item.label}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
