-- AUTOMATED INVENTORY TRANSFER SCRIPT
-- Transfer all inventory from vadodara@safawala.com to mysafawale@gmail.com
-- This script does everything in the correct order with verification

BEGIN;  -- Start transaction (rollback if anything fails)

-- Step 1: Get franchise IDs and store in variables
WITH franchise_ids AS (
  SELECT 
    (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1) as source_franchise,
    (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1) as dest_franchise
)

-- Step 2: Count products BEFORE transfer
SELECT 
  'BEFORE TRANSFER' as status,
  'Source (Vadodara)' as franchise,
  COUNT(*) as product_count,
  SUM(COALESCE(pi.quantity, 0)) as total_stock
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1)

UNION ALL

SELECT 
  'BEFORE TRANSFER' as status,
  'Destination (Mysafawale)' as franchise,
  COUNT(*) as product_count,
  SUM(COALESCE(pi.quantity, 0)) as total_stock
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1);

-- Step 3: Do the transfer
UPDATE products
SET franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1
)
WHERE franchise_id = (
  SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1
);

-- Step 4: Count products AFTER transfer (to verify)
SELECT 
  'AFTER TRANSFER' as status,
  'Source (Vadodara)' as franchise,
  COUNT(*) as product_count,
  SUM(COALESCE(pi.quantity, 0)) as total_stock
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1)

UNION ALL

SELECT 
  'AFTER TRANSFER' as status,
  'Destination (Mysafawale)' as franchise,
  COUNT(*) as product_count,
  SUM(COALESCE(pi.quantity, 0)) as total_stock
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
WHERE p.franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1);

COMMIT;  -- Save changes. Remove this if you want to test first (ROLLBACK instead)
