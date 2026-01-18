// Supabase client wrapper with fallback values
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// Get values from env or use fallback (anon key is public, safe to include)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vrnjccybvrdzakrrfard.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybmpjY3lidnJkemFrcnJmYXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MTkzNzksImV4cCI6MjA4MzM5NTM3OX0.T-k9YvwVkjzpzyQSTTInXF4a6kB-2500a1Sl48K8Hbc';

// Export as both supabase (for compatibility) and supabaseClient
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

export const supabaseClient = supabase;
