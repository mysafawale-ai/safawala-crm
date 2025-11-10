-- Add Security Deposits to Package Variants (Explicit Version)
-- ₹5,000 for categories: 21, 31, 41, 51, 61, 71, 81, 91 Safas
-- ₹10,000 for category: 101 Safas
-- Date: 10 November 2025

-- This version explicitly lists category names instead of pattern matching

BEGIN;

-- STEP 1: Add the deposit_amount column if it doesn't exist
ALTER TABLE package_variants
ADD COLUMN IF NOT EXISTS deposit_amount numeric(12,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN package_variants.deposit_amount IS 'Refundable security deposit amount for this variant';

-- First, let's identify the category IDs
-- Run this first to see what categories exist
/*
SELECT 
  id,
  name,
  description
FROM product_categories
WHERE name ~ '\d{2,3}\s*Safa'
ORDER BY name;
*/

-- Step 2: Update deposit amounts for each package category
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

-- Verification queries
SELECT 
  pc.name as category_name,
  COUNT(pv.id) as total_variants,
  COUNT(CASE WHEN pv.deposit_amount > 0 THEN 1 END) as with_deposit,
  MIN(pv.deposit_amount) as min_deposit,
  MAX(pv.deposit_amount) as max_deposit
FROM package_variants pv
JOIN packages p ON pv.package_id = p.id
JOIN product_categories pc ON p.category_id = pc.id
WHERE pc.name IN ('21 Safas', '31 Safas', '41 Safas', '51 Safas', '61 Safas', '71 Safas', '81 Safas', '91 Safas', '101 Safas')
GROUP BY pc.name
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
  END;

-- Detailed view of all affected variants
SELECT 
  pc.name as category,
  pv.name as variant_name,
  pv.base_price,
  pv.deposit_amount,
  pv.is_active,
  pv.updated_at
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
