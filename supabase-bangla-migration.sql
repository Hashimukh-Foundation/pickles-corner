-- ============================================================
-- MIGRATION: Add Bangla (Bengali) language fields
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Products: Bangla name, description, category
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_bn       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS description_bn TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS category_bn   TEXT DEFAULT NULL;

-- Blogs: Bangla title, excerpt, content
ALTER TABLE blogs
  ADD COLUMN IF NOT EXISTS title_bn   TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS excerpt_bn TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_bn TEXT DEFAULT NULL;

-- Optional: update sample data with Bangla translations
UPDATE products SET
  name_bn = 'প্রিমিয়াম বাদাম',
  description_bn = 'ক্যালিফোর্নিয়ার খামার থেকে সংগ্রহ করা মচমচে, ভাজা বাদাম।',
  category_bn = 'বাদাম'
WHERE name = 'Premium Almonds';

UPDATE products SET
  name_bn = 'অর্গানিক কাজু',
  description_bn = 'লবণ ছাড়া মাখনের মতো পুরো কাজু।',
  category_bn = 'বাদাম'
WHERE name = 'Organic Cashews';

UPDATE products SET
  name_bn = 'ডার্ক চকলেট মিক্স',
  description_bn = 'প্রিমিয়াম ডার্ক চকলেট এবং বাদামের মিশ্রণ।',
  category_bn = 'মিক্স'
WHERE name = 'Dark Chocolate Mix';
