-- Migration to add missing columns to users table
-- Run this in Supabase SQL Editor

-- Add 'approved' column if it doesn't exist
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Add comment explaining the column
COMMENT ON COLUMN public.users.approved IS 'Approval status for retailer and beauty_parlor accounts. Local customers are auto-approved.';

-- Update existing local_customer records to be approved
UPDATE public.users 
SET approved = true 
WHERE role = 'local_customer' AND approved = false;
