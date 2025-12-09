CREATE TYPE user_role AS ENUM ('local_customer', 'retailer', 'beauty_parlor', 'sub_admin', 'admin');
CREATE TYPE order_status AS ENUM ('created', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'card', 'online');

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'local_customer';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credit_limit numeric(10,2) DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS credit_used numeric(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS brands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    description text,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    image_url text,
    parent_id uuid REFERENCES categories(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
    category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
    sku text UNIQUE,
    beauty_price numeric(10,2) NOT NULL,
    retailer_price numeric(10,2) NOT NULL,
    customer_price numeric(10,2) NOT NULL,
    stock_quantity integer DEFAULT 0,
    low_stock_threshold integer DEFAULT 10,
    images jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS addresses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    phone text NOT NULL,
    address_line1 text NOT NULL,
    address_line2 text,
    city text NOT NULL,
    state text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'Pakistan',
    is_default boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    description text,
    discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value numeric(10,2) NOT NULL,
    min_order_amount numeric(10,2) DEFAULT 0,
    max_discount_amount numeric(10,2),
    usage_limit integer,
    usage_count integer DEFAULT 0,
    valid_from timestamptz DEFAULT now(),
    valid_until timestamptz,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number text NOT NULL UNIQUE,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status order_status DEFAULT 'created',
    items jsonb NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
    total_amount numeric(10,2) NOT NULL,
    paid_amount numeric(10,2) DEFAULT 0,
    pending_amount numeric(10,2) DEFAULT 0,
    shipping_address jsonb NOT NULL,
    billing_address jsonb,
    assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    amount numeric(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    transaction_id text,
    recorded_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    quantity_change integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    reason text,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    changes jsonb,
    ip_address text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info',
    is_read boolean DEFAULT false,
    link text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at BEFORE UPDATE ON brands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO brands (name, slug, description, is_active) VALUES
('Spectrum Beauty', 'spectrum-beauty', 'Premium beauty products', true),
('Glow Essentials', 'glow-essentials', 'Natural skincare solutions', true),
('Luxe Cosmetics', 'luxe-cosmetics', 'High-end makeup collection', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, is_active) VALUES
('Skincare', 'skincare', 'Face and body care products', true),
('Makeup', 'makeup', 'Cosmetics and beauty products', true),
('Haircare', 'haircare', 'Hair treatment and styling', true),
('Fragrances', 'fragrances', 'Perfumes and body mists', true)
ON CONFLICT (slug) DO NOTHING;
