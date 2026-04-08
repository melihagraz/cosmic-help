-- Extend profiles table for ALL users (not just matching)
-- Run this in Supabase SQL Editor

-- New personalization columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_time text,
  ADD COLUMN IF NOT EXISTS relation text DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS experience text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS career_field text,
  ADD COLUMN IF NOT EXISTS career_goal text,
  ADD COLUMN IF NOT EXISTS health_focus text,
  ADD COLUMN IF NOT EXISTS finance_goal text,
  ADD COLUMN IF NOT EXISTS relationship_goal text,
  ADD COLUMN IF NOT EXISTS weekly_guidance_used_at date;

-- Make gender_preference optional (not all users are matching)
ALTER TABLE public.profiles
  ALTER COLUMN gender_preference SET DEFAULT 'everyone',
  ALTER COLUMN gender DROP NOT NULL;

-- Allow NULL gender for 'other' users who skip
-- (gender already has NOT NULL, keep it but relax the check)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_gender_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_gender_check
  CHECK (gender IN ('female', 'male', 'other'));

-- Make name nullable for initial profile creation
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN birth_day DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN birth_month DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN birth_year DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN zodiac_sign DROP NOT NULL;

-- Create avatars storage bucket (run separately if this fails)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
