-- =====================================================
-- REMOVE ALL RLS POLICIES - Service Role Auth
-- =====================================================
-- We're moving auth to the API layer using service role
-- RLS policies are dropped completely

-- 1. DROP ALL EXISTING RLS POLICIES
DROP POLICY IF EXISTS coupons_select_policy ON coupons;
DROP POLICY IF EXISTS coupons_insert_policy ON coupons;
DROP POLICY IF EXISTS coupons_update_policy ON coupons;
DROP POLICY IF EXISTS coupons_delete_policy ON coupons;
DROP POLICY IF EXISTS "Super admins can view all coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise users can view their coupons" ON coupons;
DROP POLICY IF EXISTS "Super admins can create coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise admins can create coupons" ON coupons;
DROP POLICY IF EXISTS "Super admins can update coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise admins can update their coupons" ON coupons;
DROP POLICY IF EXISTS "Super admins can delete coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise admins can delete their coupons" ON coupons;

DROP POLICY IF EXISTS coupon_usage_select_policy ON coupon_usage;
DROP POLICY IF EXISTS coupon_usage_insert_policy ON coupon_usage;
DROP POLICY IF EXISTS "Super admins can view all coupon usage" ON coupon_usage;
DROP POLICY IF EXISTS "Franchise users can view their coupon usage" ON coupon_usage;
DROP POLICY IF EXISTS "Authenticated users can track coupon usage" ON coupon_usage;

-- 2. DISABLE RLS COMPLETELY
-- Auth is now handled at API layer via service role client
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;

-- 3. VERIFICATION
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('coupons', 'coupon_usage')
ORDER BY tablename;

-- 4. Verify no policies remain
SELECT 
    policyname,
    tablename
FROM pg_policies
WHERE tablename IN ('coupons', 'coupon_usage');
