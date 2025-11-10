-- Add Security Deposits to Package Variants
-- ₹5,000 for categories: 21, 31, 41, 51, 61, 71, 81, 91 Safas
-- ₹10,000 for category: 101 Safas
-- Date: 10 November 2025

-- First, let's see what we're working with
-- SELECT 
--   pv.id,
--   pv.name,
--   pc.name as category_name,
--   pv.security_deposit as current_deposit
-- FROM package_variants pv
-- LEFT JOIN product_categories pc ON pc.id = pv.category_id
-- WHERE pc.name ILIKE '%Safas%'
-- ORDER BY pc.name, pv.name;

-- Update security_deposit for 21-91 Safa categories (₹5,000)
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id 
  FROM product_categories 
  WHERE name ILIKE ANY(ARRAY[
    '%21%Safa%',
    '%31%Safa%', 
    '%41%Safa%',
    '%51%Safa%',
    '%61%Safa%',
    '%71%Safa%',
    '%81%Safa%',
    '%91%Safa%'
  ])
)
AND (security_deposit IS NULL OR security_deposit = 0);

-- Update security_deposit for 101 Safa category (₹10,000)
UPDATE package_variants
SET 
  security_deposit = 10000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id 
  FROM product_categories 
  WHERE name ILIKE '%101%Safa%'
)
AND (security_deposit IS NULL OR security_deposit = 0);

-- Verification query - Run this after to confirm
SELECT 
  pc.name as category_name,
  COUNT(pv.id) as variant_count,
  MIN(pv.security_deposit) as min_deposit,
  MAX(pv.security_deposit) as max_deposit,
  AVG(pv.security_deposit) as avg_deposit
FROM package_variants pv
LEFT JOIN product_categories pc ON pc.id = pv.category_id
WHERE pc.name ILIKE '%Safas%'
GROUP BY pc.name
ORDER BY pc.name;

-- Detailed verification - see all variants with their deposits
SELECT 
  pc.name as category_name,
  pv.name as variant_name,
  pv.base_price,
  pv.security_deposit,
  pv.updated_at
FROM package_variants pv
LEFT JOIN product_categories pc ON pc.id = pv.category_id
WHERE pc.name ILIKE '%Safas%'
ORDER BY pc.name, pv.name;
