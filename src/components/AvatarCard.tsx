import { motion } from "framer-motion";
import { MessageCircle, Phone, Video } from "lucide-react";
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
      <div className="relative rounded-xl overflow-hidden">
        {/* Image fills entire card */}
        <div className="relative aspect-[3/4]">
          <img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Online dot */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-white">Online</span>
          </div>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-white text-xl mb-0.5">{avatar.name}</h3>
            <p className="text-white/70 text-xs mb-3">{avatar.role}</p>
            
            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                className={`flex-1 h-8 text-xs bg-gradient-to-r ${avatar.gradient} text-white border-0`}
                onClick={() => onSelect(avatar)}
              >
                <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                Chat
              </Button>
              <Button 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
              >
                <Phone className="w-3.5 h-3.5 text-white" />
              </Button>
              <Button 
                size="sm" 
                className="h-8 w-8 p-0 bg-white/20 backdrop-blur-sm border-0 hover:bg-white/30"
              >
                <Video className="w-3.5 h-3.5 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
