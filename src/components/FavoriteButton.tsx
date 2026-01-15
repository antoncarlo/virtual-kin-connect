import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  avatarId: string;
  avatarName: string;
  variant?: "default" | "overlay";
  size?: "sm" | "default";
}

export function FavoriteButton({
  avatarId,
  avatarName,
  variant = "default",
  size = "default",
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { toast } = useToast();
  const favorite = isFavorite(avatarId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { success } = await toggleFavorite(avatarId);

    if (success) {
      toast({
        title: favorite ? "Rimosso dai preferiti" : "Aggiunto ai preferiti! 💜",
        description: favorite
          ? `${avatarName} è stato rimosso dai preferiti.`
          : `${avatarName} è ora tra i tuoi preferiti.`,
      });
    }
  };

  if (variant === "overlay") {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className={`${
          size === "sm" ? "w-8 h-8" : "w-10 h-10"
        } rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-black/60`}
      >
        <Heart
          className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} ${
            favorite ? "text-red-500 fill-red-500" : "text-white"
          }`}
        />
      </motion.button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size === "sm" ? "icon" : "default"}
      onClick={handleClick}
      className={favorite ? "text-red-500" : "text-muted-foreground"}
    >
      <Heart className={`w-5 h-5 ${favorite ? "fill-current" : ""}`} />
    </Button>
  );
}
