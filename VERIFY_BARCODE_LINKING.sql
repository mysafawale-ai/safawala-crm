-- ============================================
-- BARCODE-PRODUCT LINKING VERIFICATION
-- ============================================
-- This script verifies:
-- 1. Barcodes table exists with proper structure
-- 2. Foreign key relationship to products
-- 3. If SAF562036 exists and is linked
-- 4. Sample products available for linking
-- 5. Current state of barcode system

-- ============================================
-- STEP 1: Check table structure
-- ============================================

-- Check if barcodes table exists
SELECT 
  table_name,
  table_schema
FROM information_schema.tables 
WHERE table_name = 'barcodes'
  AND table_schema NOT IN ('pg_catalog', 'information_schema');

-- Get barcodes table columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'barcodes'
ORDER BY ordinal_position;

-- ============================================
-- STEP 2: Check foreign key relationships
-- ============================================

-- Check foreign keys on barcodes table
SELECT
  constraint_name,
  table_name,
  column_name,
  foreign_table_name,
  foreign_column_name
FROM information_schema.constraint_column_usage
JOIN information_schema.table_constraints USING (constraint_name)
WHERE table_name = 'barcodes'
  AND constraint_type = 'FOREIGN KEY';

-- ============================================
-- STEP 3: Check if SAF562036 exists
-- ============================================

-- Direct check for SAF562036 in barcodes table
SELECT 
  b.id,
  b.barcode_number,
  b.product_id,
  b.barcode_type,
  b.is_active,
  b.created_at,
  p.id as product_check_id,
  p.name as product_name,
  p.sale_price,
  p.rental_price
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
WHERE LOWER(b.barcode_number) = LOWER('SAF562036')
LIMIT 10;

-- ============================================
-- STEP 4: Get total barcode count
-- ============================================

SELECT 
  COUNT(*) as total_barcodes,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_barcodes,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_barcodes,
  COUNT(CASE WHEN product_id IS NULL THEN 1 END) as orphaned_barcodes
FROM barcodes;

-- ============================================
-- STEP 5: Sample active barcodes
-- ============================================

-- Show active barcodes with their products
SELECT 
  b.barcode_number,
  b.product_id,
  p.name as product_name,
  p.sale_price,
  p.franchise_id,
  b.barcode_type,
  b.is_active
FROM barcodes b
LEFT JOIN products p ON b.product_id = p.id
WHERE b.is_active = true
ORDER BY b.created_at DESC
LIMIT 20;

-- ============================================
-- STEP 6: Check for barcodes in products table
-- ============================================

-- Check if products table has barcode fields
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND (column_name LIKE '%barcode%' OR column_name LIKE '%sku%')
ORDER BY ordinal_position;

-- ============================================
-- STEP 7: Check products with barcode data
-- ============================================

-- Get products that have barcode data
SELECT 
  id,
  name,
  sku,
  COALESCE(barcode, 'N/A') as barcode,
  COALESCE(barcode_number, 'N/A') as barcode_number,
  sale_price,
  rental_price,
  is_active,
  franchise_id
FROM products
WHERE is_active = true 
  AND (barcode IS NOT NULL OR sku IS NOT NULL)
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- STEP 8: Get all products (for linking)
-- ============================================

-- Get available products to potentially link to
SELECT 
  id,
  name,
  sku,
  category,
  sale_price,
  rental_price,
  security_deposit,
  franchise_id,
  is_active,
  created_at
FROM products
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- STEP 9: Check for data integrity issues
-- ============================================

-- Find barcodes without products (orphaned)
SELECT 
  b.id,
  b.barcode_number,
  b.product_id,
  b.barcode_type,
  b.created_at
FROM barcodes b
WHERE b.product_id IS NULL
  OR NOT EXISTS (SELECT 1 FROM products p WHERE p.id = b.product_id);

-- ============================================
-- STEP 10: Check if table has RLS enabled
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'barcodes';

-- ============================================
-- VERIFICATION QUERIES RESULTS INTERPRETATION
-- ============================================

/*

If you see:
✅ barcodes table EXISTS with columns: id, product_id, barcode_number, barcode_type, is_active, created_at
✅ Foreign key constraint on product_id → products(id)
✅ SAF562036 in results with product_id linked to a valid product
→ BARCODE IS PROPERLY LINKED ✅

If you see:
❌ barcodes table does NOT exist
→ Run: scripts/CREATE_DEDICATED_BARCODES_TABLE.sql

If you see:
⚠️ SAF562036 NOT in results (total_barcodes = 0 or SAF562036 query returns nothing)
→ Need to CREATE the barcode and link it to a product

If you see:
⚠️ SAF562036 EXISTS but product_id IS NULL
→ BARCODE IS ORPHANED - need to link it to a product

If you see:
⚠️ SAF562036 EXISTS but product_check_id IS NULL
→ FOREIGN KEY BROKEN - product doesn't exist, need to update barcode

*/
