import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

export interface SharedMemory {
  id: string;
  user_id: string;
  avatar_id: string;
  image_url: string;
  image_path: string;
  ai_description: string | null;
  ai_themes: string[];
  ai_emotions: string[];
  ai_objects: string[];
  avatar_comment: string | null;
  user_caption: string | null;
  is_favorite: boolean;
  created_at: string;
  analyzed_at: string | null;
}

interface UseSharedMemoriesProps {
  avatarId: string;
  avatarName: string;
  avatarPersonality: string;
}

export function useSharedMemories({ avatarId, avatarName, avatarPersonality }: UseSharedMemoriesProps) {
  const [memories, setMemories] = useState<SharedMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const { toast } = useToast();

  // Load memories
  const loadMemories = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('shared_memories')
        .select('*')
        .eq('user_id', user.id)
        .eq('avatar_id', avatarId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMemories((data as SharedMemory[]) || []);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  }, [avatarId]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  // Upload and analyze a new photo
  const uploadPhoto = useCallback(async (file: File, caption?: string) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${avatarId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('shared-memories')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('shared-memories')
        .getPublicUrl(fileName);

      // Create memory record
      const { data: memory, error: insertError } = await supabase
        .from('shared_memories')
        .insert({
          user_id: user.id,
          avatar_id: avatarId,
          image_url: publicUrl,
          image_path: fileName,
          user_caption: caption || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to state immediately (without analysis)
      setMemories(prev => [memory as SharedMemory, ...prev]);

      toast({
        title: 'Foto caricata!',
        description: `${avatarName} sta analizzando la tua foto...`,
      });

      // Trigger analysis in background
      analyzeMemory(memory.id, publicUrl);

      return memory;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Errore upload',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  }, [avatarId, avatarName, toast]);

  // Analyze a memory with Vision AI
  const analyzeMemory = useCallback(async (memoryId: string, imageUrl: string) => {
    setAnalyzing(memoryId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('analyze-memory', {
        body: {
          memoryId,
          imageUrl,
          avatarId,
          avatarName,
          avatarPersonality,
        },
      });

      if (response.error) throw response.error;

      // Update memory in state with analysis
      setMemories(prev => prev.map(m => 
        m.id === memoryId 
          ? {
              ...m,
              ai_description: response.data.analysis.description,
              ai_themes: response.data.analysis.themes,
              ai_emotions: response.data.analysis.emotions,
              ai_objects: response.data.analysis.objects,
              avatar_comment: response.data.analysis.avatarComment,
              analyzed_at: new Date().toISOString(),
            }
          : m
      ));

      toast({
        title: `${avatarName} ha visto la foto!`,
        description: response.data.analysis.avatarComment?.substring(0, 100) + '...',
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Errore analisi',
        description: 'Non sono riuscito ad analizzare la foto',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(null);
    }
  }, [avatarId, avatarName, avatarPersonality, toast]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (memoryId: string) => {
    try {
      const memory = memories.find(m => m.id === memoryId);
      if (!memory) return;

      const { error } = await supabase
        .from('shared_memories')
        .update({ is_favorite: !memory.is_favorite })
        .eq('id', memoryId);

      if (error) throw error;

      setMemories(prev => prev.map(m =>
        m.id === memoryId ? { ...m, is_favorite: !m.is_favorite } : m
      ));
    } catch (error) {
      console.error('Toggle favorite error:', error);
    }
  }, [memories]);

  // Delete memory
  const deleteMemory = useCallback(async (memoryId: string) => {
    try {
      const memory = memories.find(m => m.id === memoryId);
      if (!memory) return;

      // Delete from storage
      await supabase.storage
        .from('shared-memories')
        .remove([memory.image_path]);

      // Delete from database
      const { error } = await supabase
        .from('shared_memories')
        .delete()
        .eq('id', memoryId);

      if (error) throw error;

      setMemories(prev => prev.filter(m => m.id !== memoryId));

      toast({
        title: 'Ricordo eliminato',
        description: 'La foto è stata rimossa dalla galleria',
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, [memories, toast]);

  // Update caption
  const updateCaption = useCallback(async (memoryId: string, caption: string) => {
    try {
      const { error } = await supabase
        .from('shared_memories')
        .update({ user_caption: caption })
        .eq('id', memoryId);

      if (error) throw error;

      setMemories(prev => prev.map(m =>
        m.id === memoryId ? { ...m, user_caption: caption } : m
      ));
    } catch (error) {
      console.error('Update caption error:', error);
    }
  }, []);

  // Get memories grouped by theme
  const getMemoriesByTheme = useCallback(() => {
    const themeMap = new Map<string, SharedMemory[]>();
    
    memories.forEach(memory => {
      memory.ai_themes.forEach(theme => {
        const existing = themeMap.get(theme) || [];
        themeMap.set(theme, [...existing, memory]);
      });
    });

    return Array.from(themeMap.entries())
      .sort((a, b) => b[1].length - a[1].length);
  }, [memories]);

  return {
    memories,
    loading,
    uploading,
    analyzing,
    uploadPhoto,
    toggleFavorite,
    deleteMemory,
    updateCaption,
    getMemoriesByTheme,
    refresh: loadMemories,
  };
}
