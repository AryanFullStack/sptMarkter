-- =============================================
-- MASTER SCHEMA - Spectrum Marketers E-Commerce
-- =============================================
-- This file defines the complete database structure.
-- Run this to ensure your database has all required tables and columns.

-- 1. USERS TABLE (Public Profile)
-- Linked to auth.users via id
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  role VARCHAR(50) DEFAULT 'customer', -- customer, retailer, beauty_parlor, admin, sub_admin
  approved BOOLEAN DEFAULT false, -- For retailers/parlors
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100), -- Made nullable since UI doesn't collect this field
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
  -- The critical constraint:
  address_type VARCHAR(20) NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'shop', 'beauty_parlor')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Addresses
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses" 
ON public.addresses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" 
ON public.addresses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" 
ON public.addresses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" 
ON public.addresses FOR DELETE USING (auth.uid() = user_id);


-- 3. PRODUCTS TABLE (Simplified for context)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  stock INTEGER DEFAULT 0,
  images TEXT[], -- Array of image URLs
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);


-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Financials
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Status flow
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, shipped, delivered, cancelled
  payment_method VARCHAR(50) NOT NULL DEFAULT 'full_payment',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', 
  
  -- Shipping Link
  shipping_address_id UUID REFERENCES public.addresses(id),
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tracking_number VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);


-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  
  product_name VARCHAR(255) NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- =============================================
-- DONE
-- =============================================
