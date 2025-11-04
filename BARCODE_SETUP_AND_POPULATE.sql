-- ============================================================================
-- BARCODE SETUP: CHECK & POPULATE BARCODES TABLE
-- ============================================================================
-- Purpose: Check what barcode data exists in products table
--          Create SQL to populate the dedicated barcodes table
--          Link product barcodes with product_id
-- ============================================================================

-- STEP 1: ANALYZE CURRENT PRODUCT BARCODES
-- ============================================================================
-- Run this to see what barcode data you currently have

-- Check how many products have barcodes
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN product_code IS NOT NULL THEN 1 END) as with_product_code,
  COUNT(CASE WHEN barcode_number IS NOT NULL THEN 1 END) as with_barcode_number,
  COUNT(CASE WHEN alternate_barcode_1 IS NOT NULL THEN 1 END) as with_alt_barcode_1,
  COUNT(CASE WHEN alternate_barcode_2 IS NOT NULL THEN 1 END) as with_alt_barcode_2,
  COUNT(CASE WHEN sku IS NOT NULL THEN 1 END) as with_sku,
  COUNT(CASE WHEN code IS NOT NULL THEN 1 END) as with_code
FROM products;

-- View sample of products with their barcodes
SELECT 
  id,
  name,
  product_code,
  barcode_number,
  alternate_barcode_1,
  alternate_barcode_2,
  sku,
  code,
  category
FROM products
WHERE product_code IS NOT NULL 
   OR barcode_number IS NOT NULL
LIMIT 20;

-- ============================================================================
-- STEP 2: MIGRATE EXISTING BARCODES TO BARCODES TABLE
-- ============================================================================
-- This SQL will:
-- 1. Take each product's barcode fields
-- 2. Create entries in the barcodes table
-- 3. Link them to the product via product_id
-- 4. Mark them as active

-- PART A: Add primary product_code as barcode (if exists)
INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.product_code,
  'product_code',
  true,
  NOW(),
  'Migrated from products.product_code field'
FROM products p
WHERE p.product_code IS NOT NULL
  AND p.product_code NOT IN (
    SELECT barcode_number FROM barcodes 
    WHERE is_active = true
  )
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- PART B: Add primary barcode_number as barcode (if exists)
INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.barcode_number,
  'primary',
  true,
  NOW(),
  'Migrated from products.barcode_number field'
FROM products p
WHERE p.barcode_number IS NOT NULL
  AND p.barcode_number NOT IN (
    SELECT barcode_number FROM barcodes 
    WHERE is_active = true
  )
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- PART C: Add alternate_barcode_1 (if exists)
INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.alternate_barcode_1,
  'alternate',
  true,
  NOW(),
  'Migrated from products.alternate_barcode_1 field'
FROM products p
WHERE p.alternate_barcode_1 IS NOT NULL
  AND p.alternate_barcode_1 NOT IN (
    SELECT barcode_number FROM barcodes 
    WHERE is_active = true
  )
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- PART D: Add alternate_barcode_2 (if exists)
INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.alternate_barcode_2,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.alternate_barcode_2,
  'alternate',
  true,
  NOW(),
  'Migrated from products.alternate_barcode_2 field'
FROM products p
WHERE p.alternate_barcode_2 IS NOT NULL
  AND p.alternate_barcode_2 NOT IN (
    SELECT barcode_number FROM barcodes 
    WHERE is_active = true
  )
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- PART E: Add SKU as barcode (if exists)
INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.sku,
  'sku',
  true,
  NOW(),
  'Migrated from products.sku field'
FROM products p
WHERE p.sku IS NOT NULL
  AND p.sku NOT IN (
    SELECT barcode_number FROM barcodes 
    WHERE is_active = true
  )
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- PART F: Add code field (if exists and different from others)
INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  created_at,
  notes
)
SELECT 
  gen_random_uuid(),
  p.id,
  p.code,
  'code',
  true,
  NOW(),
  'Migrated from products.code field'
FROM products p
WHERE p.code IS NOT NULL
  AND p.code NOT IN (
    SELECT barcode_number FROM barcodes 
    WHERE is_active = true
  )
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- ============================================================================
-- STEP 3: VERIFY MIGRATION
-- ============================================================================

