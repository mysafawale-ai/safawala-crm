/**
 * Database Verification Queries for Customer Management
 * 
 * Use these SQL queries in your Supabase dashboard or database client
 * to verify customer data persistence and integrity.
 */

-- =====================================================
-- 1. VERIFY CUSTOMER CREATION
-- =====================================================

-- Check if customer was created correctly
SELECT 
    id,
    customer_code,
    name,
    email,
    phone,
    whatsapp,
    address,
    city,
    state,
    pincode,
    franchise_id,
    created_at,
    updated_at
FROM customers 
WHERE email = 'your-test-email@example.com'  -- Replace with your test email
ORDER BY created_at DESC;

-- =====================================================
-- 2. VERIFY DATA INTEGRITY
-- =====================================================

-- Check for any NULL values in required fields
SELECT 
    COUNT(*) as total_customers,
    COUNT(name) as has_name,
    COUNT(phone) as has_phone,
    COUNT(pincode) as has_pincode,
    COUNT(franchise_id) as has_franchise_id
FROM customers;

-- Find customers with invalid data
SELECT id, name, email, phone, pincode
FROM customers 
WHERE 
    name IS NULL OR name = '' OR
    phone IS NULL OR LENGTH(phone) < 10 OR
    pincode IS NULL OR LENGTH(pincode) != 6;

-- =====================================================
-- 3. VERIFY TIMESTAMPS
-- =====================================================

-- Check timestamp consistency
SELECT 
    id,
    name,
    created_at,
    updated_at,
    CASE 
        WHEN updated_at >= created_at THEN 'OK'
        ELSE 'ERROR: updated_at before created_at'
    END as timestamp_check
FROM customers
ORDER BY created_at DESC;

-- =====================================================
-- 4. VERIFY UPDATES
-- =====================================================

-- Find recently updated customers (last 24 hours)
SELECT 
    id,
    name,
    email,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (updated_at - created_at)) / 60 as minutes_between_create_update
FROM customers 
WHERE updated_at > created_at
AND updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;

-- =====================================================
-- 5. VERIFY AUDIT LOGS (if table exists)
-- =====================================================

-- Check audit log entries for customers
SELECT 
    table_name,
    operation,
    record_id,
    user_email,
    timestamp,
    changes_summary
FROM audit_logs 
WHERE table_name = 'customers'
ORDER BY timestamp DESC
LIMIT 20;

-- Count operations by type
SELECT 
    operation,
    COUNT(*) as count
FROM audit_logs 
WHERE table_name = 'customers'
GROUP BY operation;

-- =====================================================
-- 6. VERIFY DUPLICATES
-- =====================================================

-- Check for duplicate phone numbers
SELECT 
    phone, 
    COUNT(*) as count,
    STRING_AGG(name, ', ') as customer_names
FROM customers 
GROUP BY phone 
HAVING COUNT(*) > 1;

-- Check for duplicate emails
SELECT 
    email, 
    COUNT(*) as count,
    STRING_AGG(name, ', ') as customer_names
FROM customers 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- =====================================================
-- 7. VERIFY FRANCHISE RELATIONSHIPS
-- =====================================================

-- Check if all customers have valid franchise_id
SELECT 
    c.id,
    c.name,
    c.franchise_id,
    f.name as franchise_name
FROM customers c
LEFT JOIN franchises f ON c.franchise_id = f.id
WHERE f.id IS NULL;  -- This should return 0 rows

-- =====================================================
-- 8. PERFORMANCE VERIFICATION
-- =====================================================

-- Check table size and performance
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'customers';

-- Check for missing indexes (if query is slow)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM customers 
WHERE email = 'test@example.com';

-- =====================================================
-- 9. DATA QUALITY CHECKS
-- =====================================================

-- Check email format validity
SELECT 
    id,
    name,
    email
FROM customers 
WHERE email IS NOT NULL 
AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- Check phone number format
SELECT 
    id,
    name,
    phone
FROM customers 
WHERE phone IS NOT NULL 
AND (LENGTH(phone) < 10 OR phone !~ '^[0-9]+$');

-- Check pincode format
SELECT 
    id,
    name,
    pincode
FROM customers 
WHERE pincode IS NOT NULL 
AND (LENGTH(pincode) != 6 OR pincode !~ '^[0-9]{6}$');

-- =====================================================
-- 10. CLEANUP TEST DATA (USE WITH CAUTION)
-- =====================================================

-- Remove test customers (uncomment and modify as needed)
-- DELETE FROM customers 
-- WHERE email LIKE '%@example.com' 
-- OR name LIKE '%Test%' 
-- OR name LIKE '%QA%';

-- =====================================================
-- VERIFICATION SUMMARY QUERY
-- =====================================================

-- Overall health check
SELECT 
    'Total Customers' as metric,
    COUNT(*)::text as value
FROM customers
UNION ALL
SELECT 
    'Customers Created Today',
    COUNT(*)::text
FROM customers 
WHERE DATE(created_at) = CURRENT_DATE
UNION ALL
SELECT 
    'Customers Updated Today',
    COUNT(*)::text
FROM customers 
WHERE DATE(updated_at) = CURRENT_DATE
AND updated_at > created_at
UNION ALL
SELECT 
    'Customers with Valid Email',
    COUNT(*)::text
FROM customers 
WHERE email IS NOT NULL 
AND email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
UNION ALL
SELECT 
    'Customers with Valid Phone',
    COUNT(*)::text
FROM customers 
WHERE phone IS NOT NULL 
AND LENGTH(phone) >= 10
UNION ALL
SELECT 
    'Duplicate Phone Numbers',
    COUNT(*)::text
FROM (
    SELECT phone 
    FROM customers 
    GROUP BY phone 
    HAVING COUNT(*) > 1
) dups;