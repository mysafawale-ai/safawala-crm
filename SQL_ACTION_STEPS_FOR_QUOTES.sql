-- =====================================================
-- 🎯 ACTION PLAN: Make Quotes Work (Step by Step)
-- Run these queries ONE BY ONE in Supabase SQL Editor
-- Copy-paste each section, run, verify output
-- =====================================================

-- =====================================================
-- STEP 1: Check Current Status
-- =====================================================
-- Purpose: Understand what state your database is in
-- Expected: Should show RLS disabled

SELECT 
    '📊 STEP 1: Current RLS Status' as step,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ ENABLED (Need to disable)' 
        ELSE '✅ DISABLED (Good for testing)' 
    END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename;

-- 👀 LOOK FOR: Both tables should show rls_enabled = false
-- ❌ If true: Continue to Step 2
-- ✅ If false: Skip to Step 3

-- =====================================================
-- STEP 2: Disable RLS (If Still Enabled)
-- =====================================================
-- Purpose: Temporarily remove security to make quotes work
-- Only run this if Step 1 showed RLS is enabled

ALTER TABLE package_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_booking_items DISABLE ROW LEVEL SECURITY;

-- ✅ Success message: "ALTER TABLE" (appears twice)

-- Verify it worked:
SELECT 
    '✅ STEP 2: Verification' as step,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '❌ Still enabled - try again' 
        ELSE '✅ Disabled successfully' 
    END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items');

-- =====================================================
-- STEP 3: Check Required Columns Exist
-- =====================================================
-- Purpose: Verify all ID columns are present
-- Expected: Should see franchise_id, package_id, booking_id, etc.

SELECT 
    '📋 STEP 3: Column Check - package_bookings' as step,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'franchise_id', 'customer_id') THEN '✅ Required'
        ELSE '📝 Optional'
    END as importance
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'package_bookings'
  AND column_name IN ('id', 'franchise_id', 'customer_id', 'booking_number', 'is_quote', 'status', 'total_amount')
ORDER BY column_name;

-- 👀 LOOK FOR: 
-- ✅ franchise_id exists
-- ✅ customer_id exists
-- ✅ is_quote exists
-- ✅ booking_number exists

SELECT 
    '📋 STEP 3: Column Check - package_booking_items' as step,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'booking_id', 'package_id', 'variant_id', 'franchise_id') THEN '✅ Required'
        ELSE '📝 Optional'
    END as importance
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'package_booking_items'
  AND column_name IN ('id', 'booking_id', 'package_id', 'variant_id', 'franchise_id', 'reserved_products')
ORDER BY column_name;

-- 👀 LOOK FOR:
-- ✅ booking_id exists
-- ✅ package_id exists
-- ✅ variant_id exists
-- ✅ franchise_id exists
-- ✅ reserved_products exists (JSONB type)

-- ❌ If any column is missing, you need to run migration scripts first

-- =====================================================
-- STEP 4: Check Foreign Key Constraints
-- =====================================================
-- Purpose: Ensure relationships between tables are defined
-- Expected: booking_id should reference package_bookings.id

SELECT 
    '🔗 STEP 4: Foreign Keys' as step,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    CASE 
        WHEN tc.constraint_name IS NOT NULL THEN '✅ Constraint exists'
        ELSE '❌ Missing'
    END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name IN ('package_booking_items')
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('booking_id', 'package_id', 'variant_id');

-- 👀 LOOK FOR:
-- ✅ booking_id → package_bookings.id
-- ✅ Other relationships defined

-- =====================================================
-- STEP 5: Check Your Franchise ID
-- =====================================================
-- Purpose: Find your franchise_id to use in testing
-- Expected: Should see your user and franchise_id

SELECT 
    '👤 STEP 5: Your User Info' as step,
    id as user_id,
    email,
    role,
    franchise_id,
    CASE 
        WHEN franchise_id IS NOT NULL THEN '✅ Has franchise'
        ELSE '❌ No franchise assigned'
    END as status
FROM users
WHERE email = (SELECT current_setting('request.jwt.claims', true)::json->>'email')
   OR id = auth.uid()
LIMIT 1;

-- 👀 LOOK FOR: Your franchise_id value
-- 📝 COPY THIS: You'll need it for testing
-- Example: 1a518dde-85b7-44ef-8bc4-092f53ddfd99

-- If empty, run this to see all users:
SELECT 
    '👥 All Users' as info,
    id,
    email,
    role,
    franchise_id
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- STEP 6: Check Existing Quotes
-- =====================================================
-- Purpose: See if any quotes already exist
-- Expected: May be empty or show existing quotes

SELECT 
    '📝 STEP 6: Existing Quotes' as step,
    id,
    booking_number,
    franchise_id,
    customer_id,
    is_quote,
    status,
    total_amount,
    created_at,
    CASE 
        WHEN is_quote = true THEN '✅ This is a QUOTE'
        ELSE '📦 This is a BOOKING'
    END as type
FROM package_bookings
WHERE is_quote = true
ORDER BY created_at DESC
LIMIT 5;

-- 👀 LOOK FOR:
-- ✅ is_quote = true
-- ✅ booking_number starts with 'QT-'
-- 📝 Note: May be empty if no quotes created yet

-- =====================================================
-- STEP 7: Check Quote Items (If Quotes Exist)
-- =====================================================
-- Purpose: Verify quote items are properly linked
-- Expected: Should show items with all IDs filled

SELECT 
    '📦 STEP 7: Quote Items' as step,
    pbi.id,
    pbi.booking_id,
    pbi.package_id,
    pbi.variant_id,
    pbi.franchise_id,
    pbi.quantity,
    pbi.reserved_products,
    pb.booking_number,
    CASE 
        WHEN pbi.booking_id IS NULL THEN '❌ Missing booking_id'
        WHEN pbi.package_id IS NULL THEN '❌ Missing package_id'
        WHEN pbi.variant_id IS NULL THEN '❌ Missing variant_id'
        WHEN pbi.franchise_id IS NULL THEN '❌ Missing franchise_id'
        ELSE '✅ All IDs present'
    END as validation
FROM package_booking_items pbi
JOIN package_bookings pb ON pb.id = pbi.booking_id
WHERE pb.is_quote = true
ORDER BY pbi.created_at DESC
LIMIT 5;

-- 👀 LOOK FOR:
-- ✅ All ID columns filled (no nulls)
-- ✅ reserved_products contains JSONB array
-- 📝 Note: May be empty if no quotes created yet

-- =====================================================
-- STEP 8: Test Data - Check Prerequisites
-- =====================================================
-- Purpose: Ensure you have customers, packages, and variants

-- Check Customers:
SELECT 
    '👥 STEP 8a: Customers Available' as step,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN franchise_id IS NOT NULL THEN 1 END) as with_franchise,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Customers exist'
        ELSE '❌ No customers - create one first'
    END as status
FROM customers;

-- Check Packages:
SELECT 
    '📦 STEP 8b: Packages Available' as step,
    COUNT(*) as total_packages,
    COUNT(DISTINCT category_id) as total_categories,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Packages exist'
        ELSE '❌ No packages - create some first'
    END as status
FROM packages;

-- Check Package Variants:
SELECT 
    '🎨 STEP 8c: Package Variants Available' as step,
    COUNT(*) as total_variants,
    COUNT(DISTINCT package_id) as unique_packages,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Variants exist'
        ELSE '❌ No variants - create some first'
    END as status
FROM package_variants;

-- 👀 LOOK FOR:
-- ✅ At least 1 customer
-- ✅ At least 1 package
-- ✅ At least 1 variant

-- =====================================================
-- STEP 9: Create Test Quote (Manual SQL Insert)
-- =====================================================
-- Purpose: Test if database accepts quote creation
-- WARNING: Only run this if you want to create a test quote

-- First, get required IDs:
WITH test_data AS (
  SELECT 
    (SELECT franchise_id FROM users WHERE email LIKE '%' LIMIT 1) as my_franchise_id,
    (SELECT id FROM customers LIMIT 1) as test_customer_id,
    (SELECT id FROM package_variants LIMIT 1) as test_variant_id,
    (SELECT package_id FROM package_variants LIMIT 1) as test_package_id
)
SELECT 
    '🧪 STEP 9: Test Data IDs' as step,
    my_franchise_id,
    test_customer_id,
    test_variant_id,
    test_package_id,
    CASE 
        WHEN my_franchise_id IS NOT NULL 
         AND test_customer_id IS NOT NULL 
         AND test_variant_id IS NOT NULL 
         AND test_package_id IS NOT NULL 
        THEN '✅ All IDs available - can create test quote'
        ELSE '❌ Missing required data'
    END as ready_status
FROM test_data;

-- 📝 NOTE: Copy the IDs from above, then use them below

