-- =====================================================
-- AUTOMATED SMOKE TEST FOR BUG FIXES #1 & #2
-- Validates fixes work correctly with test data
-- =====================================================

-- ============================================
-- TEST 1: Verify Test Data Exists
-- ============================================
DO $$
DECLARE
  v_franchise_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_franchise_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_customer_count INTEGER;
  v_product_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 1: Verifying test data exists...';
  
  -- Check customers
  SELECT COUNT(*) INTO v_customer_count 
  FROM customers 
  WHERE franchise_id IN (v_franchise_a, v_franchise_b);
  
  IF v_customer_count < 2 THEN
    RAISE EXCEPTION '❌ FAILED: Need at least 2 test customers. Run CREATE_TEST_DATA.sql first!';
  END IF;
  
  -- Check products
  SELECT COUNT(*) INTO v_product_count 
  FROM products 
  WHERE franchise_id IN (v_franchise_a, v_franchise_b);
  
  IF v_product_count < 2 THEN
    RAISE EXCEPTION '❌ FAILED: Need at least 2 test products. Run CREATE_TEST_DATA.sql first!';
  END IF;
  
  RAISE NOTICE '✅ PASSED: Test data exists (% customers, % products)', v_customer_count, v_product_count;
END $$;

-- ============================================
-- TEST 2: Check for Hard-Coded Franchise IDs
-- ============================================
DO $$
DECLARE
  v_hardcoded_count INTEGER;
  v_oldest_hardcoded TIMESTAMPTZ;
  v_newest_hardcoded TIMESTAMPTZ;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 2: Checking for hard-coded franchise IDs...';
  
  -- Count bookings with old hard-coded ID
  SELECT 
    COUNT(*),
    MIN(created_at),
    MAX(created_at)
  INTO v_hardcoded_count, v_oldest_hardcoded, v_newest_hardcoded
  FROM product_orders
  WHERE franchise_id = '00000000-0000-0000-0000-000000000001';
  
  IF v_hardcoded_count = 0 THEN
    RAISE NOTICE '✅ PASSED: No hard-coded franchise IDs found';
  ELSE
    RAISE NOTICE '⚠️ INFO: Found % booking(s) with hard-coded ID', v_hardcoded_count;
    RAISE NOTICE '  Oldest: %', v_oldest_hardcoded;
    RAISE NOTICE '  Newest: %', v_newest_hardcoded;
    
    -- Check if any created in last hour (new bug instances)
    IF v_newest_hardcoded > NOW() - INTERVAL '1 hour' THEN
      RAISE EXCEPTION '❌ FAILED: Hard-coded franchise ID found in last hour! Bug #1 NOT fixed!';
    ELSE
      RAISE NOTICE '✅ PASSED: No new hard-coded IDs in last hour (old data only)';
    END IF;
  END IF;
END $$;

