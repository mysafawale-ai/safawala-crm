-- =====================================================
-- QUICK AUTH & PERMISSIONS DIAGNOSTIC
-- =====================================================
-- Run this to verify your authentication and permissions
-- =====================================================

-- 1. Check current authenticated user (from Supabase Auth)
SELECT 
  'Current Auth User' as check_type,
  auth.uid() as user_id,
  auth.email() as email,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NOT AUTHENTICATED'
    ELSE '✅ Authenticated'
  END as auth_status;

-- 2. Check user profile and role
SELECT 
  'User Profile' as check_type,
  id,
  email,
  role,
  franchise_id,
  is_active,
  CASE 
    WHEN role IN ('franchise_admin', 'franchise_owner') THEN '✅ Has packages permissions'
    WHEN role = 'super_admin' THEN '✅ Full access'
    ELSE '⚠️ Limited access'
  END as permission_level
FROM users
WHERE email = 'surat@safawala.com';

-- 3. Check if auth.uid() matches user in database
SELECT 
  'Auth Mapping' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) THEN '✅ User found in database'
    ELSE '❌ User NOT found in database'
  END as mapping_status,
  auth.uid() as auth_user_id;

-- 4. Test packages_categories permissions
SELECT 
  'Packages Categories Access' as check_type,
  COUNT(*) as visible_categories,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Can view categories'
    ELSE '⚠️ No categories visible (might be empty table)'
  END as access_status
FROM packages_categories;

-- 5. Check RLS policies on packages_categories
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd as operation,
  CASE 
    WHEN permissive = 'PERMISSIVE' THEN '✅ Permissive'
    ELSE '⚠️ Restrictive'
  END as policy_type
FROM pg_policies
WHERE tablename = 'packages_categories'
ORDER BY cmd;

-- 6. Check if franchise_id column exists in packages_categories
SELECT 
  'Table Schema' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'packages_categories'
ORDER BY ordinal_position;

-- 7. Final recommendation
SELECT 
  '📋 NEXT STEPS' as recommendation,
  CASE 
    WHEN auth.uid() IS NULL THEN 
      '1. You are NOT authenticated in Supabase SQL Editor
2. Log out from app completely
3. Clear browser storage (F12 > Application > Clear site data)
4. Log back in as surat@safawala.com
5. Re-run this diagnostic'
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid()) THEN
      '1. Auth session exists but user not in database
2. Check if user table has matching auth.uid()
3. May need to re-create user account'
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('franchise_admin', 'franchise_owner', 'super_admin')
    ) THEN
      '✅ Everything looks good! 
If category creation still fails:
1. Clear browser storage
2. Log out and log back in
3. Check browser console for errors
4. Verify session token is set with: localStorage.getItem("sb-xplnyaxkusvuajtmorss-auth-token")'
    ELSE
      '⚠️ User role is: ' || (SELECT role FROM users WHERE id = auth.uid()) || '
This role may not have packages permissions.
Consider updating role to franchise_admin.'
  END as action_required;
