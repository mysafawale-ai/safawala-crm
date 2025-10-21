-- ================================================================
-- PACKAGE RESTRUCTURE MIGRATION
-- ================================================================
-- This script restructures the package management system:
-- OLD: Categories → Package Sets → Package Variants → Distance Pricing
-- NEW: Categories → Package Variants (shown as "Packages") → Package Levels (shown as "Variants") → Distance Pricing
-- ================================================================

-- ================================================================
-- STEP 1: CREATE NEW PACKAGE_LEVELS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS package_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    franchise_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 2: ADD CATEGORY_ID TO PACKAGE_VARIANTS
-- ================================================================
-- Add category_id column to package_variants (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'package_variants' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE package_variants 
        ADD COLUMN category_id UUID;
    END IF;
END $$;

-- Add display_order column to package_variants (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'package_variants' AND column_name = 'display_order'
    ) THEN
        ALTER TABLE package_variants 
        ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add franchise_id column to package_variants (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'package_variants' AND column_name = 'franchise_id'
    ) THEN
        ALTER TABLE package_variants 
        ADD COLUMN franchise_id UUID;
    END IF;
END $$;

-- ================================================================
-- STEP 3: BACKUP EXISTING DATA
-- ================================================================
-- Create backup tables
CREATE TABLE IF NOT EXISTS package_sets_backup AS SELECT * FROM package_sets;
CREATE TABLE IF NOT EXISTS package_variants_backup AS SELECT * FROM package_variants;
CREATE TABLE IF NOT EXISTS distance_pricing_backup AS SELECT * FROM distance_pricing;

-- ================================================================
-- STEP 4: MIGRATE DATA
-- ================================================================

-- 4a. Migrate package_variants → package_levels
-- Each existing variant becomes a level under the new structure
INSERT INTO package_levels (
    id,
    variant_id,
    name,
    description,
    base_price,
    is_active,
    display_order,
    franchise_id,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    pv.id as variant_id,
    pv.name,
    pv.description,
    pv.base_price,
    pv.is_active,
    0 as display_order,
    ps.franchise_id,
    pv.created_at,
    pv.updated_at
FROM package_variants pv
LEFT JOIN package_sets ps ON pv.package_id = ps.id
WHERE NOT EXISTS (
    SELECT 1 FROM package_levels pl WHERE pl.variant_id = pv.id
);

-- 4b. Update package_variants with data from package_sets
-- Set category_id for variants based on their parent package_set
UPDATE package_variants pv
SET 
    category_id = ps.category_id,
    franchise_id = ps.franchise_id
FROM package_sets ps
WHERE pv.package_id = ps.id
AND pv.category_id IS NULL;

-- 4c. For variants without proper linking, create default structure
-- Update any remaining variants without category_id
UPDATE package_variants
SET category_id = (SELECT id FROM packages_categories LIMIT 1)
WHERE category_id IS NULL;

-- ================================================================
-- STEP 5: ADD FOREIGN KEY CONSTRAINTS
-- ================================================================

-- Add foreign key for package_variants.category_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'package_variants_category_id_fkey'
    ) THEN
        ALTER TABLE package_variants
        ADD CONSTRAINT package_variants_category_id_fkey 
        FOREIGN KEY (category_id) 
        REFERENCES packages_categories(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for package_levels.variant_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'package_levels_variant_id_fkey'
    ) THEN
        ALTER TABLE package_levels
        ADD CONSTRAINT package_levels_variant_id_fkey 
        FOREIGN KEY (variant_id) 
        REFERENCES package_variants(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key for package_levels.franchise_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'package_levels_franchise_id_fkey'
    ) THEN
        ALTER TABLE package_levels
        ADD CONSTRAINT package_levels_franchise_id_fkey 
        FOREIGN KEY (franchise_id) 
        REFERENCES franchises(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================================
-- STEP 6: UPDATE DISTANCE_PRICING FOREIGN KEY
-- ================================================================

-- Add level_id column to distance_pricing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'distance_pricing' AND column_name = 'level_id'
    ) THEN
        ALTER TABLE distance_pricing 
        ADD COLUMN level_id UUID;
    END IF;
END $$;

-- Migrate distance_pricing relationships
-- Map old variant_id to new level_id
UPDATE distance_pricing dp
SET level_id = pl.id
FROM package_levels pl
WHERE dp.variant_id = pl.variant_id
AND dp.level_id IS NULL;

-- ================================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_package_variants_category_id 
    ON package_variants(category_id);

CREATE INDEX IF NOT EXISTS idx_package_variants_franchise_id 
    ON package_variants(franchise_id);

CREATE INDEX IF NOT EXISTS idx_package_levels_variant_id 
    ON package_levels(variant_id);

CREATE INDEX IF NOT EXISTS idx_package_levels_franchise_id 
    ON package_levels(franchise_id);

CREATE INDEX IF NOT EXISTS idx_package_levels_active 
    ON package_levels(is_active);

CREATE INDEX IF NOT EXISTS idx_distance_pricing_level_id 
    ON distance_pricing(level_id);

-- ================================================================
-- STEP 8: CREATE TRIGGERS
-- ================================================================

-- Trigger for package_levels updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_package_levels_updated_at ON package_levels;
CREATE TRIGGER update_package_levels_updated_at 
    BEFORE UPDATE ON package_levels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON package_levels;

-- Create new policies
CREATE POLICY "Allow all operations for authenticated users" 
    ON package_levels 
    FOR ALL 
    TO authenticated 
    USING (true);

-- ================================================================
-- STEP 10: CREATE DEFAULT LEVELS (Raja, VIP, VVIP)
-- ================================================================

-- For each variant that doesn't have levels yet, create default levels
INSERT INTO package_levels (
    variant_id,
    name,
    description,
    base_price,
    display_order,
    franchise_id
)
SELECT 
    pv.id as variant_id,
    level_name,
    level_description,
    pv.base_price + price_increment,
    display_order,
    pv.franchise_id
FROM package_variants pv
CROSS JOIN (
    VALUES 
        ('Raja', 'Standard tier with essential features', 0, 1),
        ('VIP', 'Premium tier with enhanced features', 5000, 2),
        ('VVIP', 'Ultimate tier with all premium features', 10000, 3)
) AS levels(level_name, level_description, price_increment, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM package_levels pl 
    WHERE pl.variant_id = pv.id 
    AND pl.name = level_name
);

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify the new structure
SELECT 
    'Categories' as entity,
    COUNT(*) as count
FROM packages_categories
UNION ALL
SELECT 
    'Package Variants (shown as Packages)' as entity,
    COUNT(*) as count
FROM package_variants
UNION ALL
SELECT 
    'Package Levels (shown as Variants)' as entity,
    COUNT(*) as count
FROM package_levels
UNION ALL
SELECT 
    'Distance Pricing' as entity,
    COUNT(*) as count
FROM distance_pricing;

-- Show the new hierarchy
SELECT 
    pc.name as category,
    pv.name as package_variant,
    pl.name as package_level,
    pl.base_price,
    COUNT(dp.id) as distance_pricing_count
FROM packages_categories pc
LEFT JOIN package_variants pv ON pv.category_id = pc.id
LEFT JOIN package_levels pl ON pl.variant_id = pv.id
LEFT JOIN distance_pricing dp ON dp.level_id = pl.id
GROUP BY pc.name, pv.name, pl.name, pl.base_price
ORDER BY pc.name, pv.name, pl.display_order;

-- ================================================================
-- NOTES
-- ================================================================
-- 1. Old package_sets table is NOT dropped (kept for backward compatibility)
-- 2. You can safely drop it later: DROP TABLE package_sets CASCADE;
-- 3. Backup tables created: package_sets_backup, package_variants_backup, distance_pricing_backup
-- 4. To rollback: Restore from backup tables
-- ================================================================
