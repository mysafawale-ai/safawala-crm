-- Check if there's an issue with the coupon data itself
SELECT 
  id,
  code,
  discount_type,
  discount_value,
  franchise_id,
  created_at
FROM coupons
LIMIT 10;

-- Check if franchise_id values are valid
SELECT DISTINCT franchise_id FROM coupons;

-- Check if the franchises those IDs belong to exist
SELECT f.id, f.name FROM franchises f 
WHERE f.id IN (SELECT DISTINCT franchise_id FROM coupons);

-- Check user franchise
SELECT id, email, franchise_id, role FROM users WHERE email = 'vadodara@safawala.com';
