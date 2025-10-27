-- =====================================================
-- COMPREHENSIVE RLS STATUS CHECK FOR PACKAGE BOOKINGS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. CHECK IF RLS IS ENABLED ON TABLES
SELECT 
    '1️⃣ RLS ENABLED STATUS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename;

-- 2. LIST ALL POLICIES ON PACKAGE_BOOKINGS
SELECT 
    '2️⃣ POLICIES ON PACKAGE_BOOKINGS' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'package_bookings'
ORDER BY policyname;

-- 3. LIST ALL POLICIES ON PACKAGE_BOOKING_ITEMS
SELECT 
    '3️⃣ POLICIES ON PACKAGE_BOOKING_ITEMS' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'package_booking_items'
ORDER BY policyname;

-- 4. CHECK IF HELPER FUNCTIONS EXIST
SELECT 
    '4️⃣ HELPER FUNCTIONS' as section,
    proname as function_name,
    prokind as function_type,
    prosecdef as security_definer,
    CASE 
      WHEN proname = 'current_user_franchise_id' THEN '✅ Required for franchise isolation'
      WHEN proname = 'set_franchise_id_default' THEN '✅ Required for auto-setting franchise_id'
      ELSE 'Unknown function'
    END as description
FROM pg_proc
WHERE proname IN ('current_user_franchise_id', 'set_franchise_id_default')
ORDER BY proname;

-- 5. CHECK TRIGGERS ON PACKAGE_BOOKINGS
SELECT 
    '5️⃣ TRIGGERS' as section,
    trigger_name,
    event_manipulation as trigger_event,
    event_object_table as table_name,
    action_timing,
    action_orientation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('package_bookings', 'package_booking_items')
ORDER BY event_object_table, trigger_name;

-- 6. SAMPLE DATA CHECK - Test if data exists and is accessible
SELECT 
    '6️⃣ DATA OVERVIEW' as section,
    COUNT(*) as total_bookings,
    COUNT(CASE WHEN is_quote = true THEN 1 END) as quotes,
    COUNT(CASE WHEN is_quote = false THEN 1 END) as confirmed_bookings,
    COUNT(CASE WHEN franchise_id IS NULL THEN 1 END) as null_franchise_count,
    COUNT(DISTINCT franchise_id) as unique_franchises
FROM package_bookings;

-- 7. CHECK FRANCHISE_ID COLUMN PROPERTIES
SELECT 
    '7️⃣ FRANCHISE_ID COLUMNS' as section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
      WHEN is_nullable = 'NO' THEN '✅ NOT NULL constraint present'
      ELSE '⚠️ Nullable - may cause issues'
    END as validation_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('package_bookings', 'package_booking_items', 'users')
  AND column_name IN ('franchise_id', 'id', 'package_id', 'booking_id')
ORDER BY table_name, column_name;

-- 8. CHECK USER TABLE STRUCTURE (for RLS context)
SELECT 
    '8️⃣ USER FRANCHISE SETUP' as section,
    COUNT(*) as total_users,
    COUNT(CASE WHEN franchise_id IS NOT NULL THEN 1 END) as users_with_franchise,
    COUNT(CASE WHEN franchise_id IS NULL THEN 1 END) as users_without_franchise,
    COUNT(DISTINCT role) as unique_roles
FROM users;

-- 9. ROLE DISTRIBUTION
SELECT 
    '9️⃣ USER ROLES' as section,
    role,
    COUNT(*) as user_count,
    CASE 
      WHEN role = 'super_admin' THEN '✅ Full access to all franchises'
      WHEN role = 'franchise_admin' THEN '✅ Full access to own franchise'
      WHEN role = 'staff' THEN '✅ Limited access to own franchise'
      ELSE '⚠️ Unknown role'
    END as expected_access
FROM users
GROUP BY role
ORDER BY 
  CASE role
    WHEN 'super_admin' THEN 1
    WHEN 'franchise_admin' THEN 2
    WHEN 'staff' THEN 3
    ELSE 4
  END;

-- 10. CHECK FOR ORPHANED BOOKING ITEMS
SELECT 
    '🔟 DATA INTEGRITY CHECK' as section,
    COUNT(DISTINCT pbi.id) as total_items,
    COUNT(DISTINCT CASE WHEN pb.id IS NULL THEN pbi.id END) as orphaned_items,
    CASE 
      WHEN COUNT(DISTINCT CASE WHEN pb.id IS NULL THEN pbi.id END) = 0 THEN '✅ No orphaned items'
      ELSE '⚠️ Found orphaned items - data cleanup needed'
    END as status
FROM package_booking_items pbi
LEFT JOIN package_bookings pb ON pb.id = pbi.booking_id;

-- 11. FRANCHISE ISOLATION TEST DATA
SELECT 
    '1️⃣1️⃣ FRANCHISE DISTRIBUTION' as section,
    pb.franchise_id,
    COUNT(*) as booking_count,
    COUNT(pbi.id) as total_items,
    MIN(pb.created_at) as first_booking,
    MAX(pb.created_at) as last_booking
FROM package_bookings pb
LEFT JOIN package_booking_items pbi ON pbi.booking_id = pb.id
GROUP BY pb.franchise_id
ORDER BY booking_count DESC;

-- 12. RECENT POLICY CHANGES (if audit is enabled)
SELECT 
    '1️⃣2️⃣ RECENT SCHEMA CHANGES' as section,
    schemaname,
    tablename,
    obj_description((schemaname || '.' || tablename)::regclass, 'pg_class') as table_comment
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename;

-- =====================================================
-- SUMMARY & RECOMMENDATIONS
-- =====================================================

DO $$ 
DECLARE
  rls_enabled_bookings boolean;
  rls_enabled_items boolean;
  policy_count_bookings int;
  policy_count_items int;
  function_exists_franchise_id boolean;
  function_exists_trigger boolean;
  trigger_exists boolean;
BEGIN
  -- Check RLS status
  SELECT rowsecurity INTO rls_enabled_bookings
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'package_bookings';

  SELECT rowsecurity INTO rls_enabled_items
  FROM pg_tables
  WHERE schemaname = 'public' AND tablename = 'package_booking_items';

  -- Count policies
  SELECT COUNT(*) INTO policy_count_bookings
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'package_bookings';

  SELECT COUNT(*) INTO policy_count_items
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'package_booking_items';

  -- Check functions
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'current_user_franchise_id') INTO function_exists_franchise_id;
  SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'set_franchise_id_default') INTO function_exists_trigger;

  -- Check trigger
  SELECT EXISTS(
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'package_bookings' 
    AND trigger_name = 'set_package_bookings_franchise_id'
  ) INTO trigger_exists;

  -- Output summary
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS STATUS SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'package_bookings RLS: %', CASE WHEN rls_enabled_bookings THEN '✅ ENABLED' ELSE '❌ DISABLED' END;
  RAISE NOTICE 'package_booking_items RLS: %', CASE WHEN rls_enabled_items THEN '✅ ENABLED' ELSE '❌ DISABLED' END;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies on package_bookings: %', policy_count_bookings;
  RAISE NOTICE 'Policies on package_booking_items: %', policy_count_items;
  RAISE NOTICE '';
  RAISE NOTICE 'Helper function (current_user_franchise_id): %', CASE WHEN function_exists_franchise_id THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Trigger function (set_franchise_id_default): %', CASE WHEN function_exists_trigger THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE 'Auto-franchise trigger: %', CASE WHEN trigger_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '========================================';
  
  -- Recommendations
  IF NOT rls_enabled_bookings OR NOT rls_enabled_items THEN
    RAISE NOTICE '⚠️  CRITICAL: RLS is DISABLED';
    RAISE NOTICE '📋 ACTION: Run ENABLE_PACKAGE_BOOKINGS_RLS.sql to re-enable';
  ELSIF policy_count_bookings = 0 OR policy_count_items = 0 THEN
    RAISE NOTICE '⚠️  WARNING: RLS enabled but no policies found';
    RAISE NOTICE '📋 ACTION: Create policies using ENABLE_PACKAGE_BOOKINGS_RLS.sql';
  ELSE
    RAISE NOTICE '✅ RLS is properly configured';
    RAISE NOTICE '📋 ACTION: Test with different user roles to verify';
  END IF;
  
  IF NOT function_exists_franchise_id OR NOT function_exists_trigger THEN
    RAISE NOTICE '⚠️  WARNING: Helper functions missing';
    RAISE NOTICE '📋 ACTION: Run ENABLE_PACKAGE_BOOKINGS_RLS.sql to create functions';
  END IF;
  
  IF NOT trigger_exists THEN
    RAISE NOTICE '⚠️  WARNING: Auto-franchise trigger missing';
    RAISE NOTICE '📋 ACTION: Franchise ID will not be auto-set on new bookings';
  END IF;

  RAISE NOTICE '========================================';
END $$;
