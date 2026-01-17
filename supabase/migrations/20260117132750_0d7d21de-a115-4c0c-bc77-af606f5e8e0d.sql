-- Create shared_memories table for photo gallery
CREATE TABLE public.shared_memories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  
  -- AI Vision analysis
  ai_description TEXT,
  ai_themes TEXT[] DEFAULT '{}',
  ai_emotions TEXT[] DEFAULT '{}',
  ai_objects TEXT[] DEFAULT '{}',
  
  -- Avatar personalized comment
  avatar_comment TEXT,
  
  -- User metadata
  user_caption TEXT,
  is_favorite BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analyzed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_avatar CHECK (avatar_id IN ('marco', 'luna', 'alex', 'emma', 'sofia', 'leo'))
);

-- Enable RLS
ALTER TABLE public.shared_memories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own memories"
  ON public.shared_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memories"
  ON public.shared_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memories"
  ON public.shared_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memories"
  ON public.shared_memories FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_shared_memories_user_avatar ON public.shared_memories(user_id, avatar_id);
CREATE INDEX idx_shared_memories_themes ON public.shared_memories USING GIN(ai_themes);
CREATE INDEX idx_shared_memories_created ON public.shared_memories(created_at DESC);

-- Create storage bucket for memory images
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-memories', 'shared-memories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can view all memory images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shared-memories');

CREATE POLICY "Authenticated users can upload memory images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shared-memories' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own memory images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'shared-memories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own memory images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'shared-memories' AND auth.uid()::text = (storage.foldername(name))[1]);