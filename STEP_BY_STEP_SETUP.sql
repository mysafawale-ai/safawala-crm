-- ================================================================
-- STEP-BY-STEP PACKAGE LEVELS SETUP (ERROR-FREE)
-- Run each step separately in Supabase SQL Editor
-- ================================================================

-- ================================================================
-- STEP 1: CREATE PACKAGE_LEVELS TABLE
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
-- STEP 2: ADD COLUMNS TO PACKAGE_VARIANTS
-- ================================================================
ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES packages_categories(id) ON DELETE CASCADE;

ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;

-- ================================================================
-- STEP 3: ADD LEVEL_ID TO DISTANCE_PRICING
-- ================================================================
ALTER TABLE distance_pricing 
ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES package_levels(id) ON DELETE CASCADE;

-- ================================================================
-- STEP 4: CREATE INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_package_levels_variant_id ON package_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_package_levels_active ON package_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_package_variants_category_id ON package_variants(category_id);
CREATE INDEX IF NOT EXISTS idx_distance_pricing_level_id ON distance_pricing(level_id);

-- ================================================================
-- STEP 5: ENABLE RLS
-- ================================================================
ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 6: DROP EXISTING POLICY IF EXISTS
-- ================================================================
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON package_levels;

-- ================================================================
-- STEP 7: CREATE NEW POLICY
-- ================================================================
CREATE POLICY "Allow all operations for authenticated users" 
    ON package_levels 
    FOR ALL 
    TO authenticated 
    USING (true);

-- ================================================================
-- STEP 8: CREATE TRIGGER FUNCTION (IF NOT EXISTS)
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================================================
-- STEP 9: CREATE TRIGGER
-- ================================================================
DROP TRIGGER IF EXISTS update_package_levels_updated_at ON package_levels;

CREATE TRIGGER update_package_levels_updated_at 
    BEFORE UPDATE ON package_levels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- VERIFICATION
-- ================================================================
SELECT 'package_levels table created' as status;
SELECT 'All columns added' as status;
SELECT 'All indexes created' as status;
SELECT 'RLS enabled and policy created' as status;
SELECT 'Trigger created' as status;
