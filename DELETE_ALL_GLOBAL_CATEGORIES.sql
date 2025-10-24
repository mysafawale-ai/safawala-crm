-- ========================================
-- DELETE ALL GLOBAL CATEGORIES
-- ========================================
-- This will remove all shared categories so each franchise
-- can create their own isolated categories

-- STEP 1: Show what will be deleted
-- ========================================
SELECT '===== CATEGORIES TO BE DELETED =====' as status;

SELECT 
  id,
  name,
  description,
  franchise_id,
  parent_id,
  is_active,
  created_at,
  CASE 
    WHEN franchise_id IS NULL THEN '🌍 Global - WILL BE DELETED'
    ELSE '🏢 Franchise Specific - WILL BE KEPT'
  END as deletion_status
FROM product_categories
WHERE franchise_id IS NULL
ORDER BY name;

-- STEP 2: Count categories to be deleted
-- ========================================
SELECT 
  COUNT(*) as total_global_categories_to_delete
FROM product_categories
WHERE franchise_id IS NULL;

-- STEP 3: Check if any products are using these categories
-- ========================================
SELECT '===== PRODUCTS USING GLOBAL CATEGORIES =====' as status;

SELECT 
  pc.name as category_name,
  COUNT(p.id) as product_count,
  CASE 
    WHEN COUNT(p.id) > 0 THEN '⚠️ WARNING: Has products!'
    ELSE '✅ Safe to delete'
  END as safety_status
FROM product_categories pc
LEFT JOIN products p ON p.category_id = pc.id
WHERE pc.franchise_id IS NULL
GROUP BY pc.id, pc.name
ORDER BY product_count DESC, pc.name;

-- STEP 4: Delete all global categories
-- ========================================
DO $$
DECLARE
  v_deleted_count INTEGER;
  v_product_count INTEGER;
BEGIN
  -- First check if any products are using these categories
  SELECT COUNT(*) INTO v_product_count
  FROM products p
  WHERE p.category_id IN (
    SELECT id FROM product_categories WHERE franchise_id IS NULL
  );

  IF v_product_count > 0 THEN
    RAISE NOTICE '⚠️ WARNING: Found % products using global categories', v_product_count;
    RAISE NOTICE '⚠️ These products will have their category_id set to NULL';
    
    -- Update products to remove category reference
    UPDATE products 
    SET category_id = NULL
    WHERE category_id IN (
      SELECT id FROM product_categories WHERE franchise_id IS NULL
    );
    
    RAISE NOTICE '✅ Updated % products (category_id set to NULL)', v_product_count;
  END IF;

  -- Now delete all global categories (franchise_id = NULL)
  DELETE FROM product_categories
  WHERE franchise_id IS NULL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Deleted % global categories', v_deleted_count;
  RAISE NOTICE '🎉 All franchises now have clean slate for their own categories';
END $$;

-- STEP 5: Verify deletion
-- ========================================
SELECT '===== AFTER DELETION =====' as status;

SELECT 
  COUNT(*) FILTER (WHERE franchise_id IS NULL) as global_categories_remaining,
  COUNT(*) FILTER (WHERE franchise_id IS NOT NULL) as franchise_specific_categories,
  COUNT(*) as total_categories
FROM product_categories;

-- STEP 6: Show remaining categories (should be franchise-specific only)
-- ========================================
SELECT 
  pc.id,
  pc.name,
  pc.franchise_id,
  f.name as franchise_name,
  pc.is_active
FROM product_categories pc
LEFT JOIN franchises f ON pc.franchise_id = f.id
ORDER BY f.name NULLS FIRST, pc.name;

-- STEP 7: Verify no orphaned products
-- ========================================
SELECT '===== PRODUCTS WITHOUT CATEGORIES =====' as status;

SELECT 
  COUNT(*) as products_without_category
FROM products
WHERE category_id IS NULL;

SELECT '===== COMPLETE! =====' as status;
SELECT 'All global categories deleted. Each franchise can now create their own isolated categories.' as message;
