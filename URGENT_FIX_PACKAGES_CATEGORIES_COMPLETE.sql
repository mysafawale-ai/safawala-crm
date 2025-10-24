-- =====================================================
-- URGENT FIX: Packages Categories - Add franchise_id & Fix RLS
-- =====================================================
-- This fixes the 401 error when creating categories
-- =====================================================

-- Step 1: Add franchise_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'packages_categories' 
        AND column_name = 'franchise_id'
    ) THEN
        ALTER TABLE packages_categories 
        ADD COLUMN franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_packages_categories_franchise 
        ON packages_categories(franchise_id);
        
        RAISE NOTICE '✅ Added franchise_id column to packages_categories';
    ELSE
        RAISE NOTICE 'ℹ️  franchise_id column already exists';
    END IF;
END $$;

-- Step 2: Drop all existing RLS policies
DROP POLICY IF EXISTS "Allow read access to all users" ON packages_categories;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON packages_categories;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON packages_categories;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to view categories" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to create categories" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON packages_categories;

-- Step 3: Ensure RLS is enabled
ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW RLS Policies with proper franchise isolation

-- SELECT Policy: Users see their franchise + global categories
CREATE POLICY "packages_categories_select_policy"
ON packages_categories
FOR SELECT
TO authenticated
USING (
  -- Super admins see all
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Other users see their franchise + global (NULL franchise_id)
  (
    franchise_id IS NULL 
    OR 
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
);

-- INSERT Policy: Users can create for their franchise
CREATE POLICY "packages_categories_insert_policy"
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
  -- Other users can only create for their franchise
  (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
);

-- UPDATE Policy: Users can update their franchise categories + global
CREATE POLICY "packages_categories_update_policy"
ON packages_categories
FOR UPDATE
TO authenticated
USING (
  -- Super admins can update all
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Other users can update their franchise + global
  (
    franchise_id IS NULL 
    OR 
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Same as USING clause
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  (
    franchise_id IS NULL 
    OR 
    franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
);

-- DELETE Policy: Users can delete their franchise categories (not global)
CREATE POLICY "packages_categories_delete_policy"
ON packages_categories
FOR DELETE
TO authenticated
USING (
  -- Super admins can delete all
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Other users can only delete their franchise categories (NOT global)
  (
    franchise_id IS NOT NULL
    AND franchise_id IN (
      SELECT franchise_id FROM users WHERE users.id = auth.uid()
    )
  )
);

-- Step 5: Grant permissions
GRANT ALL ON packages_categories TO authenticated;
GRANT SELECT ON packages_categories TO anon;

-- Step 6: Verify policies are created
SELECT 
  '📋 Policy Name: ' || policyname as policy_info,
  '   Command: ' || cmd as command,
  '   Roles: ' || array_to_string(roles, ', ') as roles_allowed
FROM pg_policies
WHERE tablename = 'packages_categories'
ORDER BY cmd, policyname;

-- Step 7: Check existing categories
SELECT 
  id,
  name,
  franchise_id,
  CASE 
    WHEN franchise_id IS NULL THEN '🌍 Global (visible to all)'
    ELSE '🏢 Franchise-specific'
  END as visibility,
  is_active,
  display_order
FROM packages_categories
ORDER BY display_order;

-- Step 8: Success message
SELECT 
  '✅ PACKAGES CATEGORIES FIX COMPLETE!' as status,
  'Users can now create/update/delete categories' as message,
  'Franchise isolation is properly configured' as isolation_status;
