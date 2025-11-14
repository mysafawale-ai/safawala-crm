-- =====================================================
-- PRODUCTION-READY COUPON SYSTEM FIX
-- =====================================================

-- STEP 1: Fix column constraints
ALTER TABLE coupons
ALTER COLUMN discount_value SET NOT NULL,
ALTER COLUMN discount_value SET DEFAULT 0,
ALTER COLUMN franchise_id SET NOT NULL;

-- STEP 2: Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- STEP 3: Drop old policies (if any)
DROP POLICY IF EXISTS "Users can view coupons for their franchise" ON coupons;
DROP POLICY IF EXISTS "Franchise owners can manage their coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise owners can update their coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise owners can delete their coupons" ON coupons;

-- STEP 4: Create RLS policies
-- Policy 1: SELECT - Users can view coupons for their franchise
CREATE POLICY "coupons_select_policy"
ON coupons
FOR SELECT
TO authenticated
USING (
  -- Franchise users see only their franchise's coupons
  CASE 
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' THEN true
    ELSE franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  END
);

-- Policy 2: INSERT - Users can create coupons for their franchise
CREATE POLICY "coupons_insert_policy"
ON coupons
FOR INSERT
TO authenticated
WITH CHECK (
  CASE 
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' THEN true
    ELSE franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  END
);

-- Policy 3: UPDATE - Users can update their franchise's coupons
CREATE POLICY "coupons_update_policy"
ON coupons
FOR UPDATE
TO authenticated
USING (
  CASE 
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' THEN true
    ELSE franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  END
)
WITH CHECK (
  CASE 
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' THEN true
    ELSE franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  END
);

-- Policy 4: DELETE - Users can delete their franchise's coupons
CREATE POLICY "coupons_delete_policy"
ON coupons
FOR DELETE
TO authenticated
USING (
  CASE 
    WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin' THEN true
    ELSE franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  END
);

-- STEP 5: Verify fix
SELECT 
  'FIX VERIFICATION' as step,
  'Column constraints' as check_item,
  COUNT(*) as status
FROM coupons;

SELECT 
  'RLS ENABLED' as verification,
  rowsecurity as enabled
FROM pg_tables
WHERE tablename = 'coupons' AND schemaname = 'public';

SELECT 
  'RLS POLICIES' as verification,
  policyname,
  permissive
FROM pg_policies
WHERE tablename = 'coupons'
ORDER BY policyname;
