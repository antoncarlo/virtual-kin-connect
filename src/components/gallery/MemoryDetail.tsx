import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Calendar, Tag, Sparkles, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SharedMemory } from '@/hooks/useSharedMemories';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MemoryDetailProps {
  memory: SharedMemory | null;
  avatarName: string;
  avatarImage: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
}

export function MemoryDetail({
  memory,
  avatarName,
  avatarImage,
  isOpen,
  onClose,
  onToggleFavorite,
}: MemoryDetailProps) {
  if (!memory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95 backdrop-blur-xl">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto">
            <img
              src={memory.image_url}
              alt={memory.ai_description || 'Memory'}
              className="w-full h-full object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 left-4 bg-background/50 backdrop-blur-sm"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 bg-background/50 backdrop-blur-sm"
              onClick={onToggleFavorite}
            >
              <Heart
                className={cn(
                  'w-5 h-5',
                  memory.is_favorite ? 'fill-red-500 text-red-500' : ''
                )}
              />
            </Button>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
            {/* Date */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {format(new Date(memory.created_at), "d MMMM yyyy 'alle' HH:mm", { locale: it })}
              </span>
            </div>

            {/* User caption */}
            {memory.user_caption && (
              <div>
                <h3 className="font-semibold mb-2">La tua didascalia</h3>
                <p className="text-foreground">{memory.user_caption}</p>
              </div>
            )}

            {/* AI Description */}
            {memory.ai_description && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Cosa vede l'AI
                </h3>
                <p className="text-muted-foreground">{memory.ai_description}</p>
              </div>
            )}

            {/* Themes */}
            {memory.ai_themes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Temi
                </h3>
                <div className="flex flex-wrap gap-2">
                  {memory.ai_themes.map((theme) => (
                    <Badge key={theme} variant="secondary">
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Emotions */}
            {memory.ai_emotions.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Emozioni percepite</h3>
                <div className="flex flex-wrap gap-2">
                  {memory.ai_emotions.map((emotion) => (
                    <Badge key={emotion} variant="outline" className="capitalize">
                      {emotion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Objects */}
            {memory.ai_objects.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Elementi rilevati</h3>
                <div className="flex flex-wrap gap-2">
                  {memory.ai_objects.map((obj) => (
                    <Badge key={obj} variant="outline" className="bg-muted/50">
                      {obj}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Avatar Comment */}
            {memory.avatar_comment && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-primary/10 border border-primary/20"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={avatarImage}
                    alt={avatarName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{avatarName}</span>
                      <MessageCircle className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-foreground italic">
                      "{memory.avatar_comment}"
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
