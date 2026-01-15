import { useState } from "react";
import { motion } from "framer-motion";
import { Star, X, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRatings } from "@/hooks/useRatings";
import { useToast } from "@/hooks/use-toast";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarId: string;
  avatarName: string;
  sessionId?: string;
}

export function RatingModal({
  isOpen,
  onClose,
  avatarId,
  avatarName,
  sessionId,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { submitRating, isSubmitting } = useRatings();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Seleziona una valutazione",
        description: "Per favore, seleziona almeno una stella.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await submitRating(avatarId, rating, feedback, sessionId);

    if (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare la valutazione. Riprova.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Grazie per il feedback! 💜",
      description: "La tua opinione ci aiuta a migliorare.",
    });

    setRating(0);
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass border-gradient max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-display">
            Come è andata con {avatarName}?
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-gold fill-gold"
                      : "text-muted-foreground"
                  }`}
                />
              </motion.button>
            ))}
          </div>

          {/* Rating Text */}
          {rating > 0 && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center text-muted-foreground"
            >
              {rating === 1 && "Pessimo 😞"}
              {rating === 2 && "Scarso 😕"}
              {rating === 3 && "Nella media 😐"}
              {rating === 4 && "Buono 😊"}
              {rating === 5 && "Fantastico! 🤩"}
            </motion.p>
          )}

          {/* Feedback Textarea */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Vuoi aggiungere un commento? (opzionale)
            </label>
            <Textarea
              placeholder="Racconta com'è stata l'esperienza..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-secondary/50 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Salta
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 gradient-primary"
            >
              {isSubmitting ? "Invio..." : "Invia"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
