-- RUN THIS IN SUPABASE SQL EDITOR TO FIX "Could not find the 'approved' column"

-- 1. Add 'approved' column to users table if it's missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 2. Add 'role' column if it's missing (just to be safe)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';

-- 3. Verify columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
