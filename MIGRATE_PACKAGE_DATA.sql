-- Data Migration for Package Restructure
-- Run this AFTER CREATE_PACKAGE_LEVELS_TABLE.sql
-- New Structure: Categories → Variants → Levels → Distance Pricing

-- Step 1: Link package_variants directly to categories (bypassing package_sets)
UPDATE package_variants pv
SET 
    category_id = ps.category_id,
    franchise_id = ps.franchise_id,
    display_order = 0
FROM package_sets ps
WHERE pv.package_id = ps.id
AND pv.category_id IS NULL;

-- Step 2: Create default levels (Raja, VIP, VVIP) for each variant
INSERT INTO package_levels (
    variant_id,
    name,
    description,
    base_price,
    display_order,
    franchise_id,
    is_active
)
SELECT 
    pv.id as variant_id,
    levels.level_name,
    levels.level_description,
    pv.base_price + levels.price_increment,
    levels.level_display_order,
    pv.franchise_id,
    true
FROM package_variants pv
CROSS JOIN (
    VALUES 
        ('Raja', 'Standard tier with essential features', 0, 1),
        ('VIP', 'Premium tier with enhanced features', 5000, 2),
        ('VVIP', 'Ultimate tier with all premium features', 10000, 3)
) AS levels(level_name, level_description, price_increment, level_display_order)
WHERE pv.id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM package_levels pl 
    WHERE pl.variant_id = pv.id 
    AND pl.name = levels.level_name
);

-- Step 3: Migrate distance_pricing to new structure (link to Raja level by default)
UPDATE distance_pricing dp
SET level_id = (
    SELECT pl.id 
    FROM package_levels pl 
    WHERE pl.variant_id = dp.variant_id 
    AND pl.name = 'Raja'
    LIMIT 1
)
WHERE dp.level_id IS NULL
AND dp.variant_id IS NOT NULL;

-- Verification: Show the new hierarchy
SELECT 
    pc.name as category,
    pv.name as package_variant,
    pl.name as level,
    pl.base_price,
    COUNT(dp.id) as distance_pricing_count
FROM packages_categories pc
LEFT JOIN package_variants pv ON pv.category_id = pc.id
LEFT JOIN package_levels pl ON pl.variant_id = pv.id
LEFT JOIN distance_pricing dp ON dp.level_id = pl.id
GROUP BY pc.name, pv.name, pl.name, pl.base_price, pv.display_order, pl.display_order
ORDER BY pc.name, pv.display_order, pl.display_order
LIMIT 30;

-- Count summary
SELECT 'Categories' as entity, COUNT(*) as count FROM packages_categories WHERE is_active = true
UNION ALL
SELECT 'Package Variants (Packages in UI)' as entity, COUNT(*) as count FROM package_variants WHERE is_active = true
UNION ALL
SELECT 'Package Levels (Variants in UI)' as entity, COUNT(*) as count FROM package_levels WHERE is_active = true
UNION ALL
SELECT 'Distance Pricing' as entity, COUNT(*) as count FROM distance_pricing WHERE is_active = true;
