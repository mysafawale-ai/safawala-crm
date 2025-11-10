-- =====================================================
-- FIX: RLS Policy for package_booking_product_items
-- =====================================================
-- Issue: Table exists but RLS policy is blocking inserts
-- Solution: Drop and recreate with permissive policy

-- Enable RLS on the table
ALTER TABLE package_booking_product_items ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies (if any)
DROP POLICY IF EXISTS "allow_all_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "view_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "insert_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "update_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "delete_package_booking_product_items" ON package_booking_product_items;
DROP POLICY IF EXISTS "allow_authenticated_all" ON package_booking_product_items;
DROP POLICY IF EXISTS "allow_service_role_all" ON package_booking_product_items;

-- Create a single permissive policy for ALL operations
CREATE POLICY "allow_all_operations_package_booking_product_items"
ON package_booking_product_items
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Grant all permissions to necessary roles
GRANT ALL ON package_booking_product_items TO postgres;
GRANT ALL ON package_booking_product_items TO anon;
GRANT ALL ON package_booking_product_items TO authenticated;
GRANT ALL ON package_booking_product_items TO service_role;

-- Verify the policy exists
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'package_booking_product_items';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS policies updated for package_booking_product_items';
  RAISE NOTICE 'Test the following to verify:';
  RAISE NOTICE '1. Test creating a package booking with products';
  RAISE NOTICE '2. Verify items are saved to package_booking_product_items';
  RAISE NOTICE '3. Check console logs: "[Book Package] Product items inserted successfully"';
END $$;
