-- Check user details
SELECT 
    'USER DETAILS' as section,
    email,
    role,
    franchise_id
FROM users 
WHERE email = 'mysafawale@gmail.com';

-- Check products for this franchise
SELECT 
    'PRODUCTS COUNT' as section,
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_products
FROM products p
JOIN users u ON p.franchise_id = u.franchise_id
WHERE u.email = 'mysafawale@gmail.com';

-- List products
SELECT 
    'PRODUCT LIST' as section,
    p.id,
    p.product_code,
    p.name,
    p.is_active,
    p.stock_available,
    p.stock_total,
    p.franchise_id
FROM products p
JOIN users u ON p.franchise_id = u.franchise_id
WHERE u.email = 'mysafawale@gmail.com'
ORDER BY p.created_at DESC
LIMIT 5;
