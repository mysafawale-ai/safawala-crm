-- =====================================================
-- GRANT FRANCHISE OWNERS FULL PACKAGES PERMISSIONS
-- =====================================================
-- This grants franchise_admin/franchise_owner roles:
-- - Create/Edit/Delete Package Categories
-- - Create/Edit/Delete Package Variants
-- - Create/Edit/Delete Package Levels
-- - Create/Edit/Delete Distance Pricing
-- =====================================================

-- ============================================
-- 1. PACKAGES_CATEGORIES - Drop & Recreate Policies
-- ============================================

-- Drop existing policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages_categories') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages_categories';
    END LOOP;
END $$;

-- Enable RLS
ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY;

-- SELECT: View own franchise + global categories
CREATE POLICY "packages_categories_select" ON packages_categories
FOR SELECT TO authenticated
USING (
  -- Super admins see all
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  -- Franchise owners/admins see their franchise + global
  (franchise_id IS NULL OR franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
);

-- INSERT: Franchise owners can create for their franchise
CREATE POLICY "packages_categories_insert" ON packages_categories
FOR INSERT TO authenticated
WITH CHECK (
  -- Super admins can create global or any franchise
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  -- Franchise admins/owners can create for their franchise
  (
    franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('franchise_admin', 'franchise_owner')
    )
  )
);

-- UPDATE: Can update own franchise + global
CREATE POLICY "packages_categories_update" ON packages_categories
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  (franchise_id IS NULL OR franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  (franchise_id IS NULL OR franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
);

-- DELETE: Can delete own franchise categories (not global)
CREATE POLICY "packages_categories_delete" ON packages_categories
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  (franchise_id IS NOT NULL AND franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
);

GRANT ALL ON packages_categories TO authenticated;

-- ============================================
-- 2. PACKAGES_VARIANTS - Drop & Recreate Policies
-- ============================================

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages_variants') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages_variants';
    END LOOP;
END $$;

ALTER TABLE packages_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_variants_select" ON packages_variants
FOR SELECT TO authenticated USING (true);

CREATE POLICY "packages_variants_insert" ON packages_variants
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'franchise_admin', 'franchise_owner'))
);

CREATE POLICY "packages_variants_update" ON packages_variants
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'franchise_admin', 'franchise_owner'))
);

CREATE POLICY "packages_variants_delete" ON packages_variants
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'franchise_admin', 'franchise_owner'))
);

GRANT ALL ON packages_variants TO authenticated;

-- ============================================
-- 3. PACKAGES_LEVELS - Drop & Recreate Policies
-- ============================================

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages_levels') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages_levels';
    END LOOP;
END $$;

ALTER TABLE packages_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_levels_select" ON packages_levels
FOR SELECT TO authenticated USING (true);

CREATE POLICY "packages_levels_insert" ON packages_levels
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'franchise_admin', 'franchise_owner'))
);

CREATE POLICY "packages_levels_update" ON packages_levels
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'franchise_admin', 'franchise_owner'))
);

CREATE POLICY "packages_levels_delete" ON packages_levels
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('super_admin', 'franchise_admin', 'franchise_owner'))
);

GRANT ALL ON packages_levels TO authenticated;

-- ============================================
-- 4. DISTANCE_PRICING - Drop & Recreate Policies
-- ============================================

DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'distance_pricing') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON distance_pricing';
    END LOOP;
END $$;

ALTER TABLE distance_pricing ENABLE ROW LEVEL SECURITY;

-- SELECT: View own franchise pricing
CREATE POLICY "distance_pricing_select" ON distance_pricing
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
);

-- INSERT: Franchise owners can create for their franchise
CREATE POLICY "distance_pricing_insert" ON distance_pricing
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  (
    franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('franchise_admin', 'franchise_owner')
    )
  )
);

-- UPDATE: Can update own franchise pricing
CREATE POLICY "distance_pricing_update" ON distance_pricing
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
);

-- DELETE: Can delete own franchise pricing
CREATE POLICY "distance_pricing_delete" ON distance_pricing
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
);

GRANT ALL ON distance_pricing TO authenticated;

-- ============================================
-- 5. VERIFY POLICIES CREATED
-- ============================================

SELECT 
  '✅ PACKAGES PERMISSIONS GRANTED' as status,
  'Franchise owners can now manage all packages components' as message;

-- Show all policies
SELECT 
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename IN ('packages_categories', 'packages_variants', 'packages_levels', 'distance_pricing')
ORDER BY tablename, cmd;

-- ============================================
-- 6. TEST CURRENT USER
-- ============================================

SELECT 
  'Current user check' as test,
  id,
  email,
  role,
  franchise_id,
  CASE 
    WHEN role IN ('franchise_admin', 'franchise_owner') THEN '✅ Can create packages'
    WHEN role = 'super_admin' THEN '✅ Can create everything'
    ELSE '❌ No packages permissions'
  END as permission_status
FROM users
WHERE email = 'surat@safawala.com';
