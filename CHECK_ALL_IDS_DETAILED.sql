-- =====================================================
-- COMPREHENSIVE ID AUDIT FOR PACKAGE BOOKINGS SYSTEM
-- Checks all IDs, foreign keys, constraints, and data integrity
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1️⃣ CHECK ALL COLUMNS IN PACKAGE_BOOKINGS TABLE
SELECT 
    '1️⃣ PACKAGE_BOOKINGS COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    CASE 
        WHEN column_name LIKE '%_id' THEN '🔑 Foreign Key or ID'
        WHEN column_name = 'id' THEN '🆔 Primary Key'
        ELSE '📝 Data Column'
    END as column_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'package_bookings'
ORDER BY ordinal_position;

-- 2️⃣ CHECK ALL COLUMNS IN PACKAGE_BOOKING_ITEMS TABLE
SELECT 
    '2️⃣ PACKAGE_BOOKING_ITEMS COLUMNS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    CASE 
        WHEN column_name LIKE '%_id' THEN '🔑 Foreign Key or ID'
        WHEN column_name = 'id' THEN '🆔 Primary Key'
        ELSE '📝 Data Column'
    END as column_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'package_booking_items'
ORDER BY ordinal_position;

-- 3️⃣ CHECK PRIMARY KEYS
SELECT 
    '3️⃣ PRIMARY KEYS' as section,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type,
    '✅ PRIMARY KEY' as status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('package_bookings', 'package_booking_items')
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- 4️⃣ CHECK FOREIGN KEY CONSTRAINTS
SELECT 
    '4️⃣ FOREIGN KEYS' as section,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '⚠️ DELETE CASCADE'
        WHEN rc.delete_rule = 'SET NULL' THEN '📝 SET NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN '🔒 RESTRICT'
        ELSE rc.delete_rule
    END as delete_behavior
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('package_bookings', 'package_booking_items')
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 5️⃣ CHECK NOT NULL CONSTRAINTS ON ID COLUMNS
SELECT 
    '5️⃣ NOT NULL CONSTRAINTS ON IDs' as section,
    table_name,
    column_name,
    is_nullable,
    CASE 
        WHEN is_nullable = 'NO' THEN '✅ NOT NULL (Required)'
        WHEN is_nullable = 'YES' AND column_name LIKE '%_id' THEN '⚠️ NULLABLE (May cause issues)'
        ELSE '✅ NULLABLE (Optional by design)'
    END as validation_status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('package_bookings', 'package_booking_items')
  AND (column_name = 'id' OR column_name LIKE '%_id')
ORDER BY table_name, column_name;

-- 6️⃣ CHECK ACTUAL DATA - FRANCHISE_ID DISTRIBUTION
SELECT 
    '6️⃣ FRANCHISE_ID DATA' as section,
    'package_bookings' as table_name,
    COUNT(*) as total_rows,
    COUNT(franchise_id) as rows_with_franchise_id,
    COUNT(*) - COUNT(franchise_id) as null_franchise_id,
    COUNT(DISTINCT franchise_id) as unique_franchises,
    CASE 
        WHEN COUNT(*) - COUNT(franchise_id) > 0 THEN '⚠️ NULL values found'
        ELSE '✅ All rows have franchise_id'
    END as status
FROM package_bookings
UNION ALL
SELECT 
    '6️⃣ FRANCHISE_ID DATA' as section,
    'package_booking_items' as table_name,
    COUNT(*) as total_rows,
    COUNT(franchise_id) as rows_with_franchise_id,
    COUNT(*) - COUNT(franchise_id) as null_franchise_id,
    COUNT(DISTINCT franchise_id) as unique_franchises,
    CASE 
        WHEN COUNT(*) - COUNT(franchise_id) > 0 THEN '⚠️ NULL values found'
        ELSE '✅ All rows have franchise_id'
    END as status
FROM package_booking_items;

-- 7️⃣ CHECK BOOKING_ID IN PACKAGE_BOOKING_ITEMS
SELECT 
    '7️⃣ BOOKING_ID INTEGRITY' as section,
    COUNT(DISTINCT pbi.id) as total_items,
    COUNT(DISTINCT pbi.booking_id) as unique_booking_ids,
    COUNT(DISTINCT CASE WHEN pb.id IS NOT NULL THEN pbi.booking_id END) as valid_booking_ids,
    COUNT(DISTINCT CASE WHEN pb.id IS NULL THEN pbi.booking_id END) as orphaned_items,
    COUNT(CASE WHEN pbi.booking_id IS NULL THEN 1 END) as null_booking_ids,
    CASE 
        WHEN COUNT(CASE WHEN pbi.booking_id IS NULL THEN 1 END) > 0 THEN '❌ NULL booking_id found'
        WHEN COUNT(DISTINCT CASE WHEN pb.id IS NULL THEN pbi.booking_id END) > 0 THEN '⚠️ Orphaned items exist'
        ELSE '✅ All items linked correctly'
    END as status
FROM package_booking_items pbi
LEFT JOIN package_bookings pb ON pb.id = pbi.booking_id;

-- 8️⃣ CHECK PACKAGE_ID IN PACKAGE_BOOKING_ITEMS
SELECT 
    '8️⃣ PACKAGE_ID INTEGRITY' as section,
    COUNT(*) as total_items,
    COUNT(package_id) as items_with_package_id,
    COUNT(*) - COUNT(package_id) as null_package_ids,
    COUNT(DISTINCT package_id) as unique_packages,
    CASE 
        WHEN COUNT(*) - COUNT(package_id) > 0 THEN '⚠️ NULL package_id found'
        ELSE '✅ All items have package_id'
    END as status
FROM package_booking_items;

-- 9️⃣ CHECK VARIANT_ID IN PACKAGE_BOOKING_ITEMS
SELECT 
    '9️⃣ VARIANT_ID INTEGRITY' as section,
    COUNT(*) as total_items,
    COUNT(variant_id) as items_with_variant_id,
    COUNT(*) - COUNT(variant_id) as null_variant_ids,
    COUNT(DISTINCT variant_id) as unique_variants,
    CASE 
        WHEN COUNT(*) - COUNT(variant_id) > 0 THEN '⚠️ NULL variant_id found'
        ELSE '✅ All items have variant_id'
    END as status
FROM package_booking_items;

-- 🔟 CHECK CUSTOMER_ID IN PACKAGE_BOOKINGS
SELECT 
    '🔟 CUSTOMER_ID INTEGRITY' as section,
    COUNT(*) as total_bookings,
    COUNT(customer_id) as bookings_with_customer,
    COUNT(*) - COUNT(customer_id) as null_customer_ids,
    COUNT(DISTINCT customer_id) as unique_customers,
    CASE 
        WHEN COUNT(*) - COUNT(customer_id) > 0 THEN '⚠️ NULL customer_id found'
        ELSE '✅ All bookings have customer_id'
    END as status
FROM package_bookings;

-- 1️⃣1️⃣ SAMPLE DATA FROM PACKAGE_BOOKINGS (First 5 rows with all IDs)
SELECT 
    '1️⃣1️⃣ SAMPLE PACKAGE_BOOKINGS DATA' as section,
    id,
    booking_number,
    franchise_id,
    customer_id,
    is_quote,
    status,
    created_at,
    CASE 
        WHEN franchise_id IS NULL THEN '❌ Missing'
        ELSE '✅ Present'
    END as franchise_id_status,
    CASE 
        WHEN customer_id IS NULL THEN '❌ Missing'
        ELSE '✅ Present'
    END as customer_id_status
FROM package_bookings
ORDER BY created_at DESC
LIMIT 5;

-- 1️⃣2️⃣ SAMPLE DATA FROM PACKAGE_BOOKING_ITEMS (First 5 rows with all IDs)
SELECT 
    '1️⃣2️⃣ SAMPLE PACKAGE_BOOKING_ITEMS DATA' as section,
    id,
    booking_id,
    package_id,
    variant_id,
    franchise_id,
    quantity,
    created_at,
    CASE WHEN booking_id IS NULL THEN '❌ Missing' ELSE '✅ Present' END as booking_id_status,
    CASE WHEN package_id IS NULL THEN '❌ Missing' ELSE '✅ Present' END as package_id_status,
    CASE WHEN variant_id IS NULL THEN '❌ Missing' ELSE '✅ Present' END as variant_id_status,
    CASE WHEN franchise_id IS NULL THEN '❌ Missing' ELSE '✅ Present' END as franchise_id_status
FROM package_booking_items
ORDER BY created_at DESC
LIMIT 5;

-- 1️⃣3️⃣ CHECK IF FOREIGN KEY TABLES EXIST
SELECT 
    '1️⃣3️⃣ REFERENCED TABLES STATUS' as section,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'customers', 'packages', 'package_variants', 'franchises') THEN '✅ Critical Table'
        ELSE '📝 Supporting Table'
    END as importance
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users',
    'customers', 
    'packages',
    'package_variants',
    'franchises',
    'package_bookings',
    'package_booking_items'
  )
ORDER BY table_name;

-- 1️⃣4️⃣ CHECK DEFAULT VALUES FOR ID COLUMNS
SELECT 
    '1️⃣4️⃣ ID COLUMN DEFAULTS' as section,
    table_name,
    column_name,
    column_default,
    CASE 
        WHEN column_default LIKE 'gen_random_uuid()%' THEN '✅ Auto-generated UUID'
        WHEN column_default LIKE 'uuid_generate_v4()%' THEN '✅ Auto-generated UUID'
        WHEN column_default IS NULL AND is_nullable = 'NO' THEN '⚠️ Must be provided'
        WHEN column_default IS NULL AND is_nullable = 'YES' THEN '📝 Optional'
        ELSE column_default
    END as generation_method
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('package_bookings', 'package_booking_items')
  AND (column_name = 'id' OR column_name LIKE '%_id')
ORDER BY table_name, column_name;

-- 1️⃣5️⃣ CHECK INDEXES ON ID COLUMNS
SELECT 
    '1️⃣5️⃣ INDEXES ON ID COLUMNS' as section,
    t.relname as table_name,
    i.relname as index_name,
    a.attname as column_name,
    ix.indisunique as is_unique,
    ix.indisprimary as is_primary,
    CASE 
        WHEN ix.indisprimary THEN '🆔 Primary Key Index'
        WHEN ix.indisunique THEN '🔑 Unique Index'
        ELSE '📇 Regular Index'
    END as index_type
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE t.relname IN ('package_bookings', 'package_booking_items')
  AND (a.attname = 'id' OR a.attname LIKE '%_id')
ORDER BY t.relname, a.attname;

-- 1️⃣6️⃣ CROSS-TABLE ID VALIDATION
WITH booking_ids AS (
    SELECT DISTINCT id FROM package_bookings
),
item_booking_ids AS (
    SELECT DISTINCT booking_id FROM package_booking_items WHERE booking_id IS NOT NULL
)
SELECT 
    '1️⃣6️⃣ CROSS-TABLE VALIDATION' as section,
    (SELECT COUNT(*) FROM booking_ids) as total_bookings,
    (SELECT COUNT(*) FROM item_booking_ids) as bookings_with_items,
    (SELECT COUNT(*) FROM booking_ids WHERE id NOT IN (SELECT booking_id FROM item_booking_ids)) as bookings_without_items,
    (SELECT COUNT(*) FROM item_booking_ids WHERE booking_id NOT IN (SELECT id FROM booking_ids)) as items_with_invalid_booking,
    CASE 
        WHEN (SELECT COUNT(*) FROM item_booking_ids WHERE booking_id NOT IN (SELECT id FROM booking_ids)) > 0 
        THEN '❌ Data integrity issue found'
        ELSE '✅ All references valid'
    END as integrity_status;

-- 1️⃣7️⃣ CHECK USERS TABLE FOR FRANCHISE_ID
SELECT 
    '1️⃣7️⃣ USERS FRANCHISE_ID STATUS' as section,
    COUNT(*) as total_users,
    COUNT(franchise_id) as users_with_franchise,
    COUNT(*) - COUNT(franchise_id) as users_without_franchise,
    COUNT(DISTINCT franchise_id) as unique_franchises_in_users,
    COUNT(DISTINCT role) as unique_roles,
    CASE 
        WHEN COUNT(*) - COUNT(franchise_id) > 0 THEN '⚠️ Some users missing franchise_id'
        ELSE '✅ All users have franchise_id'
    END as status
FROM users;

-- 1️⃣8️⃣ FRANCHISE ISOLATION TEST - Compare bookings vs users franchises
WITH booking_franchises AS (
    SELECT DISTINCT franchise_id FROM package_bookings WHERE franchise_id IS NOT NULL
),
user_franchises AS (
    SELECT DISTINCT franchise_id FROM users WHERE franchise_id IS NOT NULL
)
SELECT 
    '1️⃣8️⃣ FRANCHISE ISOLATION CHECK' as section,
    (SELECT COUNT(*) FROM booking_franchises) as franchises_with_bookings,
    (SELECT COUNT(*) FROM user_franchises) as franchises_with_users,
    (SELECT COUNT(*) 
     FROM booking_franchises bf 
     WHERE NOT EXISTS (SELECT 1 FROM user_franchises uf WHERE uf.franchise_id = bf.franchise_id)
    ) as orphaned_franchise_bookings,
    CASE 
        WHEN (SELECT COUNT(*) 
              FROM booking_franchises bf 
              WHERE NOT EXISTS (SELECT 1 FROM user_franchises uf WHERE uf.franchise_id = bf.franchise_id)
             ) > 0 
        THEN '⚠️ Bookings exist for franchises with no users'
        ELSE '✅ All booking franchises have users'
    END as status;

-- =====================================================
-- 📊 COMPREHENSIVE SUMMARY
-- =====================================================

DO $$ 
DECLARE
    v_bookings_count int;
    v_items_count int;
    v_null_franchise_bookings int;
    v_null_franchise_items int;
    v_null_booking_id int;
    v_null_package_id int;
    v_null_variant_id int;
    v_null_customer_id int;
    v_orphaned_items int;
    v_fk_count int;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO v_bookings_count FROM package_bookings;
    SELECT COUNT(*) INTO v_items_count FROM package_booking_items;
    SELECT COUNT(*) INTO v_null_franchise_bookings FROM package_bookings WHERE franchise_id IS NULL;
    SELECT COUNT(*) INTO v_null_franchise_items FROM package_booking_items WHERE franchise_id IS NULL;
    SELECT COUNT(*) INTO v_null_booking_id FROM package_booking_items WHERE booking_id IS NULL;
    SELECT COUNT(*) INTO v_null_package_id FROM package_booking_items WHERE package_id IS NULL;
    SELECT COUNT(*) INTO v_null_variant_id FROM package_booking_items WHERE variant_id IS NULL;
    SELECT COUNT(*) INTO v_null_customer_id FROM package_bookings WHERE customer_id IS NULL;
    
    SELECT COUNT(*) INTO v_orphaned_items 
    FROM package_booking_items pbi 
    LEFT JOIN package_bookings pb ON pb.id = pbi.booking_id 
    WHERE pb.id IS NULL;
    
    SELECT COUNT(*) INTO v_fk_count
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name IN ('package_bookings', 'package_booking_items')
      AND constraint_type = 'FOREIGN KEY';

    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 COMPREHENSIVE ID AUDIT SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📦 DATA OVERVIEW:';
    RAISE NOTICE '  Total Bookings: %', v_bookings_count;
    RAISE NOTICE '  Total Booking Items: %', v_items_count;
    RAISE NOTICE '  Foreign Key Constraints: %', v_fk_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔑 FRANCHISE_ID STATUS:';
    RAISE NOTICE '  Bookings with NULL franchise_id: % %', v_null_franchise_bookings, 
        CASE WHEN v_null_franchise_bookings = 0 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  Items with NULL franchise_id: % %', v_null_franchise_items, 
        CASE WHEN v_null_franchise_items = 0 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '';
    RAISE NOTICE '🔗 RELATIONSHIP IDs:';
    RAISE NOTICE '  Items with NULL booking_id: % %', v_null_booking_id, 
        CASE WHEN v_null_booking_id = 0 THEN '✅' ELSE '❌ CRITICAL' END;
    RAISE NOTICE '  Items with NULL package_id: % %', v_null_package_id, 
        CASE WHEN v_null_package_id = 0 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  Items with NULL variant_id: % %', v_null_variant_id, 
        CASE WHEN v_null_variant_id = 0 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '  Bookings with NULL customer_id: % %', v_null_customer_id, 
        CASE WHEN v_null_customer_id = 0 THEN '✅' ELSE '⚠️' END;
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DATA INTEGRITY:';
    RAISE NOTICE '  Orphaned items (no parent booking): % %', v_orphaned_items, 
        CASE WHEN v_orphaned_items = 0 THEN '✅' ELSE '❌ CRITICAL' END;
    RAISE NOTICE '';
    
    -- Overall health status
    IF v_null_booking_id > 0 OR v_orphaned_items > 0 THEN
        RAISE NOTICE '❌ CRITICAL ISSUES FOUND - Data integrity compromised';
    ELSIF v_null_franchise_bookings > 0 OR v_null_franchise_items > 0 OR 
          v_null_package_id > 0 OR v_null_variant_id > 0 THEN
        RAISE NOTICE '⚠️  WARNING - Missing required IDs detected';
    ELSE
        RAISE NOTICE '✅ ALL ID COLUMNS VALIDATED - System healthy';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
