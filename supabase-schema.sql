-- ============================================================
-- ECOMMERCE SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor (in order)
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCT SIZES TABLE (each product can have multiple sizes in grams)
CREATE TABLE product_sizes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_grams INTEGER NOT NULL,        -- e.g. 100, 250, 500, 1000
  price_override NUMERIC(10, 2),      -- optional: price specific to this size
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT,                           -- optional stock-keeping unit code
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BLOGS TABLE
CREATE TABLE blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author TEXT NOT NULL DEFAULT 'Admin',
  cover_image_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVIEWS TABLE
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_product_sizes_product_id ON product_sizes(product_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_published ON blogs(is_published);
CREATE INDEX idx_products_active ON products(is_active);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read active products
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Public can read product sizes
CREATE POLICY "Public can read product sizes"
  ON product_sizes FOR SELECT
  USING (true);

-- Public can read published blogs
CREATE POLICY "Public can read published blogs"
  ON blogs FOR SELECT
  USING (is_published = true);

-- Public can read approved reviews
CREATE POLICY "Public can read approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

-- Public can submit reviews
CREATE POLICY "Public can submit reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- Admin full access (authenticated users — you can restrict by email/role later)
CREATE POLICY "Authenticated full access to products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to product_sizes"
  ON product_sizes FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to blogs"
  ON blogs FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated full access to reviews"
  ON reviews FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- SAMPLE DATA (optional — delete if not needed)
-- ============================================================
INSERT INTO products (name, description, price, category, image_url, is_active) VALUES
  ('Premium Almonds', 'Crunchy, roasted almonds sourced from California farms.', 12.99, 'Nuts', 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=400', true),
  ('Organic Cashews', 'Buttery, whole cashews with no added salt.', 15.49, 'Nuts', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', true),
  ('Dark Chocolate Mix', 'A premium dark chocolate and nut blend.', 18.00, 'Mixes', 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400', true);

INSERT INTO product_sizes (product_id, size_grams, price_override, stock_quantity, sku)
SELECT id, 100, 12.99, 50, 'ALM-100' FROM products WHERE name = 'Premium Almonds'
UNION ALL
SELECT id, 250, 24.99, 30, 'ALM-250' FROM products WHERE name = 'Premium Almonds'
UNION ALL
SELECT id, 500, 44.99, 15, 'ALM-500' FROM products WHERE name = 'Premium Almonds';

INSERT INTO product_sizes (product_id, size_grams, price_override, stock_quantity, sku)
SELECT id, 100, 15.49, 40, 'CSH-100' FROM products WHERE name = 'Organic Cashews'
UNION ALL
SELECT id, 250, 29.99, 20, 'CSH-250' FROM products WHERE name = 'Organic Cashews';

INSERT INTO blogs (title, slug, content, excerpt, author, is_published, published_at) VALUES
  ('Why Nuts Are a Superfood', 'why-nuts-are-a-superfood',
   'Nuts are packed with healthy fats, protein, fiber, vitamins, and minerals...', 
   'Discover why adding nuts to your daily diet can transform your health.',
   'Admin', true, NOW()),
  ('How to Store Your Dry Fruits', 'how-to-store-dry-fruits',
   'Proper storage of dry fruits and nuts is key to maintaining freshness...',
   'Learn the best practices for keeping your nuts and dry fruits fresh.',
   'Admin', true, NOW());
