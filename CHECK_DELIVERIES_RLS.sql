-- Check RLS policies on deliveries table

-- 1. Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'deliveries';

-- 2. Check existing RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'deliveries'
ORDER BY policyname;

-- 3. Try to select deliveries directly (test query)
SELECT 
  id,
  delivery_number,
  customer_id,
  booking_id,
  booking_source,
  status,
  delivery_date,
  created_at
FROM deliveries
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check deliveries with customer info (like the API does)
SELECT 
  d.id,
  d.delivery_number,
  d.status,
  d.delivery_date,
  d.created_at,
  c.name as customer_name,
  c.phone as customer_phone
FROM deliveries d
LEFT JOIN customers c ON d.customer_id = c.id
ORDER BY d.created_at DESC
LIMIT 5;
