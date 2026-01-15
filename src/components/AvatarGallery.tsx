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
    <section id="avatars" className="py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="text-sm font-semibold tracking-widest uppercase text-primary mb-3 block">
            Meet Your
          </span>
          
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">
            AI <span className="text-gradient">Companions</span>
          </h2>
          
          <p className="text-muted-foreground">
            Six unique AI companions, each with their own personality.{" "}
            <span className="text-foreground font-medium">Choose who speaks to your heart.</span>
          </p>
        </motion.div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl mx-auto">
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
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
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
