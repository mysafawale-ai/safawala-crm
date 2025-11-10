-- Add/Update Security Deposits to ALL Package Variants (Overwrite Version)
-- ₹5,000 for categories: 21, 31, 41, 51, 61, 71, 81, 91 Safas
-- ₹10,000 for category: 101 Safas
-- Date: 10 November 2025
-- This version UPDATES ALL variants regardless of current deposit value

BEGIN;

-- IMPORTANT: This will OVERWRITE any existing security deposits
-- Remove the WHERE condition if you want to update ALL variants, even those with existing deposits

-- Update ALL variants for 21-91 Safa categories to ₹5,000
UPDATE package_variants
SET 
  security_deposit = 5000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories 
  WHERE name IN (
    '21 Safas',
    '31 Safas',
    '41 Safas',
    '51 Safas',
    '61 Safas',
    '71 Safas',
    '81 Safas',
    '91 Safas'
  )
);

-- Update ALL variants for 101 Safa category to ₹10,000
UPDATE package_variants
SET 
  security_deposit = 10000,
  updated_at = NOW()
WHERE category_id IN (
  SELECT id FROM product_categories 
  WHERE name = '101 Safas'
);

COMMIT;

-- Summary Report
SELECT 
  'Security deposits updated successfully!' as message,
  COUNT(*) as total_variants_updated
FROM package_variants
WHERE category_id IN (
  SELECT id FROM product_categories 
  WHERE name IN ('21 Safas', '31 Safas', '41 Safas', '51 Safas', '61 Safas', '71 Safas', '81 Safas', '91 Safas', '101 Safas')
);

-- Detailed Report by Category
SELECT 
  pc.name as category,
  COUNT(pv.id) as variants_count,
  pv.security_deposit as deposit_amount,
  COUNT(pv.id) * pv.security_deposit as total_if_all_booked
FROM package_variants pv
JOIN product_categories pc ON pc.id = pv.category_id
WHERE pc.name IN ('21 Safas', '31 Safas', '41 Safas', '51 Safas', '61 Safas', '71 Safas', '81 Safas', '91 Safas', '101 Safas')
GROUP BY pc.name, pv.security_deposit
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
