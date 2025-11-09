-- TRANSFER INVENTORY BETWEEN FRANCHISES
-- From: vadodara@safawala.com
-- To: mysafawale@gmail.com

-- Step 1: Get franchise IDs
SELECT 
  u.id as user_id,
  u.email,
  u.franchise_id,
  f.name as franchise_name,
  f.code as franchise_code
FROM users u
LEFT JOIN franchises f ON u.franchise_id = f.id
WHERE u.email IN ('vadodara@safawala.com', 'mysafawale@gmail.com')
ORDER BY u.email;

-- Step 2: Check current inventory for vadodara
SELECT 
  COUNT(*) as total_products,
  SUM(COALESCE(pi.quantity, 0)) as total_stock_units
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id IN (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com'
);

-- Step 3: Check current inventory for mysafawale
SELECT 
  COUNT(*) as total_products,
  SUM(COALESCE(pi.quantity, 0)) as total_stock_units
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id IN (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com'
);

-- Step 4: Transfer all products from vadodara to mysafawale
-- Run this ONLY after verifying the IDs above
/*
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id IN (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com'
);
*/

-- Step 5: Verify transfer
SELECT 
  COUNT(*) as products_transferred
FROM products
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
);
