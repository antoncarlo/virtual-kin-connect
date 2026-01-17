-- Fix security issues

-- 1. Enable RLS on knowledge_sync_log
ALTER TABLE public.knowledge_sync_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access sync logs (no direct user access needed)
-- This is an admin-only table

-- 2. Fix the security definer view by converting to a regular view
-- Drop the old view first
DROP VIEW IF EXISTS public.global_knowledge;

-- Recreate as a regular view (not security definer)
CREATE VIEW public.global_knowledge WITH (security_invoker = true) AS
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