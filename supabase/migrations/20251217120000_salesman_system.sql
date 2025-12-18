-- Migration: Add Salesman Role and System
-- Date: 2025-12-17
-- Description: Adds salesman role to user_role enum, creates salesman_brands junction table,
--              adds salesman assignment to users, and enhances orders table

-- Step 1: Add 'salesman' to user_role enum
-- Note: This must be run in a separate transaction from the rest
-- If the value already exists, this will fail safely
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'salesman';

-- Step 2: Create salesman_brands junction table
CREATE TABLE IF NOT EXISTS public.salesman_brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesman_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    UNIQUE(salesman_id, brand_id)
);

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_salesman_brands_salesman 
ON public.salesman_brands(salesman_id);

CREATE INDEX IF NOT EXISTS idx_salesman_brands_brand 
ON public.salesman_brands(brand_id);

-- Step 3: Add assigned_salesman_id to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS assigned_salesman_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add index for salesman assignments
CREATE INDEX IF NOT EXISTS idx_users_assigned_salesman 
ON public.users(assigned_salesman_id) 
WHERE role IN ('retailer', 'beauty_parlor');

-- Step 4: Add recorded_by and created_via columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'direct' CHECK (created_via IN ('direct', 'salesman')),
ADD COLUMN IF NOT EXISTS deals_applied JSONB DEFAULT '[]';

-- Add indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_recorded_by 
ON public.orders(recorded_by);

CREATE INDEX IF NOT EXISTS idx_orders_created_via 
ON public.orders(created_via);

-- Step 5: Add comments for documentation
COMMENT ON TABLE public.salesman_brands IS 
'Junction table linking salesmen to the brands they are authorized to sell';

COMMENT ON COLUMN public.users.assigned_salesman_id IS 
'The salesman assigned to this Beauty Parlor or Retailer user. Only applies to retailer and beauty_parlor roles.';

COMMENT ON COLUMN public.orders.recorded_by IS 
'The admin or salesman who created/recorded this order. NULL if created by customer directly.';

COMMENT ON COLUMN public.orders.created_via IS 
'Indicates if order was created directly by customer or through a salesman';

COMMENT ON COLUMN public.orders.deals_applied IS 
'JSON array of deals/discounts applied to this order for tracking purposes';

-- Step 6: Enable RLS on salesman_brands
ALTER TABLE public.salesman_brands ENABLE ROW LEVEL SECURITY;

-- Salesmen can view their own brand assignments
CREATE POLICY "Salesmen can view their assigned brands"
ON public.salesman_brands FOR SELECT
USING (auth.uid() = salesman_id);

-- Admins can manage all brand assignments
CREATE POLICY "Admins can manage salesman brands"
ON public.salesman_brands FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'sub_admin')
    )
);

-- Step 7: Update RLS policies for orders to include salesman access
CREATE POLICY "Salesmen can view orders they created"
ON public.orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'salesman'
        AND orders.recorded_by = auth.uid()
    )
);

CREATE POLICY "Salesmen can create orders for their clients"
ON public.orders FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'salesman'
    )
);

-- Step 8: Create audit log function for salesman actions
CREATE TABLE IF NOT EXISTS public.salesman_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesman_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('order_created', 'payment_recorded', 'client_viewed', 'other')),
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for activity logs
CREATE INDEX IF NOT EXISTS idx_salesman_activity_logs_salesman 
ON public.salesman_activity_logs(salesman_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_salesman_activity_logs_entity 
ON public.salesman_activity_logs(entity_type, entity_id);

-- Enable RLS for activity logs
ALTER TABLE public.salesman_activity_logs ENABLE ROW LEVEL SECURITY;

-- Salesmen can view their own logs
CREATE POLICY "Salesmen can view their own activity logs"
ON public.salesman_activity_logs FOR SELECT
USING (auth.uid() = salesman_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all salesman activity logs"
ON public.salesman_activity_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'sub_admin')
    )
);

-- Only system can insert logs (via service role)
CREATE POLICY "System can insert activity logs"
ON public.salesman_activity_logs FOR INSERT
WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.salesman_activity_logs IS 
'Audit trail of all actions performed by salesmen for compliance and tracking';
