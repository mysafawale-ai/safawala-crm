-- =====================================================
-- CREATE TEST DATA FOR BUG FIX VALIDATION
-- Creates realistic test data for manual validation
-- =====================================================

-- ============================================
-- STEP 1: Create Test Franchises (if not exists)
-- ============================================
DO $$
BEGIN
  -- Franchise A (for User A testing)
  IF NOT EXISTS (SELECT 1 FROM franchises WHERE name = 'Test Franchise A') THEN
    INSERT INTO franchises (id, name, email, phone, address, city, state, pincode, is_active)
    VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Test Franchise A',
      'franchisea@test.com',
      '9999999991',
      'Test Address A',
      'Mumbai',
      'Maharashtra',
      '400001',
      true
    );
    RAISE NOTICE '✅ Created Test Franchise A';
  ELSE
    RAISE NOTICE '⚠️ Test Franchise A already exists';
  END IF;

  -- Franchise B (for User B testing)
  IF NOT EXISTS (SELECT 1 FROM franchises WHERE name = 'Test Franchise B') THEN
    INSERT INTO franchises (id, name, email, phone, address, city, state, pincode, is_active)
    VALUES (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'Test Franchise B',
      'franchiseb@test.com',
      '9999999992',
      'Test Address B',
      'Delhi',
      'Delhi',
      '110001',
      true
    );
    RAISE NOTICE '✅ Created Test Franchise B';
  ELSE
    RAISE NOTICE '⚠️ Test Franchise B already exists';
  END IF;
END $$;

-- ============================================
-- STEP 2: Create Test Customers
-- ============================================
DO $$
BEGIN
  -- Customer for Franchise A
  IF NOT EXISTS (SELECT 1 FROM customers WHERE phone = '9876543210') THEN
    INSERT INTO customers (
      name, phone, email, address, city, state, pincode, franchise_id
    ) VALUES (
      'Rajesh Kumar',
      '9876543210',
      'rajesh@test.com',
      'Test Venue Address, Andheri',
      'Mumbai',
      'Maharashtra',
      '400053',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    );
    RAISE NOTICE '✅ Created test customer: Rajesh Kumar (Franchise A)';
  ELSE
    RAISE NOTICE '⚠️ Customer Rajesh Kumar already exists';
  END IF;

  -- Customer for Franchise B
  IF NOT EXISTS (SELECT 1 FROM customers WHERE phone = '9876543211') THEN
    INSERT INTO customers (
      name, phone, email, address, city, state, pincode, franchise_id
    ) VALUES (
      'Priya Sharma',
      '9876543211',
      'priya@test.com',
      'Test Venue Address, Connaught Place',
      'Delhi',
      'Delhi',
      '110001',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    );
    RAISE NOTICE '✅ Created test customer: Priya Sharma (Franchise B)';
  ELSE
    RAISE NOTICE '⚠️ Customer Priya Sharma already exists';
  END IF;
END $$;

-- ============================================
-- STEP 3: Create Test Products (if not exists)
-- ============================================
DO $$
DECLARE
  v_franchise_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_franchise_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
BEGIN
  -- Safa for Franchise A
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Test Safa (Franchise A)') THEN
    INSERT INTO products (
      name, category, rental_price, sale_price, security_deposit, 
      stock_available, franchise_id, is_active
    ) VALUES (
      'Test Safa (Franchise A)',
      'Safas',
      50.00,
      200.00,
      10.00,
      500,
      v_franchise_a,
      true
    );
    RAISE NOTICE '✅ Created test product: Test Safa (Franchise A)';
  END IF;

  -- Safa for Franchise B
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Test Safa (Franchise B)') THEN
    INSERT INTO products (
      name, category, rental_price, sale_price, security_deposit, 
      stock_available, franchise_id, is_active
    ) VALUES (
      'Test Safa (Franchise B)',
      'Safas',
      50.00,
      200.00,
      10.00,
      500,
      v_franchise_b,
      true
    );
    RAISE NOTICE '✅ Created test product: Test Safa (Franchise B)';
  END IF;

  -- Sherwani for both franchises
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Test Sherwani') THEN
    INSERT INTO products (
      name, category, rental_price, sale_price, security_deposit, 
      stock_available, franchise_id, is_active
    ) VALUES (
      'Test Sherwani',
      'Sherwanis',
      500.00,
      5000.00,
      100.00,
      50,
      v_franchise_a,
      true
    );
    RAISE NOTICE '✅ Created test product: Test Sherwani';
  END IF;
END $$;

-- ============================================
-- STEP 4: Create Test Users (if not exists)
-- ============================================
-- Note: This assumes you have a users table
-- Adjust based on your actual auth setup

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ MANUAL STEP REQUIRED:';
  RAISE NOTICE 'Create test users in Supabase Auth:';
  RAISE NOTICE '';
  RAISE NOTICE 'User A:';
  RAISE NOTICE '  Email: usera@test.com';
  RAISE NOTICE '  Password: Test123!@#';
  RAISE NOTICE '  Franchise: Test Franchise A';
  RAISE NOTICE '';
  RAISE NOTICE 'User B:';
  RAISE NOTICE '  Email: userb@test.com';
  RAISE NOTICE '  Password: Test123!@#';
  RAISE NOTICE '  Franchise: Test Franchise B';
  RAISE NOTICE '';
END $$;

-- ============================================
-- FINAL REPORT
-- ============================================
DO $$
DECLARE
  v_franchise_count INTEGER;
  v_customer_count INTEGER;
  v_product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_franchise_count FROM franchises WHERE name LIKE 'Test Franchise%';
  SELECT COUNT(*) INTO v_customer_count FROM customers WHERE phone IN ('9876543210', '9876543211');
  SELECT COUNT(*) INTO v_product_count FROM products WHERE name LIKE 'Test%';

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '✅ TEST DATA CREATION COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  Franchises: % test franchise(s)', v_franchise_count;
  RAISE NOTICE '  Customers: % test customer(s)', v_customer_count;
  RAISE NOTICE '  Products: % test product(s)', v_product_count;
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Ready for Testing:';
  RAISE NOTICE '  1. Log in as usera@test.com';
  RAISE NOTICE '  2. Create booking for "Rajesh Kumar"';
  RAISE NOTICE '  3. Add "Test Safa (Franchise A)" products';
  RAISE NOTICE '  4. Test all 3 payment types';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;
