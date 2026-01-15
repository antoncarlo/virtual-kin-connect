import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden">
        {/* Image fills entire card */}
        <div className="relative aspect-[3/4]">
          <img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Personality traits - visible on hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.div 
                className="absolute top-3 left-3 flex flex-wrap gap-1 max-w-[70%]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {avatar.personality.map((trait, i) => (
                  <motion.span
                    key={trait}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-medium"
                  >
                    {trait}
                  </motion.span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-white text-xl mb-0.5">{avatar.name}</h3>
            <p className="text-white/70 text-xs mb-3">{avatar.role}</p>
            
            {/* Action button */}
            <Button
              size="sm"
              className={`w-full h-8 text-xs bg-gradient-to-r ${avatar.gradient} text-white border-0`}
              onClick={() => onSelect(avatar)}
            >
              Inizia a chattare
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
