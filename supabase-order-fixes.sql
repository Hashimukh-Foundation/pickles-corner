-- ============================================================
-- MIGRATION: Fix order IDs + Stock deduction triggers
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- PART 1: Unpredictable Order Numbers
--
-- Old format: ORD-0001 (sequential, guessable)
-- New format: PC-A3F8C2D1 (random 8-char hex, unguessable)
--
-- Change 'PC' to your store prefix if needed (e.g. 'NS', 'PC')
-- ─────────────────────────────────────────────────────────────

-- Drop the old sequential default
ALTER TABLE orders
  ALTER COLUMN order_number
  SET DEFAULT 'PC-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));

-- Drop the now-unused sequence (safe to skip if it doesn't exist yet)
DROP SEQUENCE IF EXISTS order_number_seq;


-- ─────────────────────────────────────────────────────────────
-- PART 2: Stock Deduction on Order Placement
--
-- When order items are inserted (i.e. a customer places an order),
-- immediately reduce stock_quantity for each product size.
-- Uses GREATEST(0, ...) to never go below zero.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION deduct_stock_on_order_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_size_id IS NOT NULL THEN
    UPDATE product_sizes
    SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity)
    WHERE id = NEW.product_size_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_deduct_stock ON order_items;
CREATE TRIGGER trg_deduct_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION deduct_stock_on_order_item();


-- ─────────────────────────────────────────────────────────────
-- PART 3: Stock Restoration on Cancellation
--
-- When an order's status changes TO 'cancelled' from any other
-- status, restore all stock quantities for its items.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION restore_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when transitioning INTO cancelled
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE product_sizes ps
    SET stock_quantity = ps.stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_size_id IS NOT NULL
      AND oi.product_size_id = ps.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_restore_stock_on_cancel ON orders;
CREATE TRIGGER trg_restore_stock_on_cancel
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION restore_stock_on_cancel();


-- ─────────────────────────────────────────────────────────────
-- VERIFICATION (optional — run to confirm triggers exist)
-- ─────────────────────────────────────────────────────────────
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name IN ('trg_deduct_stock', 'trg_restore_stock_on_cancel');
