-- ============================================
-- ADD SAF562036 TO BARCODES TABLE
-- ============================================
-- Purpose: Insert SAF562036 into the barcodes table
-- and link it to the product "SW9005 - Onion Pink Tissue"

-- Step 1: Check current state
SELECT COUNT(*) as total_barcodes FROM barcodes;
SELECT * FROM barcodes WHERE barcode_number = 'SAF562036';

-- Step 2: Find the product to link
SELECT id, name, product_code, barcode 
FROM products 
WHERE product_code = 'SAF562036' OR barcode = 'SAF562036';

-- Step 3: Insert SAF562036 into barcodes table
INSERT INTO barcodes (product_id, barcode_number, barcode_type, is_active, created_at, updated_at)
SELECT 
  p.id as product_id,
  'SAF562036' as barcode_number,
  'CODE128' as barcode_type,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM products p
WHERE (p.product_code = 'SAF562036' OR p.barcode = 'SAF562036')
  AND p.is_active = true
LIMIT 1;

-- Step 4: Verify insertion
SELECT 
  b.id,
  b.barcode_number,
  b.product_id,
  b.barcode_type,
  b.is_active,
  b.created_at,
  p.id as product_id_check,
  p.name as product_name,
  p.product_code,
  p.barcode,
  p.rental_price
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
WHERE b.barcode_number = 'SAF562036';

-- Step 5: Show all barcodes
SELECT 
  b.barcode_number,
  p.name as product_name,
  b.barcode_type,
  b.is_active,
  b.created_at
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
ORDER BY b.created_at DESC;

-- Step 6: Verify count
SELECT COUNT(*) as total_barcodes FROM barcodes WHERE is_active = true;
