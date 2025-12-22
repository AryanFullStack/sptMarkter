-- Create salesman_shop_assignments table
CREATE TABLE IF NOT EXISTS public.salesman_shop_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesman_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recurring_day VARCHAR(20) CHECK (recurring_day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  assignment_date DATE, -- For specific date overrides or non-recurring
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent duplicate assignment for same day/date
  CONSTRAINT unique_assignment_recurring UNIQUE (salesman_id, shop_id, recurring_day),
  CONSTRAINT unique_assignment_date UNIQUE (salesman_id, shop_id, assignment_date)
);

-- RLS for Assignments
ALTER TABLE public.salesman_shop_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage assignments" 
ON public.salesman_shop_assignments 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sub_admin'))
);

CREATE POLICY "Salesmen can view own assignments" 
ON public.salesman_shop_assignments 
FOR SELECT 
USING (salesman_id = auth.uid());

-- Index for performance
CREATE INDEX idx_assignments_salesman ON public.salesman_shop_assignments(salesman_id);
CREATE INDEX idx_assignments_shop ON public.salesman_shop_assignments(shop_id);
CREATE INDEX idx_assignments_day ON public.salesman_shop_assignments(recurring_day);

-- Update Orders RLS to allow salesmen to view orders they created
-- (Assuming 'recorded_by' is the column tracking who made the order)
DROP POLICY IF EXISTS "Salesmen can view orders they created" ON public.orders;
CREATE POLICY "Salesmen can view orders they created" 
ON public.orders 
FOR SELECT 
USING (recorded_by = auth.uid());

-- Ensure Salesmen CANNOT see orders they didn't create (even if for assigned shop)
-- The above policy is additive. The existing policy "Users can view own orders" (auth.uid() = user_id) covers the shop owner.
-- This new policy covers the salesman.
-- Admin should have a policy too (usually handled by service role or specific admin policy).

-- Create Policy for Admins to view all orders (if not already exists)
-- CREATE POLICY "Admins can view all orders" ON public.orders USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'sub_admin')));

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_salesman_assignments_modtime
    BEFORE UPDATE ON public.salesman_shop_assignments
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
