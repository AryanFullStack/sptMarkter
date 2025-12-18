-- Migration: Independent Salesman Ledger & Links
-- Date: 2025-12-18
-- Description: Implements per-salesman/shop/brand ledgers. Relies on existing 'pending_amount_limit' in users table.

-- Step 1: Add brand_id to orders to link orders to brands for ledger tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_brand 
ON public.orders(brand_id);

COMMENT ON COLUMN public.orders.brand_id IS 
'The brand this order belongs to. Essential for updating the correct per-brand ledger.';


-- Step 2: Create salesman_shop_ledger table
CREATE TABLE IF NOT EXISTS public.salesman_shop_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salesman_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    
    pending_amount DECIMAL(10, 2) DEFAULT 0,
    total_sales DECIMAL(10, 2) DEFAULT 0,
    total_collected DECIMAL(10, 2) DEFAULT 0,
    
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(salesman_id, shop_id, brand_id)
);

CREATE INDEX IF NOT EXISTS idx_ledger_salesman_shop 
ON public.salesman_shop_ledger(salesman_id, shop_id);

CREATE INDEX IF NOT EXISTS idx_ledger_shop_global 
ON public.salesman_shop_ledger(shop_id);

-- Enable RLS
ALTER TABLE public.salesman_shop_ledger ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Salesmen can view their own ledgers"
ON public.salesman_shop_ledger FOR SELECT
USING (auth.uid() = salesman_id);

CREATE POLICY "Shops can view their own ledgers"
ON public.salesman_shop_ledger FOR SELECT
USING (auth.uid() = shop_id);

CREATE POLICY "Admins can view all ledgers"
ON public.salesman_shop_ledger FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role IN ('admin', 'sub_admin')
    )
);

-- Step 3: Trigger to Update Ledger on Order Creation
CREATE OR REPLACE FUNCTION update_ledger_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Only relevant if order has a salesman and a brand
    IF NEW.recorded_by IS NOT NULL AND NEW.brand_id IS NOT NULL THEN
        -- Check if recorder is a salesman (optimization: could just upsert)
        -- Upsert ledger
        INSERT INTO public.salesman_shop_ledger (salesman_id, shop_id, brand_id, pending_amount, total_sales, last_updated)
        VALUES (
            NEW.recorded_by, 
            NEW.user_id, 
            NEW.brand_id, 
            NEW.total_amount, -- initial pending is total
            NEW.total_amount, 
            NOW()
        )
        ON CONFLICT (salesman_id, shop_id, brand_id) 
        DO UPDATE SET 
            pending_amount = public.salesman_shop_ledger.pending_amount + EXCLUDED.pending_amount,
            total_sales = public.salesman_shop_ledger.total_sales + EXCLUDED.total_sales,
            last_updated = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ledger_order ON public.orders;
CREATE TRIGGER trg_update_ledger_order
    AFTER INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_ledger_on_order();


-- Step 4: Trigger to Update Ledger on Payment
CREATE OR REPLACE FUNCTION update_ledger_on_payment()
RETURNS TRIGGER AS $$
DECLARE
    target_salesman UUID;
    target_shop UUID;
    target_brand UUID;
    payment_val DECIMAL(10, 2);
BEGIN
    -- Determine Salesman/Shop/Brand context
    -- Case 1: Payment linked to Order
    IF NEW.order_id IS NOT NULL THEN
        SELECT recorded_by, user_id, brand_id INTO target_salesman, target_shop, target_brand
        FROM public.orders 
        WHERE id = NEW.order_id;
    -- Case 2: Direct Payment (if implemented in future, irrelevant for now)
    ELSE
        -- Fallback or ignore
        RETURN NEW;
    END IF;

    -- Only proceed if we found a salesman for this order (ledger owner)
    IF target_salesman IS NOT NULL AND target_brand IS NOT NULL THEN
        payment_val := NEW.amount;
        
        -- Update Ledger: Reduce pending, increase collected
        UPDATE public.salesman_shop_ledger
        SET 
            pending_amount = pending_amount - payment_val,
            total_collected = total_collected + payment_val,
            last_updated = NOW()
        WHERE salesman_id = target_salesman 
          AND shop_id = target_shop 
          AND brand_id = target_brand;
          
        -- If no ledger exists (shouldn't happen if order created it), we might want to log warning
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_ledger_payment ON public.payments;
CREATE TRIGGER trg_update_ledger_payment
    AFTER INSERT ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_ledger_on_payment();

-- Step 5: Views for Admin (Updated to use pending_amount_limit)
CREATE OR REPLACE VIEW shop_pending_summary AS
SELECT 
    shop_id,
    s.full_name as shop_name,
    s.phone as shop_phone,
    s.pending_amount_limit,
    SUM(sl.pending_amount) as total_pending_used,
    (s.pending_amount_limit - COALESCE(SUM(sl.pending_amount), 0)) as remaining_limit
FROM public.salesman_shop_ledger sl
JOIN public.users s ON sl.shop_id = s.id
GROUP BY shop_id, s.full_name, s.phone, s.pending_amount_limit;

GRANT SELECT ON shop_pending_summary TO authenticated;
