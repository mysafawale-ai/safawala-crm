-- FIX ALL ERRORS - Run this in Supabase SQL Editor
-- This script:
-- 1. Creates package_levels table (fixes 404 errors)
-- 2. Adds deposit_amount column (fixes 500 error)
-- 3. Populates deposit amounts for all package variants
-- Date: 10 November 2025

BEGIN;

-- ========================================
-- PART 1: CREATE PACKAGE_LEVELS TABLE
-- ========================================
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

-- Create indexes for package_levels
CREATE INDEX IF NOT EXISTS idx_package_levels_variant_id ON package_levels(variant_id);
CREATE INDEX IF NOT EXISTS idx_package_levels_active ON package_levels(is_active);
CREATE INDEX IF NOT EXISTS idx_package_levels_franchise_id ON package_levels(franchise_id);

-- Enable RLS on package_levels
ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for package_levels
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON package_levels;
CREATE POLICY "Allow all operations for authenticated users" 
    ON package_levels 
    FOR ALL 
    TO authenticated 
    USING (true);

-- Trigger for package_levels updated_at
CREATE OR REPLACE FUNCTION update_package_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_package_levels_updated_at ON package_levels;
CREATE TRIGGER trigger_update_package_levels_updated_at
    BEFORE UPDATE ON package_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_package_levels_updated_at();

-- ========================================
-- PART 2: ADD DEPOSIT_AMOUNT COLUMN
-- ========================================
ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC(12,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN package_variants.deposit_amount IS 'Refundable security deposit amount for this variant';

-- ========================================
-- PART 3: POPULATE DEPOSIT AMOUNTS
-- ========================================

-- 21 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '21 Safas'
  );

-- 31 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '31 Safas'
  );

-- 41 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '41 Safas'
  );

-- 51 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '51 Safas'
  );

-- 61 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '61 Safas'
  );

-- 71 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '71 Safas'
  );

-- 81 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '81 Safas'
  );

-- 91 Safas - ₹5,000 deposit
UPDATE package_variants pv
SET deposit_amount = 5000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '91 Safas'
  );

-- 101 Safas - ₹10,000 deposit
UPDATE package_variants pv
SET deposit_amount = 10000
FROM packages p
WHERE pv.package_id = p.id
  AND p.category_id IN (
    SELECT id FROM product_categories WHERE name = '101 Safas'
  );

COMMIT;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check package_levels table
SELECT 
  COUNT(*) as total_levels
FROM package_levels;

-- Check deposit amounts by category
SELECT 
  pc.name as category_name,
  COUNT(pv.id) as total_variants,
  COUNT(CASE WHEN pv.deposit_amount > 0 THEN 1 END) as with_deposit,
  MIN(pv.deposit_amount) as min_deposit,
  MAX(pv.deposit_amount) as max_deposit
FROM package_variants pv
JOIN packages p ON pv.package_id = p.id
JOIN product_categories pc ON p.category_id = pc.id
WHERE pc.name LIKE '% Safas'
GROUP BY pc.name
ORDER BY pc.name;

-- Detailed view of all variants with deposits
SELECT 
  pc.name as category,
  pv.name as variant_name,
  pv.base_price,
  pv.deposit_amount,
  pv.is_active
FROM package_variants pv
JOIN packages p ON pv.package_id = p.id
JOIN product_categories pc ON p.category_id = pc.id
WHERE pc.name IN ('21 Safas', '31 Safas', '41 Safas', '51 Safas', '61 Safas', '71 Safas', '81 Safas', '91 Safas', '101 Safas')
ORDER BY 
  CASE 
    WHEN pc.name = '21 Safas' THEN 1
    WHEN pc.name = '31 Safas' THEN 2
    WHEN pc.name = '41 Safas' THEN 3
    WHEN pc.name = '51 Safas' THEN 4
    WHEN pc.name = '61 Safas' THEN 5
    WHEN pc.name = '71 Safas' THEN 6
    WHEN pc.name = '81 Safas' THEN 7
    WHEN pc.name = '91 Safas' THEN 8
    WHEN pc.name = '101 Safas' THEN 9
  END,
  pv.name;
