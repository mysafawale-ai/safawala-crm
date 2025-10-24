-- =====================================================
-- NUCLEAR OPTION: Super Permissive Policies for Testing
-- =====================================================
-- This removes all restrictions to test if RLS is the issue
-- =====================================================

-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages_categories') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages_categories';
    END LOOP;
END $$;

-- Step 2: Make sure RLS is enabled
ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY;

-- Step 3: Create SUPER PERMISSIVE policies (for testing)
CREATE POLICY "allow_all_select"
ON packages_categories
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_all_insert"
ON packages_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_all_update"
ON packages_categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_delete"
ON packages_categories
FOR DELETE
TO authenticated
USING (true);

-- Step 4: Grant all permissions
GRANT ALL ON packages_categories TO authenticated;
GRANT ALL ON packages_categories TO anon;

-- Step 5: Also grant on the sequence if it exists
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Step 6: Verify setup
SELECT 
    '✅ Super permissive policies created' as status,
    'All authenticated users can now do everything' as note;

-- Step 7: Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'packages_categories';
