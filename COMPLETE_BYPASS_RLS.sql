-- =====================================================
-- COMPLETE BYPASS - NO RLS CHECKS (TESTING ONLY)
-- =====================================================

-- Option 1: Completely disable RLS
ALTER TABLE packages_categories DISABLE ROW LEVEL SECURITY;

-- Option 2: Or keep RLS but make it completely open
-- ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY;
-- 
-- DO $$ 
-- DECLARE r RECORD;
-- BEGIN
--     FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages_categories') 
--     LOOP
--         EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages_categories';
--     END LOOP;
-- END $$;
-- 
-- CREATE POLICY "allow_all" ON packages_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- GRANT ALL ON packages_categories TO authenticated;

SELECT '✅ RLS COMPLETELY DISABLED' as status;
SELECT 'Try creating a category now' as next_step;
