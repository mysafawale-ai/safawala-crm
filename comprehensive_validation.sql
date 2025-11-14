-- STEP 1: Validate table structure
SELECT 
  'TABLE STRUCTURE CHECK' as validation_step,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN ('coupons', 'franchises', 'users')
ORDER BY table_name, ordinal_position;

-- STEP 2: Validate foreign key constraints
SELECT 
  'FOREIGN KEY CHECK' as validation_step,
  constraint_name,
  table_name,
  column_name
FROM information_schema.key_column_usage
WHERE table_name = 'coupons';

-- STEP 3: Check RLS status
SELECT 
  'RLS STATUS CHECK' as validation_step,
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('coupons', 'franchises', 'users');

-- STEP 4: Check existing policies on coupons
SELECT 
  'RLS POLICIES CHECK' as validation_step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'coupons';

-- STEP 5: Verify data exists
SELECT 
  'DATA VERIFICATION' as validation_step,
  'franchises' as table_name,
  COUNT(*) as record_count
FROM franchises
UNION ALL
SELECT 
  'DATA VERIFICATION' as validation_step,
  'coupons' as table_name,
  COUNT(*) as record_count
FROM coupons
UNION ALL
SELECT 
  'DATA VERIFICATION' as validation_step,
  'users' as table_name,
  COUNT(*) as record_count
FROM users;

-- STEP 6: Check specific coupon data
SELECT 
  'COUPON DATA CHECK' as validation_step,
  id,
  code,
  discount_type,
  discount_value,
  franchise_id,
  created_at
FROM coupons
ORDER BY created_at DESC;
