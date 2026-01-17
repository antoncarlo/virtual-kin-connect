import { motion } from "framer-motion";
import { Phone, Video, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Avatar } from "@/data/avatars";

interface PremiumAvatarCardProps {
  avatar: Avatar;
  onSelect: (avatar: Avatar) => void;
  status: "ready" | "reflecting" | "listening";
  index: number;
}

const statusMessages = {
  ready: "Ready to listen",
  reflecting: "Reflecting on your last talk",
  listening: "Always here for you",
};

const statusColors = {
  ready: "bg-green-500",
  reflecting: "bg-amber-500",
  listening: "bg-primary",
};

export function PremiumAvatarCard({
  avatar,
  onSelect,
  status,
  index,
}: PremiumAvatarCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group relative overflow-hidden rounded-2xl cursor-pointer"
      style={{
        background: `linear-gradient(145deg, 
          hsla(225, 30%, 12%, 0.95) 0%, 
          hsla(${avatar.id === "marco" ? "220, 50%, 18%" : "280, 40%, 18%"}, 0.9) 100%)`,
        border: "1px solid hsla(260, 40%, 40%, 0.25)",
        boxShadow: "0 20px 60px hsla(260, 50%, 20%, 0.3)",
      }}
      onClick={() => onSelect(avatar)}
    >
      {/* Animated background glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            hsla(${avatar.id === "marco" ? "185, 80%, 50%" : "280, 70%, 60%"}, 0.15) 0%, 
            transparent 70%)`,
        }}
      />

      {/* Top gradient overlay */}
      <div
        className="absolute top-0 left-0 right-0 h-1/3 opacity-60"
        style={{
          background: `linear-gradient(to bottom, 
            hsla(${avatar.id === "marco" ? "185, 80%, 50%" : "280, 70%, 60%"}, 0.2) 0%, 
            transparent 100%)`,
        }}
      />

      <div className="relative z-10 p-6">
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm border-white/20 text-white text-xs"
          >
            <span className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
            {statusMessages[status]}
          </Badge>
        </div>

        {/* Avatar Image */}
        <div className="flex justify-center mb-6">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-50"
              style={{
                background: `linear-gradient(135deg, 
                  hsl(${avatar.id === "marco" ? "185 80% 50%" : "280 70% 60%"}) 0%, 
                  hsl(${avatar.id === "marco" ? "220 70% 55%" : "320 60% 55%"}) 100%)`,
              }}
            />
            <img
              src={avatar.imageUrl}
              alt={avatar.name}
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/20 shadow-2xl"
            />
            <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        </div>

        {/* Avatar Info */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-display font-bold text-white mb-1">
            {avatar.name}
          </h3>
          <p className="text-white/60 text-sm">{avatar.role}</p>
          <p className="text-white/80 text-sm mt-2 italic">"{avatar.tagline}"</p>
        </div>

        {/* Personality Tags */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {avatar.personality.slice(0, 3).map((trait) => (
            <span
              key={trait}
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 backdrop-blur-sm border border-white/10"
            >
              {trait}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(avatar);
            }}
            className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-6 rounded-xl shadow-lg transition-all hover:shadow-primary/25 hover:shadow-xl"
          >
            <Phone className="w-5 h-5 mr-2" />
            Quick Start
          </Button>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(avatar);
            }}
            className="px-4 py-6 rounded-xl bg-white/5 border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            <Video className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom decorative line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 opacity-80"
        style={{
          background: `linear-gradient(90deg, 
            transparent 0%, 
            hsl(${avatar.id === "marco" ? "185 80% 50%" : "280 70% 60%"}) 50%, 
            transparent 100%)`,
        }}
      />
    </motion.div>
  );
}
