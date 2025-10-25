-- ============================================================================
-- DELETE ALL EXISTING VARIANTS (CLEANUP SCRIPT)
-- ============================================================================
-- Run this to clean up all variants before running the new import scripts
-- This will cascade delete all related levels and distance pricing
-- ============================================================================

DO $$
DECLARE
  v_franchise_id UUID := '1a518dde-85b7-44ef-8bc4-092f53ddfd99';
  v_deleted_count INT;
BEGIN

RAISE NOTICE '🧹 Starting cleanup...';

-- Delete all distance pricing first (if not cascade)
DELETE FROM distance_pricing 
WHERE package_level_id IN (
  SELECT l.id FROM package_levels l
  JOIN package_variants v ON l.variant_id = v.id
  JOIN packages_categories c ON v.category_id = c.id
  WHERE c.franchise_id = v_franchise_id
);

GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
RAISE NOTICE '  ✅ Deleted % distance pricing records', v_deleted_count;

-- Delete all levels
DELETE FROM package_levels 
WHERE variant_id IN (
  SELECT v.id FROM package_variants v
  JOIN packages_categories c ON v.category_id = c.id
  WHERE c.franchise_id = v_franchise_id
);

GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
RAISE NOTICE '  ✅ Deleted % package levels', v_deleted_count;

-- Delete all variants
DELETE FROM package_variants 
WHERE category_id IN (
  SELECT id FROM packages_categories 
  WHERE franchise_id = v_franchise_id
);

GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
RAISE NOTICE '  ✅ Deleted % package variants', v_deleted_count;

RAISE NOTICE '🎉 Cleanup complete! Ready to run STEP_2 and CREATE_ALL_REMAINING_VARIANTS scripts';

END $$;

-- Verify cleanup
SELECT 
  c.name as category,
  COUNT(v.id) as variant_count
FROM packages_categories c
LEFT JOIN package_variants v ON c.id = v.category_id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
GROUP BY c.name
ORDER BY c.name;
