-- =====================================================
-- DIAGNOSTIC: Check Packages Categories Setup
-- =====================================================

-- 1. Check if franchise_id column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'packages_categories'
ORDER BY ordinal_position;

-- 2. Check if RLS is enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as rls_status
FROM pg_tables
WHERE tablename = 'packages_categories';

-- 3. List all current policies
SELECT 
    policyname as "Policy Name",
    cmd as "Command Type",
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
        ELSE '⚠️ Restrictive'
    END as policy_type,
    roles as "Roles"
FROM pg_policies
WHERE tablename = 'packages_categories'
ORDER BY cmd, policyname;

-- 4. Check users table to see if auth.uid() mapping works
SELECT 
    id,
    email,
    role,
    franchise_id,
    CASE 
        WHEN id IS NOT NULL THEN '✅ Has UUID'
        ELSE '❌ No UUID'
    END as uuid_status
FROM users
WHERE email = 'surat@safawala.com'
LIMIT 1;

-- 5. Test if current user can see categories
SELECT 
    id,
    name,
    franchise_id,
    is_active,
    display_order
FROM packages_categories
ORDER BY display_order
LIMIT 5;
