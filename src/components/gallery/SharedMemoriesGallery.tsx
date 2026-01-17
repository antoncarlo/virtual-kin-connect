import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon, 
  Heart, 
  Grid, 
  Layers, 
  Loader2,
  X,
  Camera,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MemoryCard } from './MemoryCard';
import { MemoryDetail } from './MemoryDetail';
import { useSharedMemories, SharedMemory } from '@/hooks/useSharedMemories';
import { cn } from '@/lib/utils';

interface SharedMemoriesGalleryProps {
  avatarId: string;
  avatarName: string;
  avatarPersonality: string;
  avatarImage: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SharedMemoriesGallery({
  avatarId,
  avatarName,
  avatarPersonality,
  avatarImage,
  isOpen,
  onClose,
}: SharedMemoriesGalleryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedMemory, setSelectedMemory] = useState<SharedMemory | null>(null);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'themes'>('all');

  const {
    memories,
    loading,
    uploading,
    analyzing,
    uploadPhoto,
    toggleFavorite,
    deleteMemory,
    updateCaption,
    getMemoriesByTheme,
  } = useSharedMemories({
    avatarId,
    avatarName,
    avatarPersonality,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPhoto(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredMemories = viewMode === 'favorites'
    ? memories.filter(m => m.is_favorite)
    : activeTheme
    ? memories.filter(m => m.ai_themes.includes(activeTheme))
    : memories;

  const themeGroups = getMemoriesByTheme();

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <img
                src={avatarImage}
                alt={avatarName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h1 className="font-semibold">Ricordi condivisi con {avatarName}</h1>
                <p className="text-sm text-muted-foreground">
                  {memories.length} {memories.length === 1 ? 'foto' : 'foto'} condivise
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Caricamento...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Condividi foto
                  </>
                )}
              </Button>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex items-center gap-4">
            <Tabs 
              value={viewMode} 
              onValueChange={(v) => {
                setViewMode(v as typeof viewMode);
                setActiveTheme(null);
              }}
            >
              <TabsList>
                <TabsTrigger value="all" className="gap-2">
                  <Grid className="w-4 h-4" />
                  Tutte
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2">
                  <Heart className="w-4 h-4" />
                  Preferite
                </TabsTrigger>
                <TabsTrigger value="themes" className="gap-2">
                  <Layers className="w-4 h-4" />
                  Temi
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Theme filter chips */}
            {viewMode === 'themes' && themeGroups.length > 0 && (
              <ScrollArea className="flex-1">
                <div className="flex gap-2 pb-2">
                  <Badge
                    variant={activeTheme === null ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setActiveTheme(null)}
                  >
                    Tutti i temi
                  </Badge>
                  {themeGroups.map(([theme, items]) => (
                    <Badge
                      key={theme}
                      variant={activeTheme === theme ? 'default' : 'outline'}
                      className="cursor-pointer whitespace-nowrap"
                      onClick={() => setActiveTheme(theme)}
                    >
                      {theme} ({items.length})
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-140px)]">
        <div className="container max-w-6xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredMemories.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">
                {viewMode === 'favorites' 
                  ? 'Nessuna foto preferita' 
                  : 'Nessun ricordo ancora'}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                {viewMode === 'favorites'
                  ? 'Tocca il cuore su una foto per aggiungerla ai preferiti'
                  : `Condividi la tua prima foto con ${avatarName}! L'AI analizzerà l'immagine e ${avatarName} aggiungerà un commento personale.`}
              </p>
              {viewMode !== 'favorites' && (
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Carica la prima foto
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredMemories.map((memory) => (
                  <MemoryCard
                    key={memory.id}
                    memory={memory}
                    avatarName={avatarName}
                    isAnalyzing={analyzing === memory.id}
                    onToggleFavorite={() => toggleFavorite(memory.id)}
                    onDelete={() => deleteMemory(memory.id)}
                    onUpdateCaption={(caption) => updateCaption(memory.id, caption)}
                    onClick={() => setSelectedMemory(memory)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Detail modal */}
      <MemoryDetail
        memory={selectedMemory}
        avatarName={avatarName}
        avatarImage={avatarImage}
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onToggleFavorite={() => {
          if (selectedMemory) {
            toggleFavorite(selectedMemory.id);
            setSelectedMemory(prev => 
              prev ? { ...prev, is_favorite: !prev.is_favorite } : null
            );
          }
        }}
      />
    </motion.div>
  );
}
