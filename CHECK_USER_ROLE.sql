-- =====================================================
-- CHECK USER ROLE AND FIX PERMISSIONS
-- =====================================================

-- 1. Check current user's details
SELECT 
  'Current User Details' as check_type,
  id,
  email,
  role,
  franchise_id,
  CASE 
    WHEN role = 'franchise_admin' THEN '✅ franchise_admin'
    WHEN role = 'franchise_owner' THEN '✅ franchise_owner'
    WHEN role = 'super_admin' THEN '✅ super_admin'
    ELSE '❌ Role: ' || role
  END as role_status
FROM users
WHERE id = auth.uid();

-- 2. Check if user exists in users table
SELECT 
  'Auth Mapping' as check_type,
  auth.uid() as auth_id,
  COUNT(*) as users_found,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ User found'
    ELSE '❌ User NOT found in users table'
  END as status
FROM users
WHERE id = auth.uid();

-- 3. Test the INSERT policy condition
SELECT 
  'Policy Test' as test_name,
  auth.uid() as current_user_id,
  u.role as user_role,
  u.franchise_id as user_franchise_id,
  CASE 
    WHEN u.role = 'super_admin' THEN '✅ Super admin - can create'
    WHEN u.role IN ('franchise_admin', 'franchise_owner') THEN '✅ Has required role'
    ELSE '❌ Role ' || u.role || ' does not have permission'
  END as permission_check
FROM users u
WHERE u.id = auth.uid();
