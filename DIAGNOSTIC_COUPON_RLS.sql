-- =====================================================
-- DIAGNOSTIC: Check Coupon Table & RLS Status
-- =====================================================

-- 1. Check if coupons table exists and has required columns
SELECT 
    table_name,
    string_agg(column_name, ', ') AS columns
FROM information_schema.columns
WHERE table_name = 'coupons'
GROUP BY table_name;

-- 2. Check RLS status on coupons table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'coupons';

-- 3. List all RLS policies on coupons table
SELECT 
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;

-- 4. Check foreign key constraints on coupons
SELECT 
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM information_schema.key_column_usage
WHERE table_name = 'coupons' AND foreign_table_name IS NOT NULL;

-- 5. Check if franchise_id column exists and type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'coupons' AND column_name = 'franchise_id';

-- 6. Try to insert a test coupon (will reveal actual error)
-- First check if test franchise exists
SELECT id, name FROM franchises LIMIT 1;

-- 7. Check user's franchise_id (if session exists)
SELECT id, email, franchise_id, role FROM users LIMIT 1;
