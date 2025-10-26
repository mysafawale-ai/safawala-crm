-- Fix RLS policies for package_bookings to allow INSERT operations
-- The issue: INSERT policies need WITH CHECK instead of USING for proper authorization

-- Drop existing policies
DROP POLICY IF EXISTS "super_admin_all_package_bookings" ON package_bookings;
DROP POLICY IF EXISTS "franchise_users_own_package_bookings" ON package_bookings;

-- Ensure RLS is enabled
ALTER TABLE package_bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super admins can do everything
CREATE POLICY "super_admin_all_package_bookings" ON package_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

-- Policy 2: Franchise users can only access their franchise's bookings
CREATE POLICY "franchise_users_own_package_bookings" ON package_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = package_bookings.franchise_id
    AND users.is_active = true
    AND users.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = package_bookings.franchise_id
    AND users.is_active = true
    AND users.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
);

-- Also fix package_booking_items policies
DROP POLICY IF EXISTS "super_admin_all_package_booking_items" ON package_booking_items;
DROP POLICY IF EXISTS "franchise_users_own_package_booking_items" ON package_booking_items;

ALTER TABLE package_booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_package_booking_items" ON package_booking_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_package_booking_items" ON package_booking_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    INNER JOIN users u ON u.id = auth.uid()
    WHERE pb.id = package_booking_items.booking_id
    AND pb.franchise_id = u.franchise_id
    AND u.is_active = true
    AND u.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    INNER JOIN users u ON u.id = auth.uid()
    WHERE pb.id = package_booking_items.booking_id
    AND pb.franchise_id = u.franchise_id
    AND u.is_active = true
    AND u.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
);

-- Verify policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename, policyname;
