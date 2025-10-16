-- Check if sales_closed_by or sales_closed_by_id column exists in tables

-- 1. Check product_orders table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product_orders'
  AND (column_name LIKE '%sales%' OR column_name LIKE '%closed%')
ORDER BY column_name;

-- 2. Check package_bookings table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'package_bookings'
  AND (column_name LIKE '%sales%' OR column_name LIKE '%closed%')
ORDER BY column_name;

-- 3. Check actual data in product_orders
SELECT 
  id,
  order_number,
  sales_closed_by_id,
  is_quote,
  created_at
FROM product_orders
WHERE is_quote = true
ORDER BY created_at DESC
LIMIT 3;

-- 4. Check actual data in package_bookings
SELECT 
  id,
  package_number,
  sales_closed_by_id,
  is_quote,
  created_at
FROM package_bookings
WHERE is_quote = true
ORDER BY created_at DESC
LIMIT 3;

-- 5. Check staff table
SELECT id, name
FROM staff
LIMIT 5;
