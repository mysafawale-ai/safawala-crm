-- =====================================================
-- NUCLEAR OPTION: Complete RLS Bypass for Testing
-- =====================================================
-- This completely disables RLS restrictions
-- USE ONLY FOR TESTING!
-- =====================================================

-- Disable RLS entirely (for testing only)
ALTER TABLE packages_categories DISABLE ROW LEVEL SECURITY;

-- Or keep RLS enabled but make it super permissive
ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages_categories') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages_categories';
    END LOOP;
END $$;

-- Create one super permissive policy
CREATE POLICY "temp_allow_everything" 
ON packages_categories 
FOR ALL 
TO public
USING (true) 
WITH CHECK (true);

-- Grant all permissions
GRANT ALL ON packages_categories TO authenticated;
GRANT ALL ON packages_categories TO anon;
GRANT ALL ON packages_categories TO public;

SELECT '✅ RLS COMPLETELY DISABLED' as status,
       'If this works, the issue was RLS policies' as diagnosis,
       'If this still fails, the issue is authentication' as next_step;

-- Test by trying to count rows
SELECT COUNT(*) as total_categories FROM packages_categories;
