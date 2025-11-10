-- Add Security Deposits to Package Variants (Explicit Version)
-- ₹5,000 for categories: 21, 31, 41, 51, 61, 71, 81, 91 Safas
-- ₹10,000 for category: 101 Safas
-- Date: 10 November 2025

-- This version explicitly lists category names instead of pattern matching

BEGIN;

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

-- Update security_deposit for 21 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '21 Safas'
);

-- Update security_deposit for 31 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '31 Safas'
);

-- Update security_deposit for 41 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '41 Safas'
);

-- Update security_deposit for 51 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '51 Safas'
);

-- Update security_deposit for 61 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '61 Safas'
);

-- Update security_deposit for 71 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '71 Safas'
);

-- Update security_deposit for 81 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '81 Safas'
);

-- Update security_deposit for 91 Safas (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '91 Safas'
);

-- Update security_deposit for 101 Safas (₹10,000)
UPDATE package_variants
SET 
  security_deposit = 10000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories WHERE name = '101 Safas'
);

COMMIT;

-- Verification queries
SELECT 
  pc.name as category_name,
  COUNT(pv.id) as total_variants,
  COUNT(CASE WHEN pv.security_deposit > 0 THEN 1 END) as with_deposit,
  MIN(pv.security_deposit) as min_deposit,
  MAX(pv.security_deposit) as max_deposit
FROM package_variants pv
JOIN product_categories pc ON pc.id = pv.category_id
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
  pv.security_deposit,
  pv.is_active,
  pv.updated_at
FROM package_variants pv
JOIN product_categories pc ON pc.id = pv.category_id
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
