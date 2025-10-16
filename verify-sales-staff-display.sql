-- Quick Verification: Check if sales staff data is properly set up

-- 1. Check available staff members
SELECT 
    '=== AVAILABLE STAFF MEMBERS ===' as section,
    id,
    name,
    email,
    role,
    is_active
FROM users
WHERE role IN ('staff', 'franchise_admin', 'admin')
ORDER BY created_at;

-- 2. Check quotes with sales_closed_by_id in product_orders
SELECT 
    '=== PRODUCT ORDERS WITH SALES STAFF ===' as section,
    COUNT(*) as total_orders,
    COUNT(sales_closed_by_id) as orders_with_sales_staff,
    COUNT(*) - COUNT(sales_closed_by_id) as orders_without_sales_staff
FROM product_orders
WHERE is_quote = true;

-- 3. Check quotes with sales_closed_by_id in package_bookings
SELECT 
    '=== PACKAGE BOOKINGS WITH SALES STAFF ===' as section,
    COUNT(*) as total_bookings,
    COUNT(sales_closed_by_id) as bookings_with_sales_staff,
    COUNT(*) - COUNT(sales_closed_by_id) as bookings_without_sales_staff
FROM package_bookings
WHERE is_quote = true;

-- 4. Show sample quotes with staff names (Product Orders)
SELECT 
    '=== SAMPLE PRODUCT ORDERS WITH SALES STAFF ===' as section,
    po.id,
    po.sales_closed_by_id,
    u.name as sales_staff_name,
    u.email as sales_staff_email,
    c.name as customer_name,
    po.created_at
FROM product_orders po
LEFT JOIN users u ON po.sales_closed_by_id = u.id
LEFT JOIN customers c ON po.customer_id = c.id
WHERE po.is_quote = true
ORDER BY po.created_at DESC
LIMIT 10;

-- 5. Show sample quotes with staff names (Package Bookings)
SELECT 
    '=== SAMPLE PACKAGE BOOKINGS WITH SALES STAFF ===' as section,
    pb.id,
    pb.sales_closed_by_id,
    u.name as sales_staff_name,
    u.email as sales_staff_email,
    c.name as customer_name,
    pb.created_at
FROM package_bookings pb
LEFT JOIN users u ON pb.sales_closed_by_id = u.id
LEFT JOIN customers c ON pb.customer_id = c.id
WHERE pb.is_quote = true
ORDER BY pb.created_at DESC
LIMIT 10;

-- 6. Quick fix: Update any NULL sales_closed_by_id with first staff member
DO $$
DECLARE
    staff_id_to_use UUID;
    updated_product_orders INT;
    updated_package_bookings INT;
BEGIN
    -- Get first active staff member
    SELECT id INTO staff_id_to_use
    FROM users
    WHERE role IN ('staff', 'franchise_admin', 'admin')
    AND is_active = true
    ORDER BY created_at
    LIMIT 1;
    
    IF staff_id_to_use IS NOT NULL THEN
        -- Update product_orders
        UPDATE product_orders
        SET sales_closed_by_id = staff_id_to_use
        WHERE is_quote = true 
        AND sales_closed_by_id IS NULL;
        
        GET DIAGNOSTICS updated_product_orders = ROW_COUNT;
        
        -- Update package_bookings
        UPDATE package_bookings
        SET sales_closed_by_id = staff_id_to_use
        WHERE is_quote = true 
        AND sales_closed_by_id IS NULL;
        
        GET DIAGNOSTICS updated_package_bookings = ROW_COUNT;
        
        RAISE NOTICE '✅ Updated % product orders and % package bookings with sales_closed_by_id: %', 
            updated_product_orders, updated_package_bookings, staff_id_to_use;
    ELSE
        RAISE NOTICE '⚠️ No staff members found! Please create a user with role "staff", "franchise_admin", or "admin"';
    END IF;
END $$;

-- 7. Final verification
SELECT 
    '=== FINAL STATUS ===' as section,
    (SELECT COUNT(*) FROM users WHERE role IN ('staff', 'franchise_admin', 'admin') AND is_active = true) as active_staff_count,
    (SELECT COUNT(*) FROM product_orders WHERE is_quote = true AND sales_closed_by_id IS NOT NULL) as product_orders_with_staff,
    (SELECT COUNT(*) FROM package_bookings WHERE is_quote = true AND sales_closed_by_id IS NOT NULL) as package_bookings_with_staff,
    (SELECT COUNT(*) FROM product_orders WHERE is_quote = true AND sales_closed_by_id IS NULL) as product_orders_without_staff,
    (SELECT COUNT(*) FROM package_bookings WHERE is_quote = true AND sales_closed_by_id IS NULL) as package_bookings_without_staff;
