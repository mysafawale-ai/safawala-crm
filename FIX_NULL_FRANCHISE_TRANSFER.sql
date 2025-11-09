-- FIX: Handle NULL franchise_id values before transfer

-- Step 1: Check which products have NULL franchise_id
SELECT 
  COUNT(*) as products_with_null_franchise,
  COUNT(DISTINCT franchise_id) as unique_franchises
FROM products
WHERE franchise_id IS NULL;

-- Step 2: Check all products and their franchise status
SELECT 
  CASE 
    WHEN franchise_id IS NULL THEN 'NULL (Orphaned)'
    WHEN franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1) THEN 'Vadodara'
    WHEN franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1) THEN 'Mysafawale'
    ELSE 'Other Franchise'
  END as franchise_location,
  COUNT(*) as product_count
FROM products
GROUP BY franchise_location;

-- Step 3: Fix NULL franchise_id by assigning to mysafawale
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id IS NULL;

-- Step 4: Now transfer from vadodara to mysafawale
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
);

-- Step 5: Verify all products now have franchise_id
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN franchise_id IS NOT NULL THEN 1 END) as with_franchise,
  COUNT(CASE WHEN franchise_id IS NULL THEN 1 END) as null_franchise
FROM products;

-- Step 6: Verify final distribution
SELECT 
  CASE 
    WHEN franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1) THEN '✅ Mysafawale (destination)'
    WHEN franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1) THEN '❌ Vadodara (should be 0)'
    ELSE 'Other'
  END as franchise,
  COUNT(*) as product_count
FROM products
GROUP BY franchise_id;
