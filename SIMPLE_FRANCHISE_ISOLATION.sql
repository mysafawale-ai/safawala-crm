-- =====================================================
-- SIMPLIFIED FRANCHISE ISOLATION (WORKS WITH ALL ROLES)
-- =====================================================
-- Allows any authenticated user with franchise_id to create
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

-- SELECT: See own franchise + global categories
CREATE POLICY "packages_categories_select_simple" 
ON packages_categories
FOR SELECT 
TO authenticated
USING (
  -- See your franchise categories OR global (NULL)
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
  OR franchise_id IS NULL
);

-- INSERT: Can create for own franchise (any authenticated user)
CREATE POLICY "packages_categories_insert_simple" 
ON packages_categories
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Just check franchise_id matches user's franchise
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
);

-- UPDATE: Can update own franchise categories
CREATE POLICY "packages_categories_update_simple" 
ON packages_categories
FOR UPDATE 
TO authenticated
USING (
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
  OR franchise_id IS NULL
)
WITH CHECK (
  franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
);

-- DELETE: Can delete own franchise categories
CREATE POLICY "packages_categories_delete_simple" 
ON packages_categories
FOR DELETE 
TO authenticated
USING (
  franchise_id IS NOT NULL
  AND franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
);

-- Grant permissions
GRANT ALL ON packages_categories TO authenticated;

-- Verify
SELECT 
  '✅ SIMPLIFIED POLICIES APPLIED' as status,
  'All users with franchise_id can create categories' as note;

-- Test what you can see
SELECT 
  COUNT(*) as visible_categories,
  STRING_AGG(name, ', ') as category_names
FROM packages_categories;