-- Example Test Quote Insert (EDIT THE IDs FIRST):
/*
-- 🚨 IMPORTANT: Replace these UUIDs with actual values from above query:
INSERT INTO package_bookings (
    franchise_id,
    customer_id,
    booking_number,
    is_quote,
    status,
    event_date,
    delivery_date,
    return_date,
    event_venue,
    total_amount,
    paid_amount,
    balance_amount,
    payment_status,
    payment_type,
    created_at,
    updated_at
) VALUES (
    'YOUR_FRANCHISE_ID_HERE',           -- Replace with your franchise_id
    'YOUR_CUSTOMER_ID_HERE',            -- Replace with customer_id
    'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-TEST',
    true,                                -- is_quote = true
    'pending',
    NOW() + INTERVAL '30 days',         -- Event in 30 days
    NOW() + INTERVAL '29 days',         -- Delivery 1 day before
    NOW() + INTERVAL '31 days',         -- Return 1 day after
    'Test Venue Address',
    5000.00,
    0.00,
    5000.00,
    'pending',
    'advance',
    NOW(),
    NOW()
) RETURNING id, booking_number, is_quote;

-- 📝 Save the returned ID for next step
*/

-- =====================================================
-- STEP 10: Verify Quote Creation
-- =====================================================
-- Purpose: Check if quote was created successfully
-- Run this after creating quote in UI or via SQL above

SELECT 
    '✅ STEP 10: Latest Quotes' as step,
    id,
    booking_number,
    is_quote,
    status,
    total_amount,
    created_at,
    CASE 
        WHEN is_quote = true AND booking_number LIKE 'QT-%' THEN '✅ QUOTE created correctly'
        WHEN is_quote = false AND booking_number LIKE 'BK-%' THEN '📦 BOOKING (not quote)'
        ELSE '⚠️ Check booking_number format'
    END as validation
FROM package_bookings
ORDER BY created_at DESC
LIMIT 5;

-- 👀 LOOK FOR:
-- ✅ is_quote = true
-- ✅ booking_number = 'QT-YYYYMMDD-####'
-- ✅ status = 'pending'

-- =====================================================
-- STEP 11: Check for Data Issues
-- =====================================================
-- Purpose: Find any data integrity problems

-- Check for NULL franchise_ids:
SELECT 
    '🔍 STEP 11a: NULL Franchise IDs' as step,
    'package_bookings' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE franchise_id IS NULL) as null_franchise_ids,
    CASE 
        WHEN COUNT(*) FILTER (WHERE franchise_id IS NULL) = 0 THEN '✅ All rows have franchise_id'
        ELSE '⚠️ Some rows missing franchise_id'
    END as status
FROM package_bookings;

SELECT 
    '🔍 STEP 11b: NULL Package IDs' as step,
    'package_booking_items' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE package_id IS NULL) as null_package_ids,
    COUNT(*) FILTER (WHERE booking_id IS NULL) as null_booking_ids,
    CASE 
        WHEN COUNT(*) FILTER (WHERE package_id IS NULL OR booking_id IS NULL) = 0 THEN '✅ All IDs present'
        ELSE '⚠️ Some rows missing required IDs'
    END as status
FROM package_booking_items;

-- Check for orphaned items:
SELECT 
    '🔍 STEP 11c: Orphaned Items' as step,
    COUNT(pbi.id) as orphaned_items,
    CASE 
        WHEN COUNT(pbi.id) = 0 THEN '✅ No orphaned items'
        ELSE '⚠️ Found items without parent booking'
    END as status
FROM package_booking_items pbi
LEFT JOIN package_bookings pb ON pb.id = pbi.booking_id
WHERE pb.id IS NULL;

-- =====================================================
-- STEP 12: Performance Check
-- =====================================================
-- Purpose: Ensure queries will be fast

-- Check if indexes exist:
SELECT 
    '⚡ STEP 12: Index Check' as step,
    tablename,
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE '%pkey%' THEN '🆔 Primary Key'
        WHEN indexname LIKE '%franchise%' THEN '🏢 Franchise Index'
        ELSE '📇 Other Index'
    END as index_type
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename, indexname;

-- 👀 LOOK FOR:
-- ✅ Primary key indexes (pkey)
-- ✅ franchise_id indexes (for filtering)
-- 📝 If franchise_id not indexed, queries may be slow

-- =====================================================
-- 🎯 FINAL SUMMARY & NEXT STEPS
-- =====================================================

DO $$ 
DECLARE
    v_rls_disabled boolean;
    v_has_customers boolean;
    v_has_packages boolean;
    v_has_variants boolean;
    v_quote_count int;
    v_null_franchise int;
    v_null_package int;
