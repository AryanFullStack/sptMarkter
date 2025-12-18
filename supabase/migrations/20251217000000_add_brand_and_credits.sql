-- Create Brands Table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Brands
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Brands are viewable by everyone" 
ON public.brands FOR SELECT USING (true);

CREATE POLICY "Admins can manage brands" 
ON public.brands FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Add brand_id to Products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;

-- Create User Credits Table
CREATE TABLE IF NOT EXISTS public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0,
  used_credit DECIMAL(10, 2) DEFAULT 0,
  pending_credit DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for User Credits
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own credits" 
ON public.user_credits FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user credits" 
ON public.user_credits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can manage user credits" 
ON public.user_credits FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- Create Credit Transactions Table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('add', 'deduct', 'usage', 'adjustment')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performed_by UUID REFERENCES auth.users(id) -- Admin who performed the action, or NULL if system/usage
);

-- RLS for Credit Transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions" 
ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" 
ON public.credit_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can insert transactions" 
ON public.credit_transactions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'admin')
);
