-- RUN THIS IN SUPABASE SQL EDITOR
-- This adds the missing 'is_active' column to the users table to support account suspension.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to be active by default
UPDATE public.users SET is_active = true WHERE is_active IS NULL;
