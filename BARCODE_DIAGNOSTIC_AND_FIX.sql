-- ============================================
-- BARCODE DIAGNOSTIC & FIX SCRIPT
-- Testing barcode: SAF562036
-- ============================================

-- Step 1: Check if barcodes table exists
-- SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'barcodes');

-- Step 2: Check current state of barcode SAF562036
SELECT 
  b.id,
  b.barcode_number,
  b.product_id,
  b.barcode_type,
  b.is_active,
  p.id as product_id_check,
  p.name as product_name,
  p.sale_price,
  p.rental_price,
  p.security_deposit,
  p.franchise_id,
  b.created_at
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
WHERE b.barcode_number = 'SAF562036'
ORDER BY b.created_at DESC;

-- Step 3: Check if barcode exists in products table directly
SELECT 
  id,
  name,
  barcode,
  sku,
  sale_price,
  rental_price,
  security_deposit,
  stock_quantity,
  franchise_id,
  is_active
FROM products
WHERE barcode = 'SAF562036' OR sku = 'SAF562036'
LIMIT 5;

-- Step 4: Get list of available products that could be linked
SELECT 
  id,
  name,
  barcode,
  sku,
  sale_price,
  rental_price,
  category,
  franchise_id,
  is_active
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Check for any existing barcodes to understand the pattern
SELECT 
  b.barcode_number,
  b.product_id,
  p.name,
  b.is_active,
  COUNT(*) as count
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
GROUP BY b.barcode_number, b.product_id, p.name, b.is_active
LIMIT 20;

-- Step 6: Get all barcodes count
SELECT COUNT(*) as total_barcodes FROM barcodes;

-- Step 7: Get franchise IDs to understand franchise isolation
SELECT DISTINCT 
  franchise_id,
  COUNT(*) as product_count
FROM products
WHERE franchise_id IS NOT NULL
GROUP BY franchise_id;

-- Step 8: Check currently logged-in user's franchise (for reference)
-- This would need to be run with proper auth context

-- ============================================
-- IF BARCODE DOESN'T EXIST - CREATE IT
-- ============================================

-- First, find a product to link to
-- Option 1: Use the first available product
-- Option 2: Use a specific product with a barcode
-- Option 3: Create a new product

-- Let's get a sample product first:
-- SELECT id, name, franchise_id FROM products LIMIT 1;

-- Then create the barcode (UNCOMMENT TO RUN):
/*
INSERT INTO barcodes (
  barcode_number,
  product_id,
  barcode_type,
  is_active,
  created_at,
  updated_at
)
SELECT 
  'SAF562036' as barcode_number,
  p.id as product_id,
  'CODE128' as barcode_type,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM products p
WHERE p.is_active = true
LIMIT 1
ON CONFLICT (barcode_number) DO UPDATE SET
  is_active = true,
  updated_at = NOW();
*/

-- ============================================
-- TEST: Verify the barcode was created
-- ============================================

-- After creating, run this to verify:
SELECT 
  b.barcode_number,
  b.product_id,
  p.name,
  p.sale_price,
  p.franchise_id,
  b.is_active
FROM barcodes b
JOIN products p ON b.product_id = p.id
WHERE b.barcode_number = 'SAF562036';

-- ============================================
-- CLEANUP: If needed, delete and recreate
-- ============================================

-- DELETE FROM barcodes WHERE barcode_number = 'SAF562036';
