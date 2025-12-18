-- Migration: Enhance Payment System for Partial Payments
-- Date: 2025-12-17
-- Description: Enhances payments table for detailed partial payment tracking with timeline

-- Step 1: Add additional columns to payments table for better tracking
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_sequence INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10, 2) DEFAULT 0;

-- Step 2: Make notes column NOT NULL for accountability
-- First set default for existing NULL values
UPDATE public.payments SET notes = 'Payment received' WHERE notes IS NULL;

-- Now alter the column
ALTER TABLE public.payments 
ALTER COLUMN notes SET NOT NULL,
ALTER COLUMN notes SET DEFAULT 'Payment received';

-- Step 3: Add payment_status to individual payments
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' 
CHECK (status IN ('pending', 'completed', 'failed', 'refunded'));

-- Step 4: Create function to auto-calculate payment sequence
CREATE OR REPLACE FUNCTION set_payment_sequence()
RETURNS TRIGGER AS $$
DECLARE
    next_seq INTEGER;
BEGIN
    -- Get the next sequence number for this order
    SELECT COALESCE(MAX(payment_sequence), 0) + 1 
    INTO next_seq
    FROM public.payments 
    WHERE order_id = NEW.order_id;
    
    NEW.payment_sequence := next_seq;
    
    -- Get order total for reference
    SELECT total_amount INTO NEW.order_total
    FROM public.orders 
    WHERE id = NEW.order_id;
    
    -- Calculate remaining balance after this payment
    SELECT COALESCE(SUM(amount), 0) 
    INTO NEW.remaining_balance
    FROM public.payments 
    WHERE order_id = NEW.order_id 
    AND status = 'completed';
    
    NEW.remaining_balance := NEW.order_total - NEW.remaining_balance - NEW.amount;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set payment sequence
DROP TRIGGER IF EXISTS set_payment_sequence_trigger ON public.payments;
CREATE TRIGGER set_payment_sequence_trigger
    BEFORE INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION set_payment_sequence();

-- Step 5: Create function to auto-update order pending amount and payment status
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10, 2);
    order_total DECIMAL(10, 2);
    new_pending DECIMAL(10, 2);
    new_status TEXT;
BEGIN
    -- Get total paid for this order
    SELECT COALESCE(SUM(amount), 0) 
    INTO total_paid
    FROM public.payments 
    WHERE order_id = NEW.order_id 
    AND status = 'completed';
    
    -- Get order total
    SELECT total_amount INTO order_total
    FROM public.orders 
    WHERE id = NEW.order_id;
    
    -- Calculate new pending amount
    new_pending := order_total - total_paid;
    
    -- Determine payment status
    IF total_paid >= order_total THEN
        new_status := 'paid';
        new_pending := 0;
    ELSIF total_paid > 0 THEN
        new_status := 'partial';
    ELSE
        new_status := 'pending';
    END IF;
    
    -- Update the order
    UPDATE public.orders 
    SET 
        paid_amount = total_paid,
        pending_amount = new_pending,
        payment_status = new_status,
        updated_at = NOW()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update order status after payment
DROP TRIGGER IF EXISTS update_order_payment_status_trigger ON public.payments;
CREATE TRIGGER update_order_payment_status_trigger
    AFTER INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payments_order_sequence 
ON public.payments(order_id, payment_sequence);

CREATE INDEX IF NOT EXISTS idx_payments_recorded_by 
ON public.payments(recorded_by);

CREATE INDEX IF NOT EXISTS idx_payments_status 
ON public.payments(status);

CREATE INDEX IF NOT EXISTS idx_payments_created_at 
ON public.payments(created_at DESC);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.payments.payment_sequence IS 
'Auto-incremented sequence number for payments on the same order (1st payment, 2nd payment, etc.)';

COMMENT ON COLUMN public.payments.remaining_balance IS 
'Remaining balance on the order after this payment was applied';

COMMENT ON COLUMN public.payments.order_total IS 
'Snapshot of order total at time of payment for reference';

COMMENT ON COLUMN public.payments.status IS 
'Status of this individual payment (completed, pending, failed, refunded)';

-- Step 8: Create view for payment timeline
CREATE OR REPLACE VIEW payment_timeline AS
SELECT 
    p.id,
    p.order_id,
    o.order_number,
    o.user_id,
    p.payment_sequence,
    p.amount,
    p.payment_method,
    p.notes,
    p.created_at,
    p.recorded_by,
    u.email as recorded_by_email,
    p.order_total,
    p.remaining_balance,
    p.status,
    o.payment_status as order_payment_status
FROM public.payments p
LEFT JOIN public.orders o ON p.order_id = o.id
LEFT JOIN public.users u ON p.recorded_by = u.id
ORDER BY p.created_at DESC;

-- Grant access to view
GRANT SELECT ON payment_timeline TO authenticated;

COMMENT ON VIEW payment_timeline IS 
'Comprehensive view of payment timeline with order and user context for easy querying';
