import { motion } from "framer-motion";
import { MessageCircle, Phone, Heart } from "lucide-react";
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
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <div className="glass border-gradient hover-lift rounded-2xl overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={avatar.imageUrl}
            alt={avatar.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          {/* Floating Action Buttons */}
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="sm"
              className="flex-1 gradient-primary text-primary-foreground"
              onClick={() => onSelect(avatar)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button size="sm" variant="secondary" className="glass">
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-display font-semibold text-foreground">
                {avatar.name}
              </h3>
              <p className="text-sm text-gradient font-medium">{avatar.role}</p>
            </div>
            <button className="p-2 rounded-full hover:bg-accent/20 transition-colors">
              <Heart className="w-5 h-5 text-accent" />
            </button>
          </div>

          <p className="text-muted-foreground text-sm italic">
            "{avatar.tagline}"
          </p>

          <div className="flex flex-wrap gap-1.5">
            {avatar.personality.slice(0, 3).map((trait) => (
              <Badge
                key={trait}
                variant="secondary"
                className="text-xs bg-secondary/50 text-secondary-foreground"
              >
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