-- Check how many barcodes were created
SELECT 
  COUNT(*) as total_barcodes,
  COUNT(CASE WHEN barcode_type = 'product_code' THEN 1 END) as product_codes,
  COUNT(CASE WHEN barcode_type = 'primary' THEN 1 END) as primary_barcodes,
  COUNT(CASE WHEN barcode_type = 'alternate' THEN 1 END) as alternate_barcodes,
  COUNT(CASE WHEN barcode_type = 'sku' THEN 1 END) as sku_barcodes,
  COUNT(CASE WHEN barcode_type = 'code' THEN 1 END) as code_barcodes,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_barcodes
FROM barcodes;

-- View products with their associated barcodes
SELECT 
  p.id,
  p.name,
  p.category,
  COUNT(b.id) as barcode_count,
  STRING_AGG(b.barcode_number, ', ') as barcodes,
  STRING_AGG(DISTINCT b.barcode_type, ', ') as barcode_types
FROM products p
LEFT JOIN barcodes b ON p.id = b.product_id AND b.is_active = true
GROUP BY p.id, p.name, p.category
HAVING COUNT(b.id) > 0
ORDER BY p.name;

-- View products WITHOUT any barcodes (need to add manually)
SELECT 
  id,
  name,
  category,
  product_code,
  barcode_number,
  alternate_barcode_1,
  alternate_barcode_2,
  sku,
  code
FROM products
WHERE id NOT IN (
  SELECT DISTINCT product_id FROM barcodes WHERE is_active = true
)
ORDER BY name;

-- ============================================================================
-- STEP 4: ADD NEW BARCODES MANUALLY (if needed)
-- ============================================================================
-- If a product doesn't have barcodes, use this template to add them:

-- Example: Add barcodes to a product
-- Replace PRODUCT_UUID with actual product ID
-- Replace BARCODE_VALUE with actual barcode

-- Single barcode:
SELECT * FROM add_barcode_to_product(
  'PRODUCT_UUID_HERE',           -- product_id
  'BARCODE_VALUE_HERE',          -- barcode_number
  'primary',                     -- barcode_type (primary, alternate, sku, ean, code128, qr, etc.)
  'Description of this barcode'  -- notes
);

-- Multiple barcodes for same product:
SELECT * FROM add_barcode_to_product('PRODUCT_UUID', 'BARCODE-001', 'primary', 'Primary barcode');
SELECT * FROM add_barcode_to_product('PRODUCT_UUID', 'SKU-001', 'sku', 'SKU barcode');
SELECT * FROM add_barcode_to_product('PRODUCT_UUID', 'EAN-001', 'ean', 'EAN barcode');

-- ============================================================================
-- STEP 5: BULK ADD BARCODES (if you have a CSV or list)
-- ============================================================================
-- If you have product IDs and barcodes in a list, insert them like this:

INSERT INTO barcodes (
  id,
  product_id,
  barcode_number,
  barcode_type,
  is_active,
  notes
)
VALUES 
  (gen_random_uuid(), 'product-uuid-1', 'BARCODE-001', 'primary', true, 'New barcode'),
  (gen_random_uuid(), 'product-uuid-1', 'SKU-001', 'sku', true, 'SKU code'),
  (gen_random_uuid(), 'product-uuid-2', 'BARCODE-002', 'primary', true, 'New barcode'),
  (gen_random_uuid(), 'product-uuid-2', 'EAN-123456789', 'ean', true, 'EAN code')
ON CONFLICT (barcode_number) 
DO UPDATE SET 
  is_active = true,
  updated_at = NOW();

-- ============================================================================
-- STEP 6: TEST BARCODE LOOKUP
-- ============================================================================

-- Test finding a product by barcode
SELECT 
  b.barcode_number,
  p.name,
  p.category,
  b.barcode_type,
  b.is_active
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
WHERE b.barcode_number = 'YOUR_BARCODE_HERE'
  AND b.is_active = true;

-- Test the API would work
SELECT 
  b.product_id,
  p.name as product_name,
  b.barcode_number,
  b.barcode_type
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
WHERE b.barcode_number = 'PROD-1761634543481-66-001'
  AND b.is_active = true
