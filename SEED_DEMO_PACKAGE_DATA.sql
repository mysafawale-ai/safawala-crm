-- ================================================================
-- DEMO SEED DATA FOR PACKAGE MANAGEMENT SYSTEM
-- ================================================================
-- This creates sample data to test the new structure
-- Structure: Categories → Variants → Levels → Distance Pricing
-- ================================================================

-- Clear existing demo data (optional - comment out if you want to keep existing data)
-- DELETE FROM distance_pricing WHERE variant_id IN (SELECT id FROM package_variants WHERE name LIKE 'Demo%');
-- DELETE FROM package_levels WHERE variant_id IN (SELECT id FROM package_variants WHERE name LIKE 'Demo%');
-- DELETE FROM package_variants WHERE name LIKE 'Demo%';
-- DELETE FROM packages_categories WHERE name LIKE 'Demo%';

-- ================================================================
-- STEP 1: CREATE DEMO CATEGORIES
-- ================================================================
INSERT INTO packages_categories (id, name, description, is_active, display_order)
VALUES 
    (gen_random_uuid(), 'Demo 25 Safas', 'Demo package for 25 people wedding celebrations', true, 1),
    (gen_random_uuid(), 'Demo 50 Safas', 'Demo package for 50 people grand celebrations', true, 2),
    (gen_random_uuid(), 'Demo 75 Safas', 'Demo package for 75 people royal celebrations', true, 3)
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- STEP 2: CREATE DEMO VARIANTS (linked directly to categories)
-- ================================================================

-- Get category IDs (using CTEs for clean insertion)
WITH demo_cats AS (
    SELECT id, name FROM packages_categories WHERE name LIKE 'Demo%'
)
INSERT INTO package_variants (
    id,
    category_id,
    name,
    description,
    base_price,
    is_active,
    display_order
)
SELECT 
    gen_random_uuid(),
    dc.id,
    variant_name,
    variant_desc,
    base_price,
    true,
    variant_display_order
FROM demo_cats dc
CROSS JOIN (
    VALUES 
        ('Demo Premium', 'Premium quality safas with embroidery', 25000.00, 1),
        ('Demo Standard', 'Standard quality safas for traditional ceremonies', 18000.00, 2),
        ('Demo Deluxe', 'Deluxe collection with designer patterns', 35000.00, 3)
) AS variants(variant_name, variant_desc, base_price, variant_display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM package_variants pv 
    WHERE pv.name = variant_name 
    AND pv.category_id = dc.id
);

-- ================================================================
-- STEP 3: CREATE DEMO LEVELS (Raja, VIP, VVIP for each variant)
-- ================================================================
WITH demo_variants AS (
    SELECT id, name, base_price, franchise_id 
    FROM package_variants 
    WHERE name LIKE 'Demo%'
)
INSERT INTO package_levels (
    id,
    variant_id,
    name,
    description,
    base_price,
    display_order,
    franchise_id,
    is_active
)
SELECT 
    gen_random_uuid(),
    dv.id,
    level_name,
    level_desc,
    dv.base_price + price_increment,
    level_order,
    dv.franchise_id,
    true
FROM demo_variants dv
CROSS JOIN (
    VALUES 
        ('Raja', 'Standard tier - Essential features included', 0, 1),
        ('VIP', 'Premium tier - Enhanced features and priority service', 5000, 2),
        ('VVIP', 'Ultimate tier - All premium features with VIP treatment', 12000, 3)
) AS levels(level_name, level_desc, price_increment, level_order)
WHERE NOT EXISTS (
    SELECT 1 FROM package_levels pl 
    WHERE pl.variant_id = dv.id 
    AND pl.name = level_name
);

-- ================================================================
-- STEP 4: CREATE DEMO DISTANCE PRICING
-- ================================================================
WITH demo_levels AS (
    SELECT pl.id as level_id, pv.name as variant_name, pl.name as level_name
    FROM package_levels pl
    JOIN package_variants pv ON pl.variant_id = pv.id
    WHERE pv.name LIKE 'Demo%'
)
INSERT INTO distance_pricing (
    id,
    level_id,
    range_name,
    min_km,
    max_km,
    base_price_addition,
    display_order,
    is_active
)
SELECT 
    gen_random_uuid(),
    dl.level_id,
    range_name,
    min_km,
    max_km,
    price_add,
    price_order,
    true