BEGIN
    -- Check statuses
    SELECT NOT bool_or(rowsecurity) INTO v_rls_disabled
    FROM pg_tables 
    WHERE tablename IN ('package_bookings', 'package_booking_items');
    
    SELECT COUNT(*) > 0 INTO v_has_customers FROM customers;
    SELECT COUNT(*) > 0 INTO v_has_packages FROM packages;
    SELECT COUNT(*) > 0 INTO v_has_variants FROM package_variants;
    SELECT COUNT(*) INTO v_quote_count FROM package_bookings WHERE is_quote = true;
    
    SELECT COUNT(*) INTO v_null_franchise 
    FROM package_bookings WHERE franchise_id IS NULL;
    
    SELECT COUNT(*) INTO v_null_package 
    FROM package_booking_items WHERE package_id IS NULL;

    RAISE NOTICE '========================================';
    RAISE NOTICE '🎯 FINAL SUMMARY - Quote System Status';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ CHECKLIST:';
    RAISE NOTICE '';
    RAISE NOTICE '[%] RLS Disabled', CASE WHEN v_rls_disabled THEN '✅' ELSE '❌' END;
    RAISE NOTICE '[%] Customers Exist', CASE WHEN v_has_customers THEN '✅' ELSE '❌' END;
    RAISE NOTICE '[%] Packages Exist', CASE WHEN v_has_packages THEN '✅' ELSE '❌' END;
    RAISE NOTICE '[%] Variants Exist', CASE WHEN v_has_variants THEN '✅' ELSE '❌' END;
    RAISE NOTICE '[%] No NULL franchise_ids', CASE WHEN v_null_franchise = 0 THEN '✅' ELSE '⚠️' END;
    RAISE NOTICE '[%] No NULL package_ids', CASE WHEN v_null_package = 0 THEN '✅' ELSE '⚠️' END;
    RAISE NOTICE '';
    RAISE NOTICE '📊 STATS:';
    RAISE NOTICE '  Total Quotes: %', v_quote_count;
    RAISE NOTICE '  Rows missing franchise_id: %', v_null_franchise;
    RAISE NOTICE '  Items missing package_id: %', v_null_package;
    RAISE NOTICE '';
    
    -- Recommendations
    IF NOT v_rls_disabled THEN
        RAISE NOTICE '❌ ACTION REQUIRED: Run STEP 2 to disable RLS';
    ELSIF NOT v_has_customers OR NOT v_has_packages OR NOT v_has_variants THEN
        RAISE NOTICE '⚠️  ACTION REQUIRED: Create customers, packages, and variants first';
    ELSIF v_null_franchise > 0 OR v_null_package > 0 THEN
        RAISE NOTICE '⚠️  WARNING: Some data has NULL IDs - may need cleanup';
    ELSE
        RAISE NOTICE '✅ READY: System is ready for quote creation!';
        RAISE NOTICE '';
        RAISE NOTICE '🚀 NEXT STEPS:';
        RAISE NOTICE '  1. Open your CRM: http://localhost:3001/book-package';
        RAISE NOTICE '  2. Fill in customer and event details';
        RAISE NOTICE '  3. Select packages and variants';
        RAISE NOTICE '  4. Click "Save as Quote" button';
        RAISE NOTICE '  5. Check /quotes page to see created quote';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- 📝 QUICK REFERENCE CARD
-- =====================================================
/*

🎯 QUICK COMMANDS:

1. DISABLE RLS:
   ALTER TABLE package_bookings DISABLE ROW LEVEL SECURITY;
   ALTER TABLE package_booking_items DISABLE ROW LEVEL SECURITY;

2. CHECK RLS STATUS:
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename IN ('package_bookings', 'package_booking_items');

3. VIEW LATEST QUOTES:
   SELECT * FROM package_bookings 
   WHERE is_quote = true 
   ORDER BY created_at DESC LIMIT 5;

4. VIEW QUOTE ITEMS:
   SELECT pbi.*, pb.booking_number 
   FROM package_booking_items pbi
   JOIN package_bookings pb ON pb.id = pbi.booking_id
   WHERE pb.is_quote = true
   ORDER BY pbi.created_at DESC;

5. COUNT QUOTES:
   SELECT COUNT(*) FROM package_bookings WHERE is_quote = true;

6. FIND YOUR FRANCHISE ID:
   SELECT franchise_id FROM users WHERE email = 'your@email.com';

========================================
💡 TIPS:
- Always run queries one at a time
- Check the output after each step
- Copy important IDs (franchise_id, customer_id)
- If stuck, run STEP 11 to find issues
========================================

*/
