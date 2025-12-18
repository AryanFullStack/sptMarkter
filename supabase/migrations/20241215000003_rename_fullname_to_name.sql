-- Migration to align addresses table schema with code expectations
-- This fixes the mismatch between database column names and application code

-- 1. Rename 'full_name' to 'name' (code expects 'name')
ALTER TABLE public.addresses 
RENAME COLUMN full_name TO name;

-- 2. Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'addresses' 
AND table_schema = 'public'
ORDER BY ordinal_position;