FROM demo_levels dl
CROSS JOIN (
    VALUES 
        ('Local (0-20 km)', 0, 20, 0.00, 1),
        ('City (21-50 km)', 21, 50, 2000.00, 2),
        ('Outstation (51-100 km)', 51, 100, 5000.00, 3),
        ('Far (101-200 km)', 101, 200, 10000.00, 4),
        ('Very Far (200+ km)', 201, 999, 15000.00, 5)
) AS pricing(range_name, min_km, max_km, price_add, price_order)
WHERE NOT EXISTS (
    SELECT 1 FROM distance_pricing dp 
    WHERE dp.level_id = dl.level_id 
    AND dp.range_name = range_name
);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Show the complete hierarchy
SELECT 
    '📦 DEMO DATA HIERARCHY' as info,
    '========================' as separator;

SELECT 
    pc.name as category,
    pv.name as variant,
    pl.name as level,
    pl.base_price as price,
    COUNT(dp.id) as distance_tiers
FROM packages_categories pc
LEFT JOIN package_variants pv ON pv.category_id = pc.id
LEFT JOIN package_levels pl ON pl.variant_id = pv.id
LEFT JOIN distance_pricing dp ON dp.level_id = pl.id
WHERE pc.name LIKE 'Demo%'
GROUP BY pc.name, pv.name, pl.name, pl.base_price, pv.display_order, pl.display_order
ORDER BY pc.name, pv.display_order, pl.display_order;

-- Count summary
SELECT 
    'Demo Categories' as entity, 
    COUNT(*) as count 
FROM packages_categories 
WHERE name LIKE 'Demo%'
UNION ALL
SELECT 
    'Demo Variants' as entity, 
    COUNT(*) as count 
FROM package_variants 
WHERE name LIKE 'Demo%'
UNION ALL
SELECT 
    'Demo Levels' as entity, 
    COUNT(*) as count 
FROM package_levels pl
JOIN package_variants pv ON pl.variant_id = pv.id
WHERE pv.name LIKE 'Demo%'
UNION ALL
SELECT 
    'Demo Distance Pricing' as entity, 
    COUNT(*) as count 
FROM distance_pricing dp
JOIN package_levels pl ON dp.level_id = pl.id
JOIN package_variants pv ON pl.variant_id = pv.id
WHERE pv.name LIKE 'Demo%';

-- ================================================================
-- EXPECTED RESULTS
-- ================================================================
-- 3 Demo Categories
-- 9 Demo Variants (3 per category)
-- 27 Demo Levels (3 per variant: Raja, VIP, VVIP)
-- 135 Demo Distance Pricing entries (5 per level)
-- ================================================================

-- Show sample data for one complete flow
SELECT 
    pc.name as "Category",
    pv.name as "Variant",
    pl.name as "Level",
    CONCAT('₹', pl.base_price) as "Base Price",
    dp.range_name as "Distance Range",
    CONCAT('₹', dp.base_price_addition) as "Distance Charge",
    CONCAT('₹', pl.base_price + dp.base_price_addition) as "Total Price"
FROM packages_categories pc
JOIN package_variants pv ON pv.category_id = pc.id
JOIN package_levels pl ON pl.variant_id = pv.id
JOIN distance_pricing dp ON dp.level_id = pl.id
WHERE pc.name = 'Demo 25 Safas'
  AND pv.name = 'Demo Premium'
  AND pl.name = 'Raja'
ORDER BY dp.display_order
LIMIT 10;

-- ================================================================
-- CLEANUP (Run this to remove demo data later)
-- ================================================================
/*
-- To remove all demo data, uncomment and run:

DELETE FROM distance_pricing 
WHERE level_id IN (
    SELECT pl.id FROM package_levels pl
    JOIN package_variants pv ON pl.variant_id = pv.id
    WHERE pv.name LIKE 'Demo%'
);

DELETE FROM package_levels 
WHERE variant_id IN (
    SELECT id FROM package_variants WHERE name LIKE 'Demo%'
);

DELETE FROM package_variants WHERE name LIKE 'Demo%';
DELETE FROM packages_categories WHERE name LIKE 'Demo%';
*/
