-- =============================================
-- E-Commerce Tables for Spectrum Marketers
-- =============================================

-- 1. ADDRESSES TABLE
-- Stores user shipping/billing addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
  address_type VARCHAR(20) NOT NULL DEFAULT 'home' CHECK (address_type IN ('home', 'office', 'shop', 'beauty_parlor')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster user lookups
CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_is_default ON addresses(is_default);

-- RLS Policies for Addresses
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================

-- 2. ORDERS TABLE
-- Stores order information with partial payment support
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pricing
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  pending_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  
  -- Order Status
  -- Status options: pending, confirmed, processing, shipped, delivered, cancelled, pending_payment
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  
  -- Payment
  payment_method VARCHAR(50) NOT NULL DEFAULT 'full_payment', -- full_payment, partial_payment, cod
  payment_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, completed, failed
  
  -- Shipping
  shipping_address_id UUID REFERENCES addresses(id),
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tracking_number VARCHAR(255),
  
  -- Dates
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  customer_notes TEXT,
  admin_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- RLS Policies for Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'sub_admin')
    )
  );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'sub_admin')
    )
  );

-- =============================================

-- 3. ORDER_ITEMS TABLE
-- Stores individual items in each order
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  
  -- Product snapshot at time of order
  product_name VARCHAR(255) NOT NULL,
  product_slug VARCHAR(255),
  product_image TEXT,
  
  -- Pricing & Quantity
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10, 2) NOT NULL, -- Price at time of order
  subtotal DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * price) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- RLS Policies for Order Items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'sub_admin')
    )
  );

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Addresses updated_at trigger
CREATE OR REPLACE FUNCTION update_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_addresses_updated_at();

-- Orders updated_at trigger
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- =============================================
-- HELPER VIEWS (Optional but useful)
-- =============================================

-- View for orders with user details
CREATE OR REPLACE VIEW orders_with_details AS
SELECT 
  o.*,
  u.email as user_email,
  u.full_name as user_name,
  a.name as shipping_name,
  a.address_line1 as shipping_address,
  a.city as shipping_city,
  a.state as shipping_state,
  a.postal_code as shipping_postal_code,
  a.phone as shipping_phone,
  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
FROM orders o
LEFT JOIN users u ON u.id = o.user_id
LEFT JOIN addresses a ON a.id = o.shipping_address_id;

-- View for pending payment orders (Beauty Parlor/Retailer credit)
CREATE OR REPLACE VIEW pending_payment_orders AS
SELECT 
  o.*,
  u.email,
  u.full_name,
  u.role,
  (o.total_amount - o.paid_amount) as remaining_balance
FROM orders o
JOIN users u ON u.id = o.user_id
WHERE o.pending_amount > 0
  AND o.payment_status = 'pending'
ORDER BY o.created_at DESC;

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- You can uncomment and modify these to add test data
/*
-- Sample address
INSERT INTO addresses (user_id, name, phone, address_line1, city, state, postal_code, is_default)
VALUES (
  'YOUR_USER_ID_HERE',
  'John Doe',
  '+92-300-1234567',
  'House #123, Street 45, F-7 Markaz',
  'Islamabad',
  'Islamabad Capital Territory',
  '44000',
  true
);
*/

-- =============================================
-- NOTES
-- =============================================
/*
PARTIAL PAYMENT FLOW:
1. Beauty Parlor/Retailer creates order
2. Pays partial amount (e.g., Rs. 2000 of Rs. 5000)
3. Order status: 'pending_payment'
4. pending_amount: Rs. 3000
5. Sub-admin tracks pending payments
6. User pays remaining via dashboard or sub-admin marks as paid
7. Once full payment received, status changes to 'confirmed'

FULL PAYMENT FLOW:
1. Customer creates order
2. Pays full amount
3. Order status: 'confirmed'
4. pending_amount: 0
5. Proceeds to fulfillment
*/
