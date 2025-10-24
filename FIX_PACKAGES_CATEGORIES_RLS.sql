-- =====================================================
-- FIX: Enable RLS and Create Policies for packages_categories
-- =====================================================

-- Step 1: Check if table exists and enable RLS
ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to view categories" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to create categories" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON packages_categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON packages_categories;

-- Step 3: Create policies for SELECT (view)
CREATE POLICY "Allow authenticated users to view categories"
ON packages_categories
FOR SELECT
TO authenticated
USING (true);  -- All authenticated users can view all categories

-- Step 4: Create policies for INSERT (create)
CREATE POLICY "Allow authenticated users to create categories"
ON packages_categories
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is authenticated
  auth.uid() IS NOT NULL
);

-- Step 5: Create policies for UPDATE
CREATE POLICY "Allow authenticated users to update categories"
ON packages_categories
FOR UPDATE
TO authenticated
USING (true)  -- Can see all categories
WITH CHECK (
  -- Allow if user is authenticated
  auth.uid() IS NOT NULL
);

-- Step 6: Create policies for DELETE
CREATE POLICY "Allow authenticated users to delete categories"
ON packages_categories
FOR DELETE
TO authenticated
USING (
  -- Allow if user is authenticated
  auth.uid() IS NOT NULL
);

-- Step 7: Verify policies are created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'packages_categories';

-- Step 8: Test with a simple query
SELECT 
  '✅ RLS Policies Created' as status,
  'Users can now create/update/delete categories' as message;
