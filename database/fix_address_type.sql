-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Add the column if it is missing (Safe to run even if column exists)
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS address_type VARCHAR(20) NOT NULL DEFAULT 'home';

-- 2. Drop the old restriction if it exists
ALTER TABLE addresses DROP CONSTRAINT IF EXISTS addresses_address_type_check;

-- 3. Add the VALIDATION rule for Shop and Beauty Parlor
ALTER TABLE addresses 
  ADD CONSTRAINT addresses_address_type_check 
  CHECK (address_type IN ('home', 'office', 'shop', 'beauty_parlor'));

-- 4. Verify it exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'addresses' AND column_name = 'address_type';
