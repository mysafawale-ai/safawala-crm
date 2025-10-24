-- ========================================
-- COMPLETE FRANCHISE ISOLATION SETUP & VALIDATION
-- ========================================

-- STEP 1: Add franchise_id column if it doesn't exist
-- ========================================
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_categories_franchise_id 
ON product_categories(franchise_id);

COMMENT ON COLUMN product_categories.franchise_id IS 'NULL = Global category (visible to all), UUID = Franchise-specific category';

-- STEP 2: Show current state BEFORE deletion
-- ========================================
SELECT '===== BEFORE DELETION =====' as status;

SELECT 
  pc.id,
  pc.name,
  pc.description,
  pc.franchise_id,
  f.name as franchise_name,
  CASE 
    WHEN pc.franchise_id IS NULL THEN 'Global (Visible to All)'
    ELSE 'Franchise Specific'
  END as category_type
FROM product_categories pc
LEFT JOIN franchises f ON pc.franchise_id = f.id
ORDER BY pc.franchise_id NULLS FIRST, pc.name;

-- STEP 3: Get Surat franchise info
-- ========================================
SELECT '===== SURAT FRANCHISE INFO =====' as status;

SELECT 
  u.id as user_id,
  u.email,
  u.role,
  u.franchise_id,
  f.name as franchise_name
FROM users u
LEFT JOIN franchises f ON u.franchise_id = f.id
WHERE u.email = 'surat@safawala.com';

-- STEP 4: Delete Surat franchise categories
-- ========================================
DO $$
DECLARE
  v_surat_franchise_id UUID;
  v_deleted_count INTEGER;
BEGIN
  -- Get Surat franchise ID
  SELECT franchise_id INTO v_surat_franchise_id
  FROM users
  WHERE email = 'surat@safawala.com'
  LIMIT 1;

  IF v_surat_franchise_id IS NULL THEN
    RAISE NOTICE '⚠️ Surat user has no franchise_id - cannot delete franchise-specific categories';
    RETURN;
  END IF;

  RAISE NOTICE '🎯 Deleting categories for franchise: %', v_surat_franchise_id;

  -- Delete categories belonging to Surat franchise
  DELETE FROM product_categories
  WHERE franchise_id = v_surat_franchise_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Deleted % categories for Surat franchise', v_deleted_count;
END $$;

-- STEP 5: Show current state AFTER deletion
-- ========================================
SELECT '===== AFTER DELETION =====' as status;

SELECT 
  pc.id,
  pc.name,
  pc.description,
  pc.franchise_id,
  f.name as franchise_name,
  CASE 
    WHEN pc.franchise_id IS NULL THEN 'Global (Visible to All)'
    ELSE 'Franchise Specific'
  END as category_type
FROM product_categories pc
LEFT JOIN franchises f ON pc.franchise_id = f.id
ORDER BY pc.franchise_id NULLS FIRST, pc.name;

-- STEP 6: VALIDATE FRANCHISE ISOLATION
-- ========================================
SELECT '===== FRANCHISE ISOLATION VALIDATION =====' as status;

-- Test 1: Check what Surat franchise CAN see
SELECT 
  '✅ Categories VISIBLE to Surat franchise' as test_name,
  pc.id,
  pc.name,
  CASE 
    WHEN pc.franchise_id IS NULL THEN 'Global Category'
    WHEN pc.franchise_id = u.franchise_id THEN 'Own Franchise Category'
    ELSE 'ERROR: Should not be visible!'
  END as reason
FROM product_categories pc
CROSS JOIN users u
WHERE u.email = 'surat@safawala.com'
  AND (pc.franchise_id = u.franchise_id OR pc.franchise_id IS NULL)
ORDER BY pc.name;

-- Test 2: Check what Surat franchise CANNOT see
SELECT 
  '❌ Categories HIDDEN from Surat franchise' as test_name,
  pc.id,
  pc.name,
  f.name as belongs_to_franchise,
  'Other franchise - correctly isolated' as reason
FROM product_categories pc
LEFT JOIN franchises f ON pc.franchise_id = f.id
CROSS JOIN users u
WHERE u.email = 'surat@safawala.com'
  AND pc.franchise_id IS NOT NULL 
  AND pc.franchise_id != u.franchise_id
ORDER BY pc.name;

-- Test 3: Verify no orphaned categories
SELECT 
  '⚠️ Orphaned Categories (should be empty)' as test_name,
  pc.id,
  pc.name,
  pc.franchise_id
FROM product_categories pc
WHERE pc.franchise_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM franchises f WHERE f.id = pc.franchise_id
  );

-- STEP 7: Summary Report
-- ========================================
SELECT '===== SUMMARY REPORT =====' as status;

WITH surat_franchise AS (
  SELECT franchise_id FROM users WHERE email = 'surat@safawala.com' LIMIT 1
)
SELECT 
  COUNT(*) FILTER (WHERE franchise_id IS NULL) as global_categories,
  COUNT(*) FILTER (WHERE franchise_id = (SELECT franchise_id FROM surat_franchise)) as surat_franchise_categories,
  COUNT(*) FILTER (WHERE franchise_id IS NOT NULL AND franchise_id != (SELECT franchise_id FROM surat_franchise)) as other_franchise_categories,
  COUNT(*) as total_categories
FROM product_categories;

-- STEP 8: Test Query (matches frontend logic)
-- ========================================
SELECT '===== FRONTEND QUERY TEST =====' as status;

-- This simulates what the frontend sees for Surat franchise
WITH user_info AS (
  SELECT 
    franchise_id,
    role
  FROM users 
  WHERE email = 'surat@safawala.com'
  LIMIT 1
)
SELECT 
  pc.id,
  pc.name,
  pc.description,
  pc.franchise_id,
  f.name as franchise_name,
  CASE 
    WHEN pc.franchise_id IS NULL THEN '🌍 Global'
    WHEN pc.franchise_id = ui.franchise_id THEN '🏢 Own Franchise'
    ELSE '🚫 Should not appear!'
  END as visibility_status
FROM product_categories pc
LEFT JOIN franchises f ON pc.franchise_id = f.id
CROSS JOIN user_info ui
WHERE ui.role != 'super_admin'
  AND (pc.franchise_id = ui.franchise_id OR pc.franchise_id IS NULL)
ORDER BY visibility_status, pc.name;

-- Expected Result: Only global categories should appear for Surat
-- (assuming all Surat-specific categories were deleted)
