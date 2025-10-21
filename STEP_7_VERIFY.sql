-- ================================================================
-- STEP 7: VERIFY THE MIGRATION
-- ================================================================
-- Run this last - Checks everything worked correctly
-- ================================================================

-- Show the new hierarchy
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
SELECT 'Package Variants' as entity, COUNT(*) as count FROM package_variants WHERE is_active = true
UNION ALL
SELECT 'Package Levels' as entity, COUNT(*) as count FROM package_levels WHERE is_active = true
UNION ALL
SELECT 'Distance Pricing' as entity, COUNT(*) as count FROM distance_pricing WHERE is_active = true;

-- ================================================================
-- SUCCESS: Verification complete
-- Check the results above to confirm your data structure
-- ================================================================
