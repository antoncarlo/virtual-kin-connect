-- Create avatars table for MuseTalk/Personaplex configuration
CREATE TABLE public.avatars (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_video_url TEXT NOT NULL,
  voice_id TEXT NOT NULL,
  system_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.avatars ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read avatars (they're public content)
CREATE POLICY "Avatars are publicly readable"
ON public.avatars
FOR SELECT
USING (true);

-- Only authenticated users can insert/update (admin functionality)
CREATE POLICY "Authenticated users can insert avatars"
ON public.avatars
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update avatars"
ON public.avatars
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete avatars"
ON public.avatars
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_avatars_updated_at
BEFORE UPDATE ON public.avatars
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();