-- =====================================================
-- SAFE: GRANT FRANCHISE OWNERS PACKAGES PERMISSIONS
-- =====================================================
-- Only updates tables that exist in your database
-- Checks for table existence before applying policies
-- =====================================================

-- ============================================
-- 1. CHECK WHICH TABLES EXIST
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '=== CHECKING EXISTING TABLES ===';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages_categories') THEN
        RAISE NOTICE '✅ packages_categories exists';
    ELSE
        RAISE NOTICE '❌ packages_categories does NOT exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_variants') THEN
        RAISE NOTICE '✅ package_variants exists';
    ELSE
        RAISE NOTICE '❌ package_variants does NOT exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        RAISE NOTICE '✅ packages exists';
    ELSE
        RAISE NOTICE '❌ packages does NOT exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'distance_pricing') THEN
        RAISE NOTICE '✅ distance_pricing exists';
    ELSE
        RAISE NOTICE '❌ distance_pricing does NOT exist';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        RAISE NOTICE '✅ categories exists';
    ELSE
        RAISE NOTICE '❌ categories does NOT exist';
    END IF;
END $$;

-- ============================================
-- 2. PACKAGES_CATEGORIES (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages_categories') THEN
        -- Drop existing policies
        EXECUTE 'DROP POLICY IF EXISTS "packages_categories_select" ON packages_categories';
        EXECUTE 'DROP POLICY IF EXISTS "packages_categories_insert" ON packages_categories';
        EXECUTE 'DROP POLICY IF EXISTS "packages_categories_update" ON packages_categories';
        EXECUTE 'DROP POLICY IF EXISTS "packages_categories_delete" ON packages_categories';
        
        -- Drop old test policies
        EXECUTE 'DROP POLICY IF EXISTS "allow_all_select" ON packages_categories';
        EXECUTE 'DROP POLICY IF EXISTS "allow_all_insert" ON packages_categories';
        EXECUTE 'DROP POLICY IF EXISTS "allow_all_update" ON packages_categories';
        EXECUTE 'DROP POLICY IF EXISTS "allow_all_delete" ON packages_categories';
        
        -- Enable RLS
        EXECUTE 'ALTER TABLE packages_categories ENABLE ROW LEVEL SECURITY';
        
        -- SELECT: View own franchise + global
        EXECUTE 'CREATE POLICY "packages_categories_select" ON packages_categories
        FOR SELECT TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''super_admin'')
          OR
          (franchise_id IS NULL OR franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
        )';
        
        -- INSERT: Franchise owners can create
        EXECUTE 'CREATE POLICY "packages_categories_insert" ON packages_categories
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''super_admin'')
          OR
          (
            franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid())
            AND EXISTS (
              SELECT 1 FROM users 
              WHERE users.id = auth.uid() 
              AND users.role IN (''franchise_admin'', ''franchise_owner'')
            )
          )
        )';
        
        -- UPDATE
        EXECUTE 'CREATE POLICY "packages_categories_update" ON packages_categories
        FOR UPDATE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''super_admin'')
          OR
          (franchise_id IS NULL OR franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
        )';
        
        -- DELETE
        EXECUTE 'CREATE POLICY "packages_categories_delete" ON packages_categories
        FOR DELETE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''super_admin'')
          OR
          (franchise_id IS NOT NULL AND franchise_id IN (SELECT franchise_id FROM users WHERE users.id = auth.uid()))
        )';
        
        EXECUTE 'GRANT ALL ON packages_categories TO authenticated';
        
        RAISE NOTICE '✅ Updated policies for packages_categories';
    END IF;
END $$;

-- ============================================
-- 3. PACKAGE_VARIANTS (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'package_variants') THEN
        -- Drop existing policies
        DECLARE r RECORD;
        BEGIN
            FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'package_variants') 
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON package_variants';
            END LOOP;
        END;
        
        EXECUTE 'ALTER TABLE package_variants ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "package_variants_select" ON package_variants FOR SELECT TO authenticated USING (true)';
        
        EXECUTE 'CREATE POLICY "package_variants_insert" ON package_variants
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "package_variants_update" ON package_variants
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "package_variants_delete" ON package_variants
        FOR DELETE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'GRANT ALL ON package_variants TO authenticated';
        
        RAISE NOTICE '✅ Updated policies for package_variants';
    END IF;
END $$;

-- ============================================
-- 4. PACKAGES (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'packages') THEN
        DECLARE r RECORD;
        BEGIN
            FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'packages') 
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON packages';
            END LOOP;
        END;
        
        EXECUTE 'ALTER TABLE packages ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "packages_select" ON packages FOR SELECT TO authenticated USING (true)';
        
        EXECUTE 'CREATE POLICY "packages_insert" ON packages
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "packages_update" ON packages
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "packages_delete" ON packages
        FOR DELETE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'GRANT ALL ON packages TO authenticated';
        
        RAISE NOTICE '✅ Updated policies for packages';
    END IF;
END $$;

-- ============================================
-- 5. DISTANCE_PRICING (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'distance_pricing') THEN
        DECLARE r RECORD;
        BEGIN
            FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'distance_pricing') 
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON distance_pricing';
            END LOOP;
        END;
        
        EXECUTE 'ALTER TABLE distance_pricing ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "distance_pricing_select" ON distance_pricing FOR SELECT TO authenticated USING (true)';
        
        EXECUTE 'CREATE POLICY "distance_pricing_insert" ON distance_pricing
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "distance_pricing_update" ON distance_pricing
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "distance_pricing_delete" ON distance_pricing
        FOR DELETE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'GRANT ALL ON distance_pricing TO authenticated';
        
        RAISE NOTICE '✅ Updated policies for distance_pricing';
    END IF;
END $$;

-- ============================================
-- 6. CATEGORIES (if exists - old naming)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        DECLARE r RECORD;
        BEGIN
            FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories') 
            LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON categories';
            END LOOP;
        END;
        
        EXECUTE 'ALTER TABLE categories ENABLE ROW LEVEL SECURITY';
        
        EXECUTE 'CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated USING (true)';
        
        EXECUTE 'CREATE POLICY "categories_insert" ON categories
        FOR INSERT TO authenticated
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "categories_update" ON categories
        FOR UPDATE TO authenticated
        USING (true)
        WITH CHECK (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'CREATE POLICY "categories_delete" ON categories
        FOR DELETE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''super_admin'', ''franchise_admin'', ''franchise_owner''))
        )';
        
        EXECUTE 'GRANT ALL ON categories TO authenticated';
        
        RAISE NOTICE '✅ Updated policies for categories';
    END IF;
END $$;

-- ============================================
-- 7. VERIFY & TEST
-- ============================================

SELECT 
  '✅ PACKAGES PERMISSIONS UPDATE COMPLETE' as status,
  'Franchise owners can now manage packages system' as message;

-- Show updated policies
SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename IN ('packages_categories', 'package_variants', 'packages', 'distance_pricing', 'categories')
ORDER BY tablename, cmd;

-- Test current user
SELECT 
  'User Permission Check' as test,
  email,
  role,
  CASE 
    WHEN role IN ('franchise_admin', 'franchise_owner') THEN '✅ Can manage packages'
    WHEN role = 'super_admin' THEN '✅ Full access'
    ELSE '❌ Limited access'
  END as status
FROM users
WHERE email = 'surat@safawala.com';
