ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pending_payment_due_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS initial_payment_due_date TIMESTAMP WITH TIME ZONE;
