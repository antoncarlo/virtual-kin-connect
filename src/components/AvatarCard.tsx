import { motion } from "framer-motion";
import { MessageCircle, Phone, Video, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Avatar } from "@/data/avatars";
import { useState } from "react";

interface AvatarCardProps {
  avatar: Avatar;
  index: number;
  onSelect: (avatar: Avatar) => void;
  featured?: boolean;
}

export function AvatarCard({ avatar, index, onSelect, featured = false }: AvatarCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative cursor-pointer ${featured ? 'col-span-2 row-span-2' : ''}`}
    >
      {/* Ambient glow */}
      <motion.div 
        className={`absolute -inset-2 rounded-3xl bg-gradient-to-br ${avatar.gradient} opacity-0 blur-2xl transition-opacity duration-700`}
        animate={{ opacity: isHovered ? 0.4 : 0 }}
      />
      
      <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50">
        {/* Image Container */}
        <div className={`relative overflow-hidden ${featured ? 'aspect-[3/4]' : 'aspect-[3/4]'}`}>
          {/* Main Image */}
          <motion.img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover"
            animate={{ 
              scale: isHovered ? 1.1 : 1,
              filter: isHovered ? 'brightness(0.7)' : 'brightness(0.9)'
            }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
          
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-br ${avatar.gradient} mix-blend-overlay`}
            animate={{ opacity: isHovered ? 0.3 : 0 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Shimmer effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full"
            animate={{ x: isHovered ? '200%' : '-100%' }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Top badges */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <motion.div 
              className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${avatar.gradient} text-white text-xs font-semibold shadow-lg`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
            >
              {avatar.role}
            </motion.div>
            
            <motion.button 
              className="p-2 rounded-full bg-black/40 backdrop-blur-md hover:bg-black/60 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
            >
              <Heart className={`w-4 h-4 transition-colors ${isLiked ? 'text-rose-500 fill-rose-500' : 'text-white'}`} />
            </motion.button>
          </div>

          {/* Online status */}
          <motion.div 
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <motion.div 
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ 
                scale: [1, 1.4, 1],
                boxShadow: ['0 0 0 0 rgba(52,211,153,0.4)', '0 0 0 8px rgba(52,211,153,0)', '0 0 0 0 rgba(52,211,153,0.4)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-white/90">Online</span>
          </motion.div>

          {/* Content overlay - bottom */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 p-5"
            animate={{ y: isHovered ? -8 : 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Name and tagline */}
            <div className="mb-4">
              <h3 className={`font-display font-bold text-white mb-1 ${featured ? 'text-3xl' : 'text-2xl'}`}>
                {avatar.name}
              </h3>
              <p className="text-white/70 text-sm italic">"{avatar.tagline}"</p>
            </div>

            {/* Personality traits */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {avatar.personality.slice(0, featured ? 4 : 3).map((trait, i) => (
                <motion.span
                  key={trait}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium border border-white/10"
                >
                  {trait}
                </motion.span>
              ))}
            </div>

            {/* Action buttons */}
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0.7, y: isHovered ? 0 : 10 }}
              transition={{ duration: 0.4 }}
            >
              <Button
                className={`flex-1 bg-gradient-to-r ${avatar.gradient} text-white border-0 shadow-lg hover:shadow-xl transition-shadow`}
                onClick={() => onSelect(avatar)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chatta
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20"
              >
                <Phone className="w-4 h-4 text-white" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="bg-white/10 backdrop-blur-md border-white/10 hover:bg-white/20"
              >
                <Video className="w-4 h-4 text-white" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
