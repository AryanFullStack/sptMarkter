-- Run this in Supabase SQL Editor to fix the token_identifier issue

-- Option 1: Make token_identifier nullable (RECOMMENDED)
ALTER TABLE public.users 
ALTER COLUMN token_identifier DROP NOT NULL;

-- Option 2: Add a default value
-- ALTER TABLE public.users 
-- ALTER COLUMN token_identifier SET DEFAULT gen_random_uuid()::text;

-- Verify the change
SELECT column_name, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'token_identifier';
