-- Disable RLS on coupons table
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- Drop all RLS policies
DROP POLICY IF EXISTS "coupons_select_policy" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_policy" ON coupons;
DROP POLICY IF EXISTS "coupons_update_policy" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_policy" ON coupons;
DROP POLICY IF EXISTS "Allow authenticated operations on coupons" ON coupons;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'coupons';
