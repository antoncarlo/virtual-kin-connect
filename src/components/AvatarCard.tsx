import { motion } from "framer-motion";
import { MessageCircle, Phone, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Avatar } from "@/data/avatars";

interface AvatarCardProps {
  avatar: Avatar;
  index: number;
  onSelect: (avatar: Avatar) => void;
}

export function AvatarCard({ avatar, index, onSelect }: AvatarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <motion.div 
        className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        animate={{ 
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      <div className="relative glass border-gradient rounded-2xl overflow-hidden">
        {/* Image Container - SMALLER */}
        <div className="relative aspect-[4/5] max-h-[280px] overflow-hidden">
          <motion.img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
          
          {/* Animated gradient overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent"
            initial={{ opacity: 0.8 }}
            whileHover={{ opacity: 1 }}
          />
          
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/60 rounded-full"
                style={{
                  left: `${20 + i * 30}%`,
                  bottom: `${10 + i * 10}%`,
                }}
                animate={{
                  y: [-20, -60, -20],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          
          {/* Online indicator */}
          <motion.div 
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full glass"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <motion.div 
              className="w-2 h-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-xs font-medium text-foreground/80">Online</span>
          </motion.div>
          
          {/* Floating Action Buttons */}
          <motion.div 
            className="absolute bottom-3 left-3 right-3 flex gap-2"
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
          >
            <Button
              size="sm"
              className="flex-1 gradient-primary text-primary-foreground shadow-lg"
              onClick={() => onSelect(avatar)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button size="sm" variant="secondary" className="glass backdrop-blur-md">
              <Phone className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between">
            <div>
              <motion.h3 
                className="text-lg font-display font-semibold text-foreground"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                {avatar.name}
              </motion.h3>
              <p className="text-sm text-gradient font-medium">{avatar.role}</p>
            </div>
            <motion.button 
              className="p-1.5 rounded-full hover:bg-accent/20 transition-colors"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className="w-4 h-4 text-accent" />
            </motion.button>
          </div>

          <p className="text-muted-foreground text-xs italic line-clamp-2">
            "{avatar.tagline}"
          </p>

          <div className="flex flex-wrap gap-1">
            {avatar.personality.slice(0, 3).map((trait, i) => (
              <motion.div
                key={trait}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-secondary/50 text-secondary-foreground px-2 py-0.5"
                >
                  {trait}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
