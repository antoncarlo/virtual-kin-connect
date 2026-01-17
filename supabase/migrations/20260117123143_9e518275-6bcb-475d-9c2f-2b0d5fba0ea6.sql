-- =============================================
-- CENTRALIZED RAG ARCHITECTURE - GLOBAL BRAIN
-- =============================================

-- 1. Add global_knowledge column to knowledge_base to distinguish global from avatar-specific
-- This allows the same table to store both types
ALTER TABLE public.knowledge_base 
ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS knowledge_type TEXT NOT NULL DEFAULT 'static' CHECK (knowledge_type IN ('static', 'learned', 'validated')),
ADD COLUMN IF NOT EXISTS learned_from_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS learned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
ADD COLUMN IF NOT EXISTS validation_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;

-- 2. Create pending_knowledge table for auto-learning queue
CREATE TABLE IF NOT EXISTS public.pending_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_id TEXT NOT NULL DEFAULT 'marco',
  extracted_fact TEXT NOT NULL,
  source_message TEXT NOT NULL,
  fact_category TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0.5,
  is_personal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'approved', 'rejected', 'merged'))
);

-- Enable RLS
ALTER TABLE public.pending_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_knowledge (only system/service can read all, users can see their own)
CREATE POLICY "Users can view their own pending knowledge"
  ON public.pending_knowledge FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create knowledge_sync_log to track nightly batch processing
CREATE TABLE IF NOT EXISTS public.knowledge_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_date DATE NOT NULL DEFAULT CURRENT_DATE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  items_processed INTEGER DEFAULT 0,
  items_approved INTEGER DEFAULT 0,
  items_rejected INTEGER DEFAULT 0,
  items_merged INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT
);

-- 4. Modify user_context to support cross-avatar private memory
-- Add a flag to indicate if this context should be shared across all avatars for the same user
ALTER TABLE public.user_context
ADD COLUMN IF NOT EXISTS is_cross_avatar BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_level TEXT NOT NULL DEFAULT 'private' CHECK (privacy_level IN ('private', 'cross_avatar', 'public'));

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_global ON public.knowledge_base(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_type ON public.knowledge_base(knowledge_type);
CREATE INDEX IF NOT EXISTS idx_pending_knowledge_status ON public.pending_knowledge(processing_status) WHERE processing_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_context_cross_avatar ON public.user_context(user_id, is_cross_avatar) WHERE is_cross_avatar = true;

-- 6. Update existing knowledge_base entries to mark them as global (they're the shared wisdom)
UPDATE public.knowledge_base 
SET is_global = true, knowledge_type = 'static'
WHERE avatar_id = 'marco' AND source IS NOT NULL;

-- 7. Create a view for easy global knowledge retrieval
CREATE OR REPLACE VIEW public.global_knowledge AS
SELECT 
  id,
  title,
  content,
  category,
  source,
  embedding,
  metadata,
  created_at,
  knowledge_type,
  validation_count,
  last_used_at
FROM public.knowledge_base
WHERE is_global = true AND (validation_status = 'validated' OR knowledge_type = 'static');

-- 8. Create a function to search global knowledge with embeddings
CREATE OR REPLACE FUNCTION public.search_global_knowledge(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  source text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id,
    k.title,
    k.content,
    k.category,
    k.source,
    1 - (k.embedding <=> query_embedding) AS similarity
  FROM knowledge_base k
  WHERE k.is_global = true
    AND k.embedding IS NOT NULL
    AND (k.validation_status = 'validated' OR k.knowledge_type = 'static')
    AND 1 - (k.embedding <=> query_embedding) > match_threshold
  ORDER BY k.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 9. Create function to get user's private context across all avatars
CREATE OR REPLACE FUNCTION public.get_user_private_context(
  p_user_id uuid,
  p_avatar_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  context_type text,
  key text,
  value text,
  confidence numeric,
  avatar_id text,
  is_cross_avatar boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.id,
    uc.context_type,
    uc.key,
    uc.value,
    uc.confidence,
    uc.avatar_id,
    uc.is_cross_avatar
  FROM user_context uc
  WHERE uc.user_id = p_user_id
    AND uc.context_type != 'session_tracking'
    AND (
      uc.is_cross_avatar = true 
      OR (p_avatar_id IS NOT NULL AND uc.avatar_id = p_avatar_id)
    )
  ORDER BY uc.confidence DESC
  LIMIT 50;
END;
$$;