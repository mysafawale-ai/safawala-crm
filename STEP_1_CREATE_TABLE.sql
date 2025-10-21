-- ================================================================
-- STEP 1: CREATE PACKAGE_LEVELS TABLE
-- ================================================================
-- Run this first - Creates the table structure
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ================================================================

CREATE TABLE IF NOT EXISTS package_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES package_variants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- SUCCESS: package_levels table created
-- ================================================================