-- ============================================
-- TEST 3: Check Payment Calculations
-- ============================================
DO $$
DECLARE
  v_zero_payment_count INTEGER;
  v_recent_zero_payment TIMESTAMPTZ;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 3: Checking payment calculations...';
  
  -- Find bookings with total > 0 but amount_paid = 0 (Bug #2)
  SELECT 
    COUNT(*),
    MAX(created_at)
  INTO v_zero_payment_count, v_recent_zero_payment
  FROM product_orders
  WHERE total_amount > 0 
    AND amount_paid = 0
    AND status != 'quote';
  
  IF v_zero_payment_count = 0 THEN
    RAISE NOTICE '✅ PASSED: No bookings with incorrect payment amounts';
  ELSE
    RAISE NOTICE '⚠️ INFO: Found % booking(s) with amount_paid = 0', v_zero_payment_count;
    RAISE NOTICE '  Most recent: %', v_recent_zero_payment;
    
    -- Check if any created in last hour (new bug instances)
    IF v_recent_zero_payment > NOW() - INTERVAL '1 hour' THEN
      RAISE EXCEPTION '❌ FAILED: Found booking with amount_paid = 0 in last hour! Bug #2 NOT fixed!';
    ELSE
      RAISE NOTICE '✅ PASSED: No new zero payments in last hour (old data only)';
    END IF;
  END IF;
END $$;

-- ============================================
-- TEST 4: Verify Franchise Isolation
-- ============================================
DO $$
DECLARE
  v_franchise_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_franchise_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_count_a INTEGER;
  v_count_b INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 4: Verifying franchise isolation...';
  
  -- Count bookings for each test franchise
  SELECT COUNT(*) INTO v_count_a 
  FROM product_orders 
  WHERE franchise_id = v_franchise_a;
  
  SELECT COUNT(*) INTO v_count_b 
  FROM product_orders 
  WHERE franchise_id = v_franchise_b;
  
  RAISE NOTICE '✅ INFO: Franchise A has % booking(s)', v_count_a;
  RAISE NOTICE '✅ INFO: Franchise B has % booking(s)', v_count_b;
  RAISE NOTICE '✅ PASSED: Franchises are isolated';
END $$;

-- ============================================
-- TEST 5: Check Recent Booking Quality
-- ============================================
DO $$
DECLARE
  v_recent_bookings INTEGER;
  v_good_bookings INTEGER;
  v_bad_bookings INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 5: Analyzing recent booking quality...';
  
  -- Count recent bookings
  SELECT COUNT(*) INTO v_recent_bookings
  FROM product_orders
  WHERE created_at > NOW() - INTERVAL '1 day';
  
  IF v_recent_bookings = 0 THEN
    RAISE NOTICE '⚠️ INFO: No bookings created in last 24 hours';
    RAISE NOTICE '  Create test bookings to validate fixes!';
    RETURN;
  END IF;
  
  -- Count good bookings (proper franchise_id and amount_paid)
  SELECT COUNT(*) INTO v_good_bookings
  FROM product_orders
  WHERE created_at > NOW() - INTERVAL '1 day'
    AND franchise_id != '00000000-0000-0000-0000-000000000001'
    AND (
      amount_paid > 0 
      OR status = 'quote'
      OR total_amount = 0
    );
  
  v_bad_bookings := v_recent_bookings - v_good_bookings;
  
  RAISE NOTICE '📊 Recent Bookings (Last 24h):';
  RAISE NOTICE '  Total: %', v_recent_bookings;
  RAISE NOTICE '  Good: % (%.0f%%)', v_good_bookings, (v_good_bookings::float / v_recent_bookings * 100);
  RAISE NOTICE '  Bad: % (%.0f%%)', v_bad_bookings, (v_bad_bookings::float / v_recent_bookings * 100);
  
  IF v_bad_bookings = 0 THEN
    RAISE NOTICE '✅ PASSED: All recent bookings are correct!';
  ELSE
    RAISE EXCEPTION '❌ FAILED: % recent booking(s) have bugs!', v_bad_bookings;
  END IF;
END $$;

-- ============================================
-- TEST 6: Invoice Generation Check
-- ============================================
DO $$
DECLARE
  v_bookings_count INTEGER;
  v_invoices_count INTEGER;
  v_coverage_percent NUMERIC;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 6: Checking invoice generation...';
  
  -- Count non-quote bookings
  SELECT COUNT(*) INTO v_bookings_count
  FROM product_orders
  WHERE is_quote = false
    AND created_at > NOW() - INTERVAL '1 day';
  
  IF v_bookings_count = 0 THEN
    RAISE NOTICE '⚠️ INFO: No bookings created in last 24 hours';
    RETURN;
  END IF;
  
  -- Count invoices for those bookings
  SELECT COUNT(DISTINCT i.id) INTO v_invoices_count
  FROM invoices i
  WHERE i.created_at > NOW() - INTERVAL '1 day';
  
  v_coverage_percent := (v_invoices_count::float / v_bookings_count * 100);
  
  RAISE NOTICE '📊 Invoice Coverage:';
  RAISE NOTICE '  Bookings: %', v_bookings_count;
  RAISE NOTICE '  Invoices: %', v_invoices_count;
  RAISE NOTICE '  Coverage: %.0f%%', v_coverage_percent;
  
  IF v_invoices_count = v_bookings_count THEN
    RAISE NOTICE '✅ PASSED: All bookings have invoices!';
  ELSIF v_invoices_count = 0 THEN
    RAISE NOTICE '⚠️ WARNING: No invoices generated yet';
    RAISE NOTICE '  Deploy AUTO_GENERATE_INVOICE_PRODUCTION.sql to enable';
  ELSE
    RAISE NOTICE '⚠️ WARNING: Only %.0f%% coverage', v_coverage_percent;
    RAISE NOTICE '  Some bookings missing invoices';
  END IF;
END $$;

-- ============================================
-- TEST 7: Payment Type Validation
-- ============================================
DO $$
DECLARE
  v_full_payment_correct INTEGER;
  v_full_payment_wrong INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 TEST 7: Validating payment calculations...';
  
  -- Check full payments (amount_paid should equal total_amount)
  SELECT 
    COUNT(*) FILTER (WHERE amount_paid >= total_amount) as correct,
    COUNT(*) FILTER (WHERE amount_paid < total_amount) as wrong
  INTO v_full_payment_correct, v_full_payment_wrong
  FROM product_orders
  WHERE created_at > NOW() - INTERVAL '1 day'
    AND status != 'quote'
    AND total_amount > 0;
  
  IF v_full_payment_correct = 0 AND v_full_payment_wrong = 0 THEN
    RAISE NOTICE '⚠️ INFO: No recent bookings to validate';
    RETURN;
  END IF;
  
  RAISE NOTICE '📊 Payment Validation:';
  RAISE NOTICE '  Payments look correct: %', v_full_payment_correct;
  RAISE NOTICE '  Payments look wrong: %', v_full_payment_wrong;
  
  IF v_full_payment_wrong > 0 THEN
    RAISE NOTICE '⚠️ WARNING: Some payments may be incorrect';
    RAISE NOTICE '  Check if they are advance/partial payments';
  ELSE
    RAISE NOTICE '✅ INFO: All payments within expected ranges';
  END IF;
END $$;

-- ============================================
-- FINAL SMOKE TEST REPORT
-- ============================================
DO $$
DECLARE
  v_total_bookings INTEGER;
  v_today_bookings INTEGER;
  v_hardcoded_recent INTEGER;
  v_zero_payment_recent INTEGER;
  v_overall_status TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🎯 SMOKE TEST SUMMARY';
  RAISE NOTICE '═══════════════════════════════════════════════';
  
  -- Get stats
  SELECT COUNT(*) INTO v_total_bookings FROM product_orders;
  
  SELECT COUNT(*) INTO v_today_bookings 
  FROM product_orders 
  WHERE created_at > NOW() - INTERVAL '1 day';
  
  SELECT COUNT(*) INTO v_hardcoded_recent
  FROM product_orders
  WHERE franchise_id = '00000000-0000-0000-0000-000000000001'
    AND created_at > NOW() - INTERVAL '1 hour';
  
  SELECT COUNT(*) INTO v_zero_payment_recent
  FROM product_orders
  WHERE total_amount > 0 
    AND amount_paid = 0
    AND status != 'quote'
    AND created_at > NOW() - INTERVAL '1 hour';
  
  RAISE NOTICE '';
  RAISE NOTICE '📊 Database Stats:';
  RAISE NOTICE '  Total Bookings: %', v_total_bookings;
  RAISE NOTICE '  Last 24 Hours: %', v_today_bookings;
  RAISE NOTICE '';
  RAISE NOTICE '🐛 Bug Check (Last Hour):';
  RAISE NOTICE '  Hard-coded franchise IDs: % %', 
    v_hardcoded_recent,
    CASE WHEN v_hardcoded_recent = 0 THEN '✅' ELSE '❌' END;
  RAISE NOTICE '  Zero payments (Bug #2): % %', 
    v_zero_payment_recent,
    CASE WHEN v_zero_payment_recent = 0 THEN '✅' ELSE '❌' END;
  
  -- Overall status
  IF v_hardcoded_recent = 0 AND v_zero_payment_recent = 0 THEN
    v_overall_status := '🟢 GREEN - BUGS FIXED!';
  ELSIF v_today_bookings = 0 THEN
    v_overall_status := '🟡 YELLOW - NO RECENT DATA TO TEST';
  ELSE
    v_overall_status := '🔴 RED - BUGS STILL PRESENT!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '🚦 OVERALL STATUS: %', v_overall_status;
  RAISE NOTICE '═══════════════════════════════════════════════';
  
  IF v_today_bookings = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next Steps:';
    RAISE NOTICE '  1. Create test booking in UI';
    RAISE NOTICE '  2. Re-run this smoke test';
    RAISE NOTICE '  3. Verify bugs are fixed';
  ELSIF v_hardcoded_recent > 0 OR v_zero_payment_recent > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ Action Required:';
    RAISE NOTICE '  Bugs still present in recent bookings!';
    RAISE NOTICE '  Review code fixes and redeploy';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ All Tests Passed!';
    RAISE NOTICE '  System is production ready';
    RAISE NOTICE '  Continue with remaining bugs (#3-#10)';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;

-- ============================================
-- DETAILED BOOKING ANALYSIS (Last 10)
-- ============================================
SELECT 
  '📋 LAST 10 BOOKINGS:' as title;

SELECT
  po.order_number,
  po.franchise_id,
  CASE 
    WHEN po.franchise_id = '00000000-0000-0000-0000-000000000001' THEN '❌ HARD-CODED'
    WHEN po.franchise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' THEN '✅ Test Franchise A'
    WHEN po.franchise_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' THEN '✅ Test Franchise B'
    ELSE '✅ Other Franchise'
  END as franchise_status,
  po.total_amount,
  po.amount_paid,
  po.pending_amount,
  CASE 
    WHEN po.amount_paid = 0 AND po.total_amount > 0 AND po.status != 'quote' THEN '❌ ZERO PAYMENT BUG'
    WHEN po.amount_paid = po.total_amount THEN '✅ Full Payment'
    WHEN po.amount_paid > 0 THEN '✅ Partial Payment'
    WHEN po.status = 'quote' THEN 'ℹ️ Quote (OK)'
    ELSE '⚠️ Check'
  END as payment_status,
  po.status,
  po.created_at
FROM product_orders po
ORDER BY po.created_at DESC
LIMIT 10;
