-- Check all products with their key fields
SELECT 
  id,
  name,
  is_custom,
  is_active,
  franchise_id,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 20;
