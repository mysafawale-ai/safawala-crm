-- Fix RLS policies for coupons table
-- Enable RLS if not already enabled
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view coupons for their franchise" ON coupons;
DROP POLICY IF EXISTS "Super admins can view all coupons" ON coupons;
DROP POLICY IF EXISTS "Franchise owners can manage their coupons" ON coupons;
DROP POLICY IF EXISTS "Super admins can manage all coupons" ON coupons;

-- Policy 1: Users can view coupons for their franchise
CREATE POLICY "Users can view coupons for their franchise"
ON coupons
FOR SELECT
USING (
  franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid()) 
  OR 
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Policy 2: Franchise owners can insert/update/delete their coupons
CREATE POLICY "Franchise owners can manage their coupons"
ON coupons
FOR INSERT
WITH CHECK (
  franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

CREATE POLICY "Franchise owners can update their coupons"
ON coupons
FOR UPDATE
USING (
  franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
)
WITH CHECK (
  franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

CREATE POLICY "Franchise owners can delete their coupons"
ON coupons
FOR DELETE
USING (
  franchise_id = (SELECT franchise_id FROM users WHERE id = auth.uid())
  OR
  auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin')
);

-- Verify RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'coupons';
