-- URGENT: Disable RLS on users table
-- This is blocking all staff queries from returning data

-- Check current RLS status
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'users';

-- Disable RLS on users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify it's disabled
SELECT 
  tablename, 
  rowsecurity as "RLS Enabled (should be false now)"
FROM pg_tables 
WHERE tablename = 'users';

-- Test query to see if staff members are now visible
SELECT id, name, email, role, franchise_id
FROM users
WHERE role IN ('staff', 'franchise_admin')
ORDER BY name;

-- Count total users
SELECT 
  'Total users' as description,
  COUNT(*) as count
FROM users;
