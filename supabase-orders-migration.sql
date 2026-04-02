-- ============================================================
-- MIGRATION: Order System (Cart + COD)
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. ORDER NUMBER SEQUENCE (human-readable: ORD-0001, ORD-0002...)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- 2. ORDERS TABLE
CREATE TABLE orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number      TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0'),
  -- Customer info
  customer_name     TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_address  TEXT NOT NULL,
  customer_city     TEXT,
  delivery_note     TEXT,
  -- Financials
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_charge   NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  -- Status flow: pending → confirmed → processing → shipped → delivered | cancelled
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  -- Payment
  payment_method    TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod')),
  payment_status    TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','paid')),
  -- Optional admin note
  admin_note        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDER ITEMS TABLE
-- We snapshot product name & price at order time so changes don't affect history
CREATE TABLE order_items (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id          UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- Snapshot of product at time of order
  product_id        UUID REFERENCES products(id) ON DELETE SET NULL,
  product_size_id   UUID REFERENCES product_sizes(id) ON DELETE SET NULL,
  product_name      TEXT NOT NULL,
  product_name_bn   TEXT,
  size_grams        INTEGER NOT NULL,
  unit_price        NUMERIC(10,2) NOT NULL,   -- final price (after discount)
  original_price    NUMERIC(10,2),            -- price before discount (for display)
  quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal          NUMERIC(10,2) NOT NULL,   -- unit_price * quantity
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 5. AUTO updated_at TRIGGER
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. ROW LEVEL SECURITY
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public can INSERT orders (place an order)
CREATE POLICY "Public can place orders"
  ON orders FOR INSERT WITH CHECK (true);

-- Public can INSERT order items
CREATE POLICY "Public can insert order items"
  ON order_items FOR INSERT WITH CHECK (true);

-- Public can read their orders (by order_number — used on confirmation page)
CREATE POLICY "Public can read orders by order_number"
  ON orders FOR SELECT USING (true);

-- Public can read order items
CREATE POLICY "Public can read order items"
  ON order_items FOR SELECT USING (true);

-- Authenticated (admin) full access
CREATE POLICY "Authenticated full access to orders"
  ON orders FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to order_items"
  ON order_items FOR ALL USING (auth.role() = 'authenticated');
