-- ============================================================
-- MIGRATION: Add discount support to product_sizes
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE product_sizes
  ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
  ADD COLUMN IF NOT EXISTS discount_expires_at TIMESTAMPTZ DEFAULT NULL;

-- Helper view: products with their best active discount
CREATE OR REPLACE VIEW product_sizes_with_discount AS
SELECT
  ps.*,
  CASE
    WHEN ps.discount_percent IS NOT NULL
     AND ps.discount_percent > 0
     AND (ps.discount_expires_at IS NULL OR ps.discount_expires_at > NOW())
    THEN true
    ELSE false
  END AS discount_active,
  CASE
    WHEN ps.discount_percent IS NOT NULL
     AND ps.discount_percent > 0
     AND (ps.discount_expires_at IS NULL OR ps.discount_expires_at > NOW())
    THEN ROUND(
      COALESCE(ps.price_override, (SELECT price FROM products WHERE id = ps.product_id))
      * (1 - ps.discount_percent / 100.0),
      2
    )
    ELSE COALESCE(ps.price_override, (SELECT price FROM products WHERE id = ps.product_id))
  END AS final_price
FROM product_sizes ps;
