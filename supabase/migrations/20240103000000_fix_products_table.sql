-- Drop existing products table if it exists
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;

-- Recreate products table with correct columns
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  price_customer DECIMAL(10, 2) NOT NULL,
  price_retailer DECIMAL(10, 2) NOT NULL,
  price_beauty_parlor DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample products
INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images, is_featured)
SELECT 
  'Hydrating Face Serum',
  'hydrating-face-serum',
  'Advanced hydrating serum with hyaluronic acid for all skin types',
  (SELECT id FROM public.categories WHERE slug = 'skincare' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'radiant-skin' LIMIT 1),
  2999.00,
  2499.00,
  2199.00,
  50,
  ARRAY['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80'],
  true;

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images, is_featured)
SELECT 
  'Vitamin C Brightening Cream',
  'vitamin-c-brightening-cream',
  'Brightening cream with vitamin C and antioxidants',
  (SELECT id FROM public.categories WHERE slug = 'skincare' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'radiant-skin' LIMIT 1),
  3499.00,
  2999.00,
  2699.00,
  45,
  ARRAY['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80'],
  true;

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images)
SELECT 
  'Argan Oil Hair Mask',
  'argan-oil-hair-mask',
  'Deep conditioning hair mask with pure argan oil',
  (SELECT id FROM public.categories WHERE slug = 'haircare' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'pro-hair' LIMIT 1),
  1999.00,
  1699.00,
  1499.00,
  60,
  ARRAY['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80'];

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images, is_featured)
SELECT 
  'Keratin Repair Shampoo',
  'keratin-repair-shampoo',
  'Professional keratin repair shampoo for damaged hair',
  (SELECT id FROM public.categories WHERE slug = 'haircare' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'pro-hair' LIMIT 1),
  1499.00,
  1299.00,
  1099.00,
  80,
  ARRAY['https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80'],
  true;

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images)
SELECT 
  'Matte Liquid Lipstick Set',
  'matte-liquid-lipstick-set',
  'Long-lasting matte liquid lipstick in 6 shades',
  (SELECT id FROM public.categories WHERE slug = 'makeup' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'elite-cosmetics' LIMIT 1),
  2499.00,
  2099.00,
  1899.00,
  40,
  ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80'];

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images, is_featured)
SELECT 
  'HD Foundation Palette',
  'hd-foundation-palette',
  'Professional HD foundation palette with 12 shades',
  (SELECT id FROM public.categories WHERE slug = 'makeup' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'elite-cosmetics' LIMIT 1),
  3999.00,
  3499.00,
  3199.00,
  35,
  ARRAY['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80'],
  true;

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images)
SELECT 
  'Luxury Perfume Collection',
  'luxury-perfume-collection',
  'Premium perfume collection with 3 signature scents',
  (SELECT id FROM public.categories WHERE slug = 'fragrances' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'luxe-beauty' LIMIT 1),
  5999.00,
  5299.00,
  4899.00,
  25,
  ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'];

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images)
SELECT 
  'Professional Makeup Brush Set',
  'professional-makeup-brush-set',
  'Complete 15-piece professional makeup brush set',
  (SELECT id FROM public.categories WHERE slug = 'tools-accessories' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'elite-cosmetics' LIMIT 1),
  2999.00,
  2599.00,
  2299.00,
  55,
  ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80'];

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images)
SELECT 
  'Anti-Aging Night Cream',
  'anti-aging-night-cream',
  'Advanced anti-aging night cream with retinol',
  (SELECT id FROM public.categories WHERE slug = 'skincare' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'radiant-skin' LIMIT 1),
  4499.00,
  3999.00,
  3699.00,
  30,
  ARRAY['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&q=80'];

INSERT INTO public.products (name, slug, description, category_id, brand_id, price_customer, price_retailer, price_beauty_parlor, stock_quantity, images)
SELECT 
  'Hair Growth Serum',
  'hair-growth-serum',
  'Clinically proven hair growth serum with biotin',
  (SELECT id FROM public.categories WHERE slug = 'haircare' LIMIT 1),
  (SELECT id FROM public.brands WHERE slug = 'pro-hair' LIMIT 1),
  2799.00,
  2399.00,
  2099.00,
  42,
  ARRAY['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80'];
