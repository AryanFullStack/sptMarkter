-- Migration: Remove Credit System & Add Pending Amount Limit
-- Date: 2025-12-17
-- Description: Removes all credit-related tables and columns, adds admin-controlled pending amount limit system

-- Step 1: Drop credit-related tables
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.user_credits CASCADE;

-- Step 2: Remove credit columns from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS credit_limit,
DROP COLUMN IF EXISTS credit_used;

-- Step 3: Add pending amount limit to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS pending_amount_limit DECIMAL(10, 2) DEFAULT 0;

-- Step 4: Add pending_amount to orders table (if not exists)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS pending_amount DECIMAL(10, 2) DEFAULT 0;

-- Step 5: Add payment_status to orders table (if not exists)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'partial', 'paid'));

-- Step 6: Update existing orders to set payment_status based on paid_amount
UPDATE public.orders 
SET payment_status = CASE 
  WHEN paid_amount >= total_amount THEN 'paid'
  WHEN paid_amount > 0 THEN 'partial'
  ELSE 'pending'
END,
pending_amount = total_amount - COALESCE(paid_amount, 0)
WHERE payment_status IS NULL;

-- Step 7: Add comment for documentation
COMMENT ON COLUMN public.users.pending_amount_limit IS 
'Admin-controlled maximum pending amount allowed for this user. Only applies to retailer and beauty_parlor roles.';

COMMENT ON COLUMN public.orders.pending_amount IS 
'Amount remaining to be paid for this order. Calculated as total_amount - paid_amount.';

-- Step 8: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_pending_limit 
ON public.users(pending_amount_limit) 
WHERE role IN ('retailer', 'beauty_parlor');

CREATE INDEX IF NOT EXISTS idx_orders_pending_amount 
ON public.orders(user_id, pending_amount) 
WHERE payment_status != 'paid';

-- Step 9: Drop any credit-related functions or triggers if they exist
DROP FUNCTION IF EXISTS update_credit_on_order CASCADE;
DROP FUNCTION IF EXISTS validate_credit_limit CASCADE;
DROP TRIGGER IF EXISTS check_credit_limit_trigger ON public.orders CASCADE;

-- Step 10: Verify cleanup - List any remaining references to credit tables
DO $$
DECLARE
    ref_count INTEGER;
BEGIN
    -- Check for any remaining foreign key constraints to dropped tables
    SELECT COUNT(*) INTO ref_count
    FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
    AND (constraint_name LIKE '%credit%' OR constraint_name LIKE '%user_credits%');
    
    IF ref_count > 0 THEN
        RAISE NOTICE 'Warning: % foreign key constraints still reference credit tables', ref_count;
    ELSE
        RAISE NOTICE 'Success: All credit-related constraints removed';
    END IF;
END$$;

-- Step 11: Final verification message
DO $$
BEGIN
    RAISE NOTICE 'Credit system removal complete. Pending amount limit system is now active.';
    RAISE NOTICE 'Admins can now set pending_amount_limit for Beauty Parlor and Retailer users.';
END$$;
