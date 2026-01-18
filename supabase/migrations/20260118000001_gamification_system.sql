-- Kindred AI - Gamification & Growth System Migration
-- Adds support for XP, achievements, streaks, and growth tracking

-- =============================================
-- 1. Update profiles table with gamification columns
-- =============================================

-- Add gamification columns to profiles (if they don't exist)
DO $$
BEGIN
    -- XP and leveling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gamification_xp') THEN
        ALTER TABLE public.profiles ADD COLUMN gamification_xp INTEGER DEFAULT 0;
    END IF;

    -- Streak tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'daily_streak') THEN
        ALTER TABLE public.profiles ADD COLUMN daily_streak INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'longest_streak') THEN
        ALTER TABLE public.profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_activity') THEN
        ALTER TABLE public.profiles ADD COLUMN last_activity TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Onboarding tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_step') THEN
        ALTER TABLE public.profiles ADD COLUMN onboarding_step INTEGER DEFAULT 1;
    END IF;

    -- Acquisition source
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'acquisition_source') THEN
        ALTER TABLE public.profiles ADD COLUMN acquisition_source TEXT DEFAULT 'organic';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'referral_code_used') THEN
        ALTER TABLE public.profiles ADD COLUMN referral_code_used TEXT;
    END IF;
END $$;

-- =============================================
-- 2. Create user_achievements table
-- =============================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}',

    UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. Create analytics_events table for growth tracking
-- =============================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    session_id TEXT,
    device_info JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policies - users can only insert their own events
CREATE POLICY "Users can insert their own analytics events"
ON public.analytics_events FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Service role can read all for analytics
CREATE POLICY "Service role can read all analytics"
ON public.analytics_events FOR SELECT
USING (auth.role() = 'service_role');

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- =============================================
-- 4. Update referrals table with additional columns
-- =============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'activated_at') THEN
        ALTER TABLE public.referrals ADD COLUMN activated_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'converted_at') THEN
        ALTER TABLE public.referrals ADD COLUMN converted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referrer_reward') THEN
        ALTER TABLE public.referrals ADD COLUMN referrer_reward INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'referred_reward') THEN
        ALTER TABLE public.referrals ADD COLUMN referred_reward INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'rewards_claimed') THEN
        ALTER TABLE public.referrals ADD COLUMN rewards_claimed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- =============================================
-- 5. Create daily_challenges table
-- =============================================

CREATE TABLE IF NOT EXISTS public.daily_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id TEXT NOT NULL,
    challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'special')),
    challenge_name TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 0,
    token_reward INTEGER DEFAULT 0,
    requirement_type TEXT NOT NULL,
    requirement_metric TEXT NOT NULL,
    requirement_target INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own challenges"
ON public.daily_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
ON public.daily_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
ON public.daily_challenges FOR UPDATE
USING (auth.uid() = user_id);

-- Index for active challenges
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_active ON public.daily_challenges(user_id, expires_at)
WHERE completed_at IS NULL;

-- =============================================
-- 6. Create XP log for history tracking
-- =============================================

CREATE TABLE IF NOT EXISTS public.xp_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source TEXT, -- achievement, challenge, activity, bonus
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.xp_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own XP log"
ON public.xp_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own XP log"
ON public.xp_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for user history
CREATE INDEX IF NOT EXISTS idx_xp_log_user_id ON public.xp_log(user_id, created_at DESC);

-- =============================================
-- 7. Create function to increment tokens safely
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_tokens(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_balance INTEGER;
BEGIN
    UPDATE public.profiles
    SET tokens_balance = COALESCE(tokens_balance, 0) + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING tokens_balance INTO new_balance;

    RETURN COALESCE(new_balance, 0);
END;
$$;

-- =============================================
-- 8. Create function to award XP with automatic leveling
-- =============================================

CREATE OR REPLACE FUNCTION public.award_xp(p_user_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS TABLE(new_xp INTEGER, level_up BOOLEAN, new_level INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_xp INTEGER;
    old_level INTEGER;
    new_xp_val INTEGER;
    new_level_val INTEGER;
    level_up_val BOOLEAN;
BEGIN
    -- Get current XP
    SELECT COALESCE(gamification_xp, 0) INTO old_xp
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- Calculate old level
    old_level := GREATEST(1, FLOOR(SQRT(COALESCE(old_xp, 0) / 100.0) + 1)::INTEGER);

    -- Update XP
    UPDATE public.profiles
    SET gamification_xp = COALESCE(gamification_xp, 0) + p_amount,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING gamification_xp INTO new_xp_val;

    -- Calculate new level
    new_level_val := GREATEST(1, FLOOR(SQRT(COALESCE(new_xp_val, 0) / 100.0) + 1)::INTEGER);
    level_up_val := new_level_val > old_level;

    -- Log XP gain
    INSERT INTO public.xp_log (user_id, amount, reason, source)
    VALUES (p_user_id, p_amount, p_reason, 'activity');

    RETURN QUERY SELECT new_xp_val, level_up_val, new_level_val;
END;
$$;

-- =============================================
-- 9. Create function to update daily streak
-- =============================================

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS TABLE(current_streak INTEGER, is_new_day BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_act TIMESTAMPTZ;
    days_diff INTEGER;
    new_streak INTEGER;
    is_new BOOLEAN;
BEGIN
    -- Get last activity
    SELECT last_activity INTO last_act
    FROM public.profiles
    WHERE user_id = p_user_id;

    -- Calculate days difference
    days_diff := EXTRACT(DAY FROM (CURRENT_TIMESTAMP - COALESCE(last_act, CURRENT_TIMESTAMP - INTERVAL '2 days')))::INTEGER;

    IF days_diff = 0 THEN
        -- Same day, no change
        SELECT daily_streak INTO new_streak FROM public.profiles WHERE user_id = p_user_id;
        is_new := false;
    ELSIF days_diff = 1 THEN
        -- Consecutive day, increment streak
        UPDATE public.profiles
        SET daily_streak = COALESCE(daily_streak, 0) + 1,
            longest_streak = GREATEST(COALESCE(longest_streak, 0), COALESCE(daily_streak, 0) + 1),
            last_activity = CURRENT_TIMESTAMP,
            updated_at = now()
        WHERE user_id = p_user_id
        RETURNING daily_streak INTO new_streak;
        is_new := true;
    ELSE
        -- Streak broken, reset to 1
        UPDATE public.profiles
        SET daily_streak = 1,
            last_activity = CURRENT_TIMESTAMP,
            updated_at = now()
        WHERE user_id = p_user_id;
        new_streak := 1;
        is_new := true;
    END IF;

    RETURN QUERY SELECT new_streak, is_new;
END;
$$;

-- =============================================
-- 10. Grant necessary permissions
-- =============================================

GRANT EXECUTE ON FUNCTION public.increment_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_streak TO authenticated;
