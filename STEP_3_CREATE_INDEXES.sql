-- ================================================================
-- STEP 3: CREATE INDEXES
-- ================================================================
-- Run this third - Creates performance indexes
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_package_levels_variant_id ON package_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_package_levels_active ON package_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_package_levels_franchise_id ON package_levels(franchise_id);
CREATE INDEX IF NOT EXISTS idx_package_variants_category_id ON package_variants(category_id);
CREATE INDEX IF NOT EXISTS idx_package_variants_franchise_id ON package_variants(franchise_id);
CREATE INDEX IF NOT EXISTS idx_distance_pricing_level_id ON distance_pricing(level_id);

-- ================================================================
-- SUCCESS: All indexes created
-- ================================================================
