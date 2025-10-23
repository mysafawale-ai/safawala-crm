-- FIX PACKAGE VARIANTS RLS FOR FRANCHISE ISOLATION
-- Issue: Franchise admins can see variants from other franchises
-- Cause: RLS policies checking old 'packages' table structure
-- Solution: Update RLS policies to check franchise_id directly on package_variants

-- Step 1: Drop old/incorrect policies
DROP POLICY IF EXISTS "super_admin_full_access_package_variants" ON package_variants;
DROP POLICY IF EXISTS "franchise_users_own_package_variants" ON package_variants;
DROP POLICY IF EXISTS "Allow all operations on package_variants" ON package_variants;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON package_variants;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON package_variants;
DROP POLICY IF EXISTS "Users can view package_variants" ON package_variants;
DROP POLICY IF EXISTS "Users can manage package_variants" ON package_variants;

-- Step 2: Enable RLS
ALTER TABLE package_variants ENABLE ROW LEVEL SECURITY;

-- Step 3: Create proper franchise-isolated policies

-- Policy 1: Super admins see all variants
CREATE POLICY "super_admin_all_package_variants" ON package_variants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

-- Policy 2: Franchise admins/staff see only their franchise's variants
CREATE POLICY "franchise_users_own_package_variants" ON package_variants
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = package_variants.franchise_id
    AND users.is_active = true
  )
);

-- Step 4: Apply same policies to package_levels
DROP POLICY IF EXISTS "super_admin_all_package_levels" ON package_levels;
DROP POLICY IF EXISTS "franchise_users_own_package_levels" ON package_levels;

ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_package_levels" ON package_levels
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_package_levels" ON package_levels
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM package_variants
    JOIN users ON users.id = auth.uid()
    WHERE package_variants.id = package_levels.variant_id
    AND users.franchise_id = package_variants.franchise_id
    AND users.is_active = true
  )
);

-- Step 5: Apply same policies to distance_pricing
DROP POLICY IF EXISTS "super_admin_all_distance_pricing" ON distance_pricing;
DROP POLICY IF EXISTS "franchise_users_own_distance_pricing" ON distance_pricing;

ALTER TABLE distance_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_distance_pricing" ON distance_pricing
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_distance_pricing" ON distance_pricing
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM package_levels
    JOIN package_variants ON package_variants.id = package_levels.variant_id
    JOIN users ON users.id = auth.uid()
    WHERE package_levels.id = distance_pricing.level_id
    AND users.franchise_id = package_variants.franchise_id
    AND users.is_active = true
  )
);

-- Step 6: Verify the policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('package_variants', 'package_levels', 'distance_pricing')
ORDER BY tablename, policyname;

-- Expected result: 
-- package_variants: 2 policies (super_admin_all, franchise_users_own)
-- package_levels: 2 policies (super_admin_all, franchise_users_own)
-- distance_pricing: 2 policies (super_admin_all, franchise_users_own)
