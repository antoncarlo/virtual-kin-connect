import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Avatar } from "@/data/avatars";

interface AvatarCardProps {
  avatar: Avatar;
  index: number;
  onSelect: (avatar: Avatar) => void;
}

export function AvatarCard({ avatar, index, onSelect }: AvatarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      className="group cursor-pointer"
    >
      <div className="relative rounded-lg overflow-hidden bg-card border border-border/30">
        {/* Image - Very Compact */}
        <div className="relative aspect-[3/4] max-h-[160px] overflow-hidden">
          <img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          
          {/* Online dot */}
          <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black/30" />
          
          {/* Name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <h3 className="font-semibold text-white text-sm">{avatar.name}</h3>
            <p className="text-white/60 text-[10px]">{avatar.role}</p>
          </div>
        </div>
        
        {/* Action */}
        <div className="p-2">
          <Button
            size="sm"
            className={`w-full h-6 text-[10px] bg-gradient-to-r ${avatar.gradient} text-white border-0`}
            onClick={() => onSelect(avatar)}
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Chat
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
