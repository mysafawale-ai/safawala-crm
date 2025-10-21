-- ================================================================
-- STEP 2: ADD COLUMNS TO EXISTING TABLES
-- ================================================================
-- Run this second - Adds missing columns
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

-- Add category_id to package_variants (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'package_variants' AND column_name = 'category_id'
    ) THEN
        ALTER TABLE package_variants 
        ADD COLUMN category_id UUID REFERENCES packages_categories(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add display_order to package_variants (if not exists)
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

-- Add franchise_id to package_variants (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'package_variants' AND column_name = 'franchise_id'
    ) THEN
        ALTER TABLE package_variants 
        ADD COLUMN franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add level_id to distance_pricing (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'distance_pricing' AND column_name = 'level_id'
    ) THEN
        ALTER TABLE distance_pricing 
        ADD COLUMN level_id UUID REFERENCES package_levels(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================================
-- SUCCESS: All columns added
-- ================================================================
