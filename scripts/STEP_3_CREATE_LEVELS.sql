-- ============================================================================
-- STEP 3: Create Levels (Run AFTER variants are created)
-- ============================================================================
-- This creates 3 levels (Premium, VIP, VVIP) for each variant
-- ============================================================================

DO $$
DECLARE
  v_franchise_id UUID := '1a518dde-85b7-44ef-8bc4-092f53ddfd99';
  v_variant RECORD;
  v_level_count INT := 0;
BEGIN

RAISE NOTICE '🚀 Creating levels...';

-- Loop through all variants for this franchise
FOR v_variant IN 
  SELECT v.id, v.name, v.base_price
  FROM package_variants v
  JOIN packages_categories c ON v.category_id = c.id
  WHERE c.franchise_id = v_franchise_id
LOOP
  RAISE NOTICE 'Creating levels for: % (Base: ₹%)', v_variant.name, v_variant.base_price;
  
  -- Premium Level (base price)
  INSERT INTO package_levels (
    variant_id,
    name,
    base_price,
    is_active
  )
  VALUES (
    v_variant.id,
    'Premium',
    v_variant.base_price,
    true
  );
  v_level_count := v_level_count + 1;
  
  -- VIP Level (base + 500)
  INSERT INTO package_levels (
    variant_id,
    name,
    base_price,
    is_active
  )
  VALUES (
    v_variant.id,
    'VIP',
    v_variant.base_price + 500,
    true
  );
  v_level_count := v_level_count + 1;
  
  -- VVIP Level (base + 1000)
  INSERT INTO package_levels (
    variant_id,
    name,
    base_price,
    is_active
  )
  VALUES (
    v_variant.id,
    'VVIP',
    v_variant.base_price + 1000,
    true
  );
  v_level_count := v_level_count + 1;
  
  RAISE NOTICE '  ✅ Created 3 levels for %', v_variant.name;
END LOOP;

RAISE NOTICE '✅ Successfully created % levels total!', v_level_count;

END $$;

-- Verify
SELECT 
  c.name as category,
  v.name as variant,
  l.name as level,
  l.base_price as "Level Price"
FROM package_levels l
JOIN package_variants v ON l.variant_id = v.id
JOIN packages_categories c ON v.category_id = c.id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY c.name, v.base_price, l.base_price;
