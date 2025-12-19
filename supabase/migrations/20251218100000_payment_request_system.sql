-- Migration: Payment Request System (Pending Payments & Approvals)
-- Date: 2025-12-18

-- Step 1: Update update_order_payment_status function to handle UPDATES and ignore pending payments
CREATE OR REPLACE FUNCTION update_order_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(10, 2);
    order_total DECIMAL(10, 2);
    new_pending DECIMAL(10, 2);
    new_status TEXT;
    target_order_id UUID;
BEGIN
    -- Determine target order ID
    IF TG_OP = 'DELETE' THEN
        target_order_id := OLD.order_id;
    ELSE
        target_order_id := NEW.order_id;
    END IF;

    -- Get total paid for this order (ONLY COMPLETED PAYMENTS)
    SELECT COALESCE(SUM(amount), 0) 
    INTO total_paid
    FROM public.payments 
    WHERE order_id = target_order_id 
    AND status = 'completed';
    
    -- Get order total
    SELECT total_amount INTO order_total
    FROM public.orders 
    WHERE id = target_order_id;
    
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
    WHERE id = target_order_id;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to handle INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS update_order_payment_status_trigger ON public.payments;
CREATE TRIGGER update_order_payment_status_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_payment_status();


-- Step 2: Update update_ledger_on_payment function to handle UPDATES and only 'completed' status
CREATE OR REPLACE FUNCTION update_ledger_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    target_salesman UUID;
    target_shop UUID;
    target_brand UUID;
    total_completed_payment DECIMAL(10, 2);
    total_all_sales DECIMAL(10, 2);
    order_rec RECORD;
BEGIN
    -- Logic: Recalculate ledger for the salesman/shop/brand combination
    -- This is safer than incremental updates when status changes from pending to completed
    
    -- Determine context from whichever order this payment belongs to
    IF TG_OP = 'DELETE' THEN
        SELECT recorded_by, user_id, brand_id INTO target_salesman, target_shop, target_brand
        FROM public.orders WHERE id = OLD.order_id;
    ELSE
        SELECT recorded_by, user_id, brand_id INTO target_salesman, target_shop, target_brand
        FROM public.orders WHERE id = NEW.order_id;
    END IF;

    -- Only proceed if we have a full context
    IF target_salesman IS NOT NULL AND target_brand IS NOT NULL AND target_shop IS NOT NULL THEN
        
        -- 1. Calculate TOTAL COMPLETED PAYMENTS for this shop/salesman/brand
        SELECT COALESCE(SUM(p.amount), 0) INTO total_completed_payment
        FROM public.payments p
        JOIN public.orders o ON p.order_id = o.id
        WHERE o.recorded_by = target_salesman
          AND o.user_id = target_shop
          AND o.brand_id = target_brand
          AND p.status = 'completed';

        -- 2. Calculate TOTAL SALES for this shop/salesman/brand
        SELECT COALESCE(SUM(total_amount), 0) INTO total_all_sales
        FROM public.orders
        WHERE recorded_by = target_salesman
          AND user_id = target_shop
          AND brand_id = target_brand
          AND status != 'cancelled';

        -- 3. Update Ledger
        UPDATE public.salesman_shop_ledger
        SET 
            total_sales = total_all_sales,
            total_collected = total_completed_payment,
            pending_amount = total_all_sales - total_completed_payment,
            last_updated = NOW()
        WHERE salesman_id = target_salesman 
          AND shop_id = target_shop 
          AND brand_id = target_brand;
          
        -- If ledger doesn't exist, we skip (it should be created by order trigger)
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to handle INSERT, UPDATE, DELETE
DROP TRIGGER IF EXISTS trg_update_ledger_payment ON public.payments;
CREATE TRIGGER trg_update_ledger_payment
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_ledger_on_payment();

-- Step 3: Add assigned_salesman_id to orders if not exists (redundancy check)
-- This facilitates easier querying for salesman payment requests
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_salesman_id') THEN
        ALTER TABLE public.orders ADD COLUMN assigned_salesman_id UUID REFERENCES public.users(id);
    END IF;
END $$;

-- Populate assigned_salesman_id from recorded_by for existing orders
UPDATE public.orders SET assigned_salesman_id = recorded_by WHERE assigned_salesman_id IS NULL AND recorded_by IS NOT NULL;
