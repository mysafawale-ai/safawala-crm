-- ================================================================
-- STEP 6: MIGRATE EXISTING DATA
-- ================================================================
-- Run this sixth - Links your existing data to new structure
-- Safe to run multiple times (checks for existing data)
-- ================================================================

-- Link package_variants directly to categories (bypassing package_sets)
UPDATE package_variants pv
SET 
    category_id = ps.category_id,
    franchise_id = ps.franchise_id,
    display_order = 0
FROM package_sets ps
WHERE pv.package_id = ps.id
AND pv.category_id IS NULL;

-- Create default levels (Raja, VIP, VVIP) for each variant
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

-- Migrate distance_pricing to new structure (link to Raja level by default)
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

-- ================================================================
-- SUCCESS: Data migrated
-- ================================================================
