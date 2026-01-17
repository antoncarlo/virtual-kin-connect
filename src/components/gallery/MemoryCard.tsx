import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2, MessageCircle, Sparkles, Loader2, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SharedMemory } from '@/hooks/useSharedMemories';
import { cn } from '@/lib/utils';

interface MemoryCardProps {
  memory: SharedMemory;
  avatarName: string;
  isAnalyzing: boolean;
  onToggleFavorite: () => void;
  onDelete: () => void;
  onUpdateCaption: (caption: string) => void;
  onClick: () => void;
}

export function MemoryCard({
  memory,
  avatarName,
  isAnalyzing,
  onToggleFavorite,
  onDelete,
  onUpdateCaption,
  onClick,
}: MemoryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [caption, setCaption] = useState(memory.user_caption || '');
  const [showComment, setShowComment] = useState(false);

  const handleSaveCaption = () => {
    onUpdateCaption(caption);
    setIsEditing(false);
  };

  const emotionColors: Record<string, string> = {
    gioia: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    serenità: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    nostalgia: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    eccitazione: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    amore: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    gratitudine: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden bg-card/50 backdrop-blur border-border/50 group">
        {/* Image */}
        <div 
          className="relative aspect-square cursor-pointer overflow-hidden"
          onClick={onClick}
        >
          <img
            src={memory.image_url}
            alt={memory.ai_description || 'Shared memory'}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          
          {/* Analyzing overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  {avatarName} sta guardando...
                </p>
              </div>
            </div>
          )}

          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-background/50 backdrop-blur-sm hover:bg-background/70"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-colors',
                memory.is_favorite ? 'fill-red-500 text-red-500' : 'text-foreground'
              )}
            />
          </Button>

          {/* Theme badges */}
          {memory.ai_themes.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {memory.ai_themes.slice(0, 2).map((theme) => (
                <Badge
                  key={theme}
                  variant="secondary"
                  className="text-xs bg-background/70 backdrop-blur-sm"
                >
                  {theme}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          {/* Emotions */}
          {memory.ai_emotions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {memory.ai_emotions.map((emotion) => (
                <Badge
                  key={emotion}
                  variant="outline"
                  className={cn(
                    'text-xs',
                    emotionColors[emotion] || 'bg-muted'
                  )}
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {emotion}
                </Badge>
              ))}
            </div>
          )}

          {/* Caption */}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <Input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Aggiungi una didascalia..."
                className="h-8 text-sm"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveCaption}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                {memory.user_caption || memory.ai_description || 'Nessuna descrizione'}
              </p>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6 shrink-0"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Avatar comment toggle */}
          {memory.avatar_comment && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-primary hover:text-primary"
                onClick={() => setShowComment(!showComment)}
              >
                <MessageCircle className="w-3 h-3 mr-1" />
                {showComment ? 'Nascondi commento' : `Cosa dice ${avatarName}`}
              </Button>
              
              {showComment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20"
                >
                  <p className="text-sm italic text-foreground">
                    "{memory.avatar_comment}"
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end pt-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
