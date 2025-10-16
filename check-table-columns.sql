-- Check actual column names in product_orders and package_bookings tables

-- 1. Product Orders columns
SELECT 
    '=== PRODUCT_ORDERS COLUMNS ===' as section,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'product_orders'
AND column_name LIKE '%number%'
ORDER BY ordinal_position;

-- 2. Package Bookings columns
SELECT 
    '=== PACKAGE_BOOKINGS COLUMNS ===' as section,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'package_bookings'
AND column_name LIKE '%number%'
ORDER BY ordinal_position;

-- 3. Check if there's an ID or number column we can use
SELECT 
    '=== ALL PRODUCT_ORDERS COLUMNS ===' as section,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'product_orders'
ORDER BY ordinal_position
LIMIT 20;

-- 4. Check package_bookings columns
SELECT 
    '=== ALL PACKAGE_BOOKINGS COLUMNS ===' as section,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'package_bookings'
ORDER BY ordinal_position
LIMIT 20;
