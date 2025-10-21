-- ================================================================
-- QUICK START GUIDE - NO ERRORS
-- ================================================================

-- Copy each section and run separately in Supabase SQL Editor
-- Wait for each to complete before running the next

-- ================================================================
-- 1. CREATE TABLE (Run this first)
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
-- 2. ADD COLUMNS (Run this second)
-- ================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'package_variants' AND column_name = 'category_id') THEN
        ALTER TABLE package_variants ADD COLUMN category_id UUID REFERENCES packages_categories(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'package_variants' AND column_name = 'display_order') THEN
        ALTER TABLE package_variants ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'package_variants' AND column_name = 'franchise_id') THEN
        ALTER TABLE package_variants ADD COLUMN franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'distance_pricing' AND column_name = 'level_id') THEN
        ALTER TABLE distance_pricing ADD COLUMN level_id UUID REFERENCES package_levels(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ================================================================
-- 3. CREATE INDEXES (Run this third)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_package_levels_variant_id ON package_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_package_levels_active ON package_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_package_variants_category_id ON package_variants(category_id);
CREATE INDEX IF NOT EXISTS idx_distance_pricing_level_id ON distance_pricing(level_id);

-- ================================================================
-- 4. SETUP RLS (Run this fourth)
-- ================================================================
ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON package_levels;

CREATE POLICY "Allow all operations for authenticated users" 
    ON package_levels FOR ALL TO authenticated USING (true);

-- ================================================================
-- 5. CREATE TRIGGER (Run this fifth)
-- ================================================================
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
-- DONE! Run verification:
-- ================================================================
SELECT 'Setup Complete!' as message;
