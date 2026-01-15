import { motion } from "framer-motion";
import { MessageCircle, Phone, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Avatar } from "@/data/avatars";
import { useState } from "react";

interface AvatarCardProps {
  avatar: Avatar;
  index: number;
  onSelect: (avatar: Avatar) => void;
}

export function AvatarCard({ avatar, index, onSelect }: AvatarCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden bg-card border border-border/50">
        {/* Image Container - Compact */}
        <div className="relative aspect-[4/5] max-h-[240px] overflow-hidden">
          <motion.img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover"
            animate={{ 
              scale: isHovered ? 1.05 : 1,
              filter: isHovered ? 'brightness(0.7)' : 'brightness(0.85)'
            }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Top - Role badge & Like */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
            <span className={`px-2 py-0.5 rounded-full bg-gradient-to-r ${avatar.gradient} text-white text-[10px] font-semibold`}>
              {avatar.role}
            </span>
            <button 
              className="p-1.5 rounded-full bg-black/40 backdrop-blur-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
            >
              <Heart className={`w-3 h-3 ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
            </button>
          </div>

          {/* Online status */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white/90">Online</span>
          </div>

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="font-display font-bold text-white text-lg mb-0.5">{avatar.name}</h3>
            <p className="text-white/60 text-xs italic mb-2 line-clamp-1">"{avatar.tagline}"</p>

            {/* Traits */}
            <div className="flex flex-wrap gap-1 mb-2">
              {avatar.personality.slice(0, 2).map((trait) => (
                <span
                  key={trait}
                  className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/70 text-[9px]"
                >
                  {trait}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className={`flex-1 h-7 text-xs bg-gradient-to-r ${avatar.gradient} text-white border-0`}
                onClick={() => onSelect(avatar)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                Chat
              </Button>
              <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/10 border-0">
                <Phone className="w-3 h-3 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
