-- =====================================================
-- FIX: Correct doubled stock quantities
-- =====================================================

-- Fix Brooch product (200 → 100)
UPDATE products
SET 
  stock_total = 100,
  stock_available = 100,
  updated_at = NOW()
WHERE name = 'Brooch (Wedding Pin Accessory)'
AND stock_available = 200;

-- Fix Mala product (200 → 100)
UPDATE products
SET 
  stock_total = 100,
  stock_available = 100,
  updated_at = NOW()
WHERE name = 'Mala (Neck Garland)'
AND stock_available = 200;

-- Verify the fix
SELECT 
  name,
  product_code,
  stock_total,
  stock_available,
  stock_booked
FROM products
WHERE name IN ('Brooch (Wedding Pin Accessory)', 'Mala (Neck Garland)', 'Dupattas')
ORDER BY name;

-- Show before/after summary
SELECT 
  '✅ Fixed stock quantities from 200 to 100' as status;
