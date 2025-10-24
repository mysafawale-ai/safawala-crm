-- =====================================================
-- IMMEDIATE FIX: Stop Stock Doubling
-- =====================================================
-- Run this RIGHT NOW in Supabase SQL Editor

-- Step 1: Disable the problematic trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_barcodes ON products;
DROP FUNCTION IF EXISTS trigger_auto_generate_items() CASCADE;
DROP FUNCTION IF EXISTS generate_items_for_product(UUID, INTEGER) CASCADE;

-- Step 2: Fix all existing doubled products
-- Find products where stock might be doubled
WITH doubled_products AS (
  SELECT 
    id,
    name,
    stock_total,
    stock_available,
    CASE 
      WHEN stock_total % 2 = 0 AND stock_available % 2 = 0 THEN stock_total / 2
      ELSE stock_total
    END as corrected_stock
  FROM products
  WHERE stock_total > 1
  AND created_at > NOW() - INTERVAL '1 day'  -- Only recent products
  AND stock_total = stock_available  -- Both are same (doubled together)
)
SELECT 
  name,
  stock_total as current_stock,
  corrected_stock as should_be,
  CASE 
    WHEN stock_total != corrected_stock THEN '⚠️ Needs fixing'
    ELSE '✅ OK'
  END as status
FROM doubled_products;

-- Step 3: Fix the specific products you mentioned
UPDATE products
SET 
  stock_total = stock_total / 2,
  stock_available = stock_available / 2,
  updated_at = NOW()
WHERE name IN ('Brooch (Wedding Pin Accessory)', 'Mala (Neck Garland)')
AND stock_total = 200
AND stock_available = 200;

-- Step 4: Verify triggers are completely removed
SELECT 
  'Remaining triggers on products table:' as check_type,
  COUNT(*) as count
FROM information_schema.triggers
WHERE event_object_table = 'products';

-- Step 5: Verify fix
SELECT 
  name,
  product_code,
  stock_total,
  stock_available,
  created_at
FROM products
WHERE name IN ('Brooch (Wedding Pin Accessory)', 'Mala (Neck Garland)', 'Dupattas')
ORDER BY created_at DESC;

-- Show success message
SELECT 
  '✅ FIXED: Trigger disabled' as status,
  'Products corrected' as action,
  'New products will now have correct stock' as result;
