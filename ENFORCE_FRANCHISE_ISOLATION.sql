-- =====================================================
-- ENFORCE FRANCHISE ISOLATION FOR PACKAGES CATEGORIES
-- =====================================================
-- Each franchise will only see their own categories
-- Super admins see all categories
-- =====================================================

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

-- SELECT: Only see own franchise categories (+ global if franchise_id is NULL)
CREATE POLICY "packages_categories_select_isolated" 
ON packages_categories
FOR SELECT 
TO authenticated
USING (
  -- Super admins see everything
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Franchise users only see their own franchise categories
  (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
  OR
  -- Global categories (franchise_id IS NULL) visible to all
  franchise_id IS NULL
);

-- INSERT: Can only create for own franchise
CREATE POLICY "packages_categories_insert_isolated" 
ON packages_categories
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Super admins can create global (NULL) or any franchise
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Franchise users can only create for their franchise
  (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('franchise_admin', 'franchise_owner')
    )
  )
);

-- UPDATE: Can only update own franchise categories (+ global for super_admin)
CREATE POLICY "packages_categories_update_isolated" 
ON packages_categories
FOR UPDATE 
TO authenticated
USING (
  -- Super admins can update everything
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Franchise users can only update their own franchise categories
  (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Same as USING - prevent changing to other franchise
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  franchise_id IN (
    SELECT franchise_id FROM users WHERE users.id = auth.uid()
  )
);

-- DELETE: Can only delete own franchise categories (NOT global)
CREATE POLICY "packages_categories_delete_isolated" 
ON packages_categories
FOR DELETE 
TO authenticated
USING (
  -- Super admins can delete everything
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Franchise users can only delete their own (not global)
  (
    franchise_id IS NOT NULL
    AND franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
);

-- Grant permissions
GRANT ALL ON packages_categories TO authenticated;

-- Verify policies
SELECT 
  '✅ FRANCHISE ISOLATION ENABLED' as status,
  'Each franchise sees only their own categories' as isolation;

-- Show policies
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'packages_categories'
ORDER BY cmd;

-- Test: Show what current user can see
SELECT 
  'Your visible categories:' as test,
  id,
  name,
  franchise_id,
  CASE 
    WHEN franchise_id IS NULL THEN '🌍 Global (shared)'
    WHEN franchise_id IN (SELECT franchise_id FROM users WHERE id = auth.uid()) THEN '✅ Your franchise'
    ELSE '❌ Other franchise (should not see this!)'
  END as access
FROM packages_categories
ORDER BY franchise_id NULLS FIRST, name;
