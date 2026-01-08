-- Check current RLS policies on vendors table
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;

-- If there are restrictive policies, we need to disable RLS or create proper policies
-- For now, let's create a policy that allows reading vendors for authenticated users
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read" ON vendors;
DROP POLICY IF EXISTS "Allow authenticated to read" ON vendors;
DROP POLICY IF EXISTS "Allow franchise access" ON vendors;

-- Create policy to allow authenticated users to see vendors for their franchise
CREATE POLICY "Allow authenticated to read vendors"
ON vendors
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  (
    franchise_id = (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  )
);

-- Allow authenticated users to insert vendors
CREATE POLICY "Allow authenticated to insert vendors"
ON vendors
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated' AND
  franchise_id = (
    SELECT franchise_id FROM users WHERE id = auth.uid()
  )
);

-- Allow authenticated users to update vendors
CREATE POLICY "Allow authenticated to update vendors"
ON vendors
FOR UPDATE
USING (
  auth.role() = 'authenticated' AND
  (
    franchise_id = (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  )
)
WITH CHECK (
  auth.role() = 'authenticated' AND
  (
    franchise_id = (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM users WHERE id = auth.uid()) = 'super_admin'
  )
);

-- Check if policy was created
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'vendors'
ORDER BY policyname;
