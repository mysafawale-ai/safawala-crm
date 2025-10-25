-- ============================================================================
-- STEP 4: Create Distance Pricing (Run AFTER levels are created)
-- ============================================================================
-- This creates 5 distance tiers for each level
-- ============================================================================

DO $$
DECLARE
  v_franchise_id UUID := '1a518dde-85b7-44ef-8bc4-092f53ddfd99';
  v_level RECORD;
  v_pricing_count INT := 0;
BEGIN

RAISE NOTICE '🚀 Creating distance pricing...';

-- Loop through all levels for this franchise
FOR v_level IN 
  SELECT l.id, l.name as level_name, v.name as variant_name
  FROM package_levels l
  JOIN package_variants v ON l.variant_id = v.id
  JOIN packages_categories c ON v.category_id = c.id
  WHERE c.franchise_id = v_franchise_id
LOOP
  RAISE NOTICE 'Creating distance pricing for: % - %', v_level.variant_name, v_level.level_name;
  
  -- 5 distance tiers
  INSERT INTO distance_pricing (
    package_level_id,
    min_distance_km,
    max_distance_km,
    additional_price,
    is_active
  ) VALUES
    (v_level.id, 0, 10, 500, true),
    (v_level.id, 11, 50, 1000, true),
    (v_level.id, 51, 250, 2000, true),
    (v_level.id, 251, 500, 3000, true),
    (v_level.id, 501, 2000, 5000, true);
  
  v_pricing_count := v_pricing_count + 5;
  RAISE NOTICE '  ✅ Created 5 distance tiers';
END LOOP;

RAISE NOTICE '✅ Successfully created % distance pricing tiers total!', v_pricing_count;

END $$;

-- Verify
SELECT 
  c.name as category,
  v.name as variant,
  l.name as level,
  COUNT(d.id) as "Distance Tiers"
FROM package_levels l
JOIN package_variants v ON l.variant_id = v.id
JOIN packages_categories c ON v.category_id = c.id
LEFT JOIN distance_pricing d ON l.id = d.package_level_id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
GROUP BY c.name, v.name, l.name
ORDER BY c.name, v.base_price, l.base_price;

-- Detailed view
SELECT 
  v.name as variant,
  l.name as level,
  d.min_distance_km || '-' || d.max_distance_km || ' km' as "Distance Range",
  d.additional_price as "Additional Price"
FROM distance_pricing d
JOIN package_levels l ON d.package_level_id = l.id
JOIN package_variants v ON l.variant_id = v.id
JOIN packages_categories c ON v.category_id = c.id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY v.name, l.name, d.min_distance_km
LIMIT 20;
