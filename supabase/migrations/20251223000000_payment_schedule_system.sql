-- Migration: Payment Schedule and Reminder System
-- Date: 2025-12-23
-- Purpose: Add fields to support flexible user-defined payment scheduling and reminders

-- Step 1: Add payment schedule fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS initial_payment_required DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS initial_payment_status TEXT DEFAULT 'not_collected' CHECK (initial_payment_status IN ('not_collected', 'collected')),
ADD COLUMN IF NOT EXISTS initial_payment_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pending_payment_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reminder_sent TIMESTAMPTZ;

-- Step 2: Ensure created_via field exists and update constraint to allow 'self_order'
DO $$
BEGIN
    -- Add column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'orders' AND column_name = 'created_via') THEN
        ALTER TABLE public.orders ADD COLUMN created_via TEXT DEFAULT 'checkout';
    END IF;
    
    -- Drop old constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'orders_created_via_check' AND table_name = 'orders') THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_created_via_check;
    END IF;
    
    -- Add new constraint that includes 'self_order'
    ALTER TABLE public.orders ADD CONSTRAINT orders_created_via_check 
        CHECK (created_via IN ('direct', 'salesman', 'self_order', 'checkout', 'admin'));
END $$;

-- Step 3: Add comments for documentation
COMMENT ON COLUMN public.orders.initial_payment_required IS 
'Amount user chose to pay on delivery (can be 0 to total_amount). User-defined, not fixed.';

COMMENT ON COLUMN public.orders.initial_payment_status IS 
'Status of initial payment collection: not_collected (default) or collected (after admin/salesman marks it)';

COMMENT ON COLUMN public.orders.initial_payment_due_date IS 
'When the initial payment should be collected (set by admin/salesman)';

COMMENT ON COLUMN public.orders.pending_payment_due_date IS 
'When the remaining pending payment is due (set by admin/salesman)';

COMMENT ON COLUMN public.orders.created_via IS 
'Source of order creation: checkout (self-order), salesman, admin, etc.';

-- Step 4: Create payment_reminders table
CREATE TABLE IF NOT EXISTS public.payment_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('initial_due', 'pending_due', 'overdue')),
    due_date TIMESTAMPTZ NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    is_seen BOOLEAN DEFAULT false,
    is_acknowledged BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    seen_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ
);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_initial_payment_status 
ON public.orders(initial_payment_status) 
WHERE initial_payment_status = 'not_collected';

CREATE INDEX IF NOT EXISTS idx_orders_payment_due_dates 
ON public.orders(pending_payment_due_date) 
WHERE pending_payment_due_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_reminders_user 
ON public.payment_reminders(user_id, is_acknowledged) 
WHERE is_acknowledged = false;

CREATE INDEX IF NOT EXISTS idx_payment_reminders_order 
ON public.payment_reminders(order_id);

CREATE INDEX IF NOT EXISTS idx_payment_reminders_due_date 
ON public.payment_reminders(due_date, is_acknowledged) 
WHERE is_acknowledged = false;

-- Step 6: Add comment to payment_reminders table
COMMENT ON TABLE public.payment_reminders IS 
'Payment reminders shown to users based on their role. Retailers/Beauty Parlors see their own pending payments, Salesmen see their assigned shops, Admin/Sub-Admin see all.';

COMMENT ON COLUMN public.payment_reminders.reminder_type IS 
'Type of reminder: initial_due (initial payment due), pending_due (remaining payment due), overdue (past due date)';
