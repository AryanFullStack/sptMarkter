-- Migration to add brand_id to orders table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id);

-- Optional: Add an index for better performance when filtering orders by brand
CREATE INDEX IF NOT EXISTS idx_orders_brand_id ON public.orders(brand_id);