LIMIT 1;

-- ============================================================================
-- STEP 7: MONITOR BARCODE QUALITY
-- ============================================================================

-- Find duplicate barcodes (should not have any)
SELECT 
  barcode_number,
  COUNT(*) as count,
  STRING_AGG(DISTINCT product_id::text, ', ') as product_ids
FROM barcodes
WHERE is_active = true
GROUP BY barcode_number
HAVING COUNT(*) > 1;

-- Find products with lots of barcodes
SELECT 
  p.id,
  p.name,
  COUNT(b.id) as barcode_count,
  STRING_AGG(b.barcode_number, ', ') as barcodes
FROM products p
LEFT JOIN barcodes b ON p.id = b.product_id AND b.is_active = true
GROUP BY p.id, p.name
HAVING COUNT(b.id) >= 3
ORDER BY COUNT(b.id) DESC;

-- Find inactive barcodes (for cleanup)
SELECT 
  barcode_number,
  product_id,
  is_active,
  created_at,
  updated_at
FROM barcodes
WHERE is_active = false
ORDER BY updated_at DESC;

-- ============================================================================
-- STEP 8: CLEANUP & MAINTENANCE
-- ============================================================================

-- Reactivate a barcode (if accidentally deactivated)
UPDATE barcodes 
SET is_active = true, updated_at = NOW()
WHERE barcode_number = 'BARCODE_TO_REACTIVATE'
  AND is_active = false;

-- Deactivate a barcode (if it's no longer used)
UPDATE barcodes 
SET is_active = false, updated_at = NOW()
WHERE barcode_number = 'BARCODE_TO_DEACTIVATE'
  AND is_active = true;

-- Remove duplicate barcodes (keep only the first/oldest)
DELETE FROM barcodes
WHERE barcode_number IN (
  SELECT barcode_number
  FROM barcodes
  WHERE is_active = true
  GROUP BY barcode_number
  HAVING COUNT(*) > 1
)
AND id NOT IN (
  SELECT MIN(id)
  FROM barcodes
  WHERE is_active = true
  GROUP BY barcode_number
  HAVING COUNT(*) > 1
);

-- ============================================================================
-- EXECUTION STEPS:
-- ============================================================================
/*
1. Run STEP 1 first to ANALYZE current barcodes
   → See what barcode data exists in your database

2. Run STEP 2 to MIGRATE existing barcodes
   → Copy all barcode data from products table to barcodes table
   → Link them to products via product_id

3. Run STEP 3 to VERIFY migration was successful
   → Check how many barcodes were created
   → See which products have barcodes now

4. If products are missing barcodes:
   → Run STEP 4 to add them manually
   → Or use STEP 5 for bulk imports

5. Run STEP 6 to TEST barcode lookup
   → Verify API will work correctly
   → Check if barcodes table is ready

6. Monitor quality with STEP 7
   → Find duplicates
   → Find inactive barcodes

7. Clean up with STEP 8 if needed
   → Remove duplicates
   → Deactivate old barcodes
*/

-- ============================================================================
-- NOTES:
-- ============================================================================
/*
✅ What this SQL does:
  1. Analyzes existing barcode data in products table
  2. Migrates all barcode fields to dedicated barcodes table
  3. Creates barcode_id → product_id relationships
  4. Marks all as active for immediate use
  5. Provides verification queries
  6. Allows adding new barcodes manually
  7. Includes monitoring and cleanup

✅ Barcode types supported:
  - product_code: From products.product_code field
  - primary: From products.barcode_number field
  - alternate: From alternate_barcode_1 & 2 fields
  - sku: From products.sku field
  - code: From products.code field
  - ean: EAN codes
  - code128: Code 128 barcodes
  - qr: QR codes

✅ Why dedicated barcodes table:
  - Fast indexed lookups
  - Support multiple barcodes per product
  - Complete audit trail
  - Enable/disable barcodes without touching products
  - Barcode history and migration tracking

✅ Next steps:
  1. Run STEP 1 to analyze current data
  2. Run STEP 2 to populate barcodes table
  3. Test barcode scanning in app
  4. Monitor with STEP 7 if needed
*/
