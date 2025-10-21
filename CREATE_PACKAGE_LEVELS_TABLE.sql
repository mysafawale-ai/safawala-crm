-- Quick Package Levels Table Creation
-- Run this in Supabase SQL Editor

-- Create package_levels table
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

-- Add missing columns to package_variants
ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES packages_categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;

-- Add level_id to distance_pricing
ALTER TABLE distance_pricing 
ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES package_levels(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_package_levels_variant_id ON package_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_package_levels_active ON package_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_package_variants_category_id ON package_variants(category_id);
CREATE INDEX IF NOT EXISTS idx_distance_pricing_level_id ON distance_pricing(level_id);

-- Enable RLS
ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations for authenticated users" 
    ON package_levels 
    FOR ALL 
    TO authenticated 
    USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_package_levels_updated_at 
    BEFORE UPDATE ON package_levels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
