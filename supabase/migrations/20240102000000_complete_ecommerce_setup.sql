-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'retailer', 'beauty_parlor', 'admin', 'sub_admin')),
  credit_limit DECIMAL(10, 2) DEFAULT 0,
  credit_used DECIMAL(10, 2) DEFAULT 0,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES public.categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
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

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online', 'partial')),
  shipping_address_id UUID REFERENCES public.addresses(id),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  recorded_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  min_order_amount DECIMAL(10, 2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cart table
CREATE TABLE IF NOT EXISTS public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create wishlist table
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Insert categories
INSERT INTO public.categories (name, slug, description) VALUES
('Skincare', 'skincare', 'Premium skincare products'),
('Haircare', 'haircare', 'Professional haircare solutions'),
('Makeup', 'makeup', 'High-quality makeup products'),
('Fragrances', 'fragrances', 'Luxury fragrances'),
('Tools & Accessories', 'tools-accessories', 'Beauty tools and accessories')
ON CONFLICT (slug) DO NOTHING;

-- Insert brands
INSERT INTO public.brands (name, slug, description) VALUES
('Luxe Beauty', 'luxe-beauty', 'Premium beauty brand'),
('Glow Essentials', 'glow-essentials', 'Natural beauty products'),
('Pro Hair', 'pro-hair', 'Professional haircare'),
('Radiant Skin', 'radiant-skin', 'Advanced skincare'),
('Elite Cosmetics', 'elite-cosmetics', 'Luxury cosmetics')
ON CONFLICT (slug) DO NOTHING;

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
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'hydrating-face-serum');

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
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'vitamin-c-brightening-cream');

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
  ARRAY['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'argan-oil-hair-mask');

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
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'keratin-repair-shampoo');

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
  ARRAY['https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'matte-liquid-lipstick-set');

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
  true
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'hd-foundation-palette');

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
  ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'luxury-perfume-collection');

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
  ARRAY['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'professional-makeup-brush-set');

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
  ARRAY['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'anti-aging-night-cream');

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
  ARRAY['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&q=80']
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'hair-growth-serum');
