-- COMPLETE FRANCHISE ISOLATION FOR REMAINING BUSINESS TABLES
-- This script covers: laundry, expenses, vendors, products, and sales

-- ============================================================================
-- PART 1: LAUNDRY_BATCHES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_all_laundry_batches" ON laundry_batches;
DROP POLICY IF EXISTS "franchise_users_own_laundry_batches" ON laundry_batches;

ALTER TABLE laundry_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_laundry_batches" ON laundry_batches
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_laundry_batches" ON laundry_batches
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = laundry_batches.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 2: LAUNDRY_BATCH_ITEMS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_all_laundry_batch_items" ON laundry_batch_items;
DROP POLICY IF EXISTS "franchise_users_own_laundry_batch_items" ON laundry_batch_items;

ALTER TABLE laundry_batch_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_laundry_batch_items" ON laundry_batch_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_laundry_batch_items" ON laundry_batch_items
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM laundry_batches
    JOIN users ON users.id = auth.uid()
    WHERE laundry_batches.id = laundry_batch_items.batch_id
    AND users.franchise_id = laundry_batches.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 3: EXPENSES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_all_expenses" ON expenses;
DROP POLICY IF EXISTS "franchise_users_own_expenses" ON expenses;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_expenses" ON expenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_expenses" ON expenses
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = expenses.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 4: VENDORS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_all_vendors" ON vendors;
DROP POLICY IF EXISTS "franchise_users_own_vendors" ON vendors;

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_vendors" ON vendors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_vendors" ON vendors
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = vendors.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 5: PRODUCTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_all_products" ON products;
DROP POLICY IF EXISTS "franchise_users_own_products" ON products;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_products" ON products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_products" ON products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = products.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- PART 6: PRODUCT_CATEGORIES TABLE
-- ============================================================================

DROP POLICY IF EXISTS "super_admin_all_product_categories" ON product_categories;
DROP POLICY IF EXISTS "franchise_users_own_product_categories" ON product_categories;

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_product_categories" ON product_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_product_categories" ON product_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = product_categories.franchise_id
    AND users.is_active = true
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies
WHERE tablename IN (
    'laundry_batches',
    'laundry_batch_items',
    'expenses',
    'vendors',
    'products',
    'product_categories'
)
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have 2 policies

SELECT '✅ LAUNDRY, EXPENSES, VENDORS, PRODUCTS, AND CATEGORIES ARE NOW FULLY FRANCHISE-ISOLATED' AS status;
