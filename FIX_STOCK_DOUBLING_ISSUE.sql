-- =====================================================
-- DEBUG: Stock Quantity Doubling Issue
-- =====================================================

-- Check your recent products
SELECT 
  id,
  name,
  product_code,
  stock_total,
  stock_available,
  stock_booked,
  auto_generate_barcodes,
  created_at,
  updated_at
FROM products
WHERE name LIKE '%Brooch%' OR name LIKE '%Mala%'
ORDER BY created_at DESC;

-- Check if items were auto-generated
SELECT 
  p.name as product_name,
  COUNT(pi.id) as generated_items_count,
  p.stock_available as stock_in_products_table
FROM products p
LEFT JOIN product_items pi ON pi.product_id = p.id
WHERE p.name LIKE '%Brooch%' OR p.name LIKE '%Mala%'
GROUP BY p.id, p.name, p.stock_available;

-- Check for any triggers on products table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products';

-- =====================================================
-- SOLUTION: Disable auto-barcode generation
-- =====================================================

-- Option 1: Disable for specific products
UPDATE products
SET auto_generate_barcodes = false
WHERE name LIKE '%Brooch%' OR name LIKE '%Mala%';

-- Option 2: Disable globally (if you don't want auto-generation)
UPDATE products
SET auto_generate_barcodes = false;

-- Option 3: Drop the trigger completely
DROP TRIGGER IF EXISTS trigger_auto_generate_barcodes ON products;

-- =====================================================
-- FIX: Correct the stock quantities
-- =====================================================

-- Fix Brooch product (200 → 100)
UPDATE products
SET 
  stock_total = 100,
  stock_available = 100
WHERE name LIKE '%Brooch%'
AND stock_available = 200;

-- Fix Mala product (200 → 100) 
UPDATE products
SET 
  stock_total = 100,
  stock_available = 100
WHERE name LIKE '%Mala%'
AND stock_available = 200;

-- Verify the fix
SELECT 
  name,
  product_code,
  stock_total,
  stock_available,
  auto_generate_barcodes
FROM products
WHERE name LIKE '%Brooch%' OR name LIKE '%Mala%'
ORDER BY name;

-- =====================================================
-- RECOMMENDED: Disable trigger permanently
-- =====================================================
-- The trigger is doubling stock because it's adding to 
-- stock_available instead of setting it

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_barcodes ON products;

COMMENT ON TABLE products IS 'Trigger trigger_auto_generate_barcodes has been removed to prevent stock doubling';
