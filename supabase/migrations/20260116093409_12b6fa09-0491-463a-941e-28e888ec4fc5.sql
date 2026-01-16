-- Add safe space preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS safe_space_theme TEXT DEFAULT 'forest',
ADD COLUMN IF NOT EXISTS safe_space_sound TEXT DEFAULT 'rain',
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create knowledge base table for RAG (wellness content)
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'mindfulness', 'cbt', 'anxiety', 'stress', 'emotions'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT, -- attribution/citation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on knowledge_base (public read, no user write)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Anyone can read knowledge base content
CREATE POLICY "Anyone can read knowledge base"
ON public.knowledge_base FOR SELECT
USING (true);

-- Create crisis detection log table
CREATE TABLE IF NOT EXISTS public.crisis_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avatar_id TEXT NOT NULL,
  message_content TEXT NOT NULL,
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  crisis_type TEXT NOT NULL, -- 'suicidal', 'self_harm', 'severe_distress'
  action_taken TEXT NOT NULL -- 'resources_shown', 'chat_paused'
);

-- Enable RLS on crisis_logs
ALTER TABLE public.crisis_logs ENABLE ROW LEVEL SECURITY;

-- Only the user can see their own crisis logs
CREATE POLICY "Users can view their own crisis logs"
ON public.crisis_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create crisis logs"
ON public.crisis_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert initial wellness knowledge base content
INSERT INTO public.knowledge_base (category, title, content, source) VALUES
-- Mindfulness techniques
('mindfulness', 'Box Breathing Technique', 'Box breathing is a simple technique: breathe in for 4 seconds, hold for 4 seconds, breathe out for 4 seconds, hold for 4 seconds. Repeat 4 times. This activates your parasympathetic nervous system and reduces stress.', 'Clinical Psychology Review'),
('mindfulness', 'Body Scan Meditation', 'Start at your feet and slowly move your attention up through your body. Notice any sensations without judgment. This practice helps you reconnect with your body and release tension.', 'Mindfulness-Based Stress Reduction (MBSR)'),
('mindfulness', '5-4-3-2-1 Grounding', 'When feeling overwhelmed, notice: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste. This brings you back to the present moment.', 'Dialectical Behavior Therapy (DBT)'),

-- CBT techniques
('cbt', 'Thought Challenging', 'When you notice a negative thought, ask: Is this thought based on facts? What evidence supports or contradicts it? What would I tell a friend with this thought? This helps identify cognitive distortions.', 'Cognitive Behavioral Therapy Principles'),
('cbt', 'Behavioral Activation', 'Depression often leads to withdrawal. Start small: schedule one pleasant activity per day, even for 5 minutes. Action often precedes motivation, not the other way around.', 'Behavioral Activation for Depression'),
('cbt', 'Worry Time Technique', 'Instead of worrying all day, set a specific 15-minute "worry time." When worries arise outside this time, note them and postpone them. This contains anxiety without suppressing it.', 'CBT for Generalized Anxiety'),

-- Anxiety management
('anxiety', 'Understanding Anxiety', 'Anxiety is your body''s natural alarm system. It''s not dangerous, even when uncomfortable. Physical symptoms like racing heart and sweating are your body preparing to face a challenge.', 'Anxiety and Depression Association'),
('anxiety', 'Paradoxical Acceptance', 'Fighting anxiety often makes it stronger. Try saying "I notice I''m feeling anxious, and that''s okay." Accepting the feeling, rather than fighting it, often reduces its intensity.', 'Acceptance and Commitment Therapy (ACT)'),

-- Emotions
('emotions', 'Emotion Validation', 'All emotions are valid and serve a purpose. Sadness signals loss, anger signals boundary violation, fear signals danger. The goal isn''t to eliminate emotions but to respond to them skillfully.', 'Emotion-Focused Therapy'),
('emotions', 'Emotional Regulation', 'When emotions feel overwhelming: 1) Name the emotion, 2) Rate its intensity 1-10, 3) Notice where you feel it in your body, 4) Breathe slowly, 5) Ask what this emotion needs.', 'DBT Emotion Regulation Skills'),

-- Stress
('stress', 'Stress vs Stressor', 'A stressor is the external event; stress is your internal response. You may not control stressors, but you can influence your stress response through relaxation, perspective, and coping strategies.', 'Stress Management Research'),
('stress', 'Progressive Muscle Relaxation', 'Tense each muscle group for 5 seconds, then release for 30 seconds. Start with feet, move up to face. This teaches your body the difference between tension and relaxation.', 'Jacobson''s Progressive Relaxation');