-- COMPLETE DIAGNOSTIC - What's actually in the database

-- 1. Table structure
SELECT 'TABLE_STRUCTURE' as step,
  column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'coupons'
ORDER BY ordinal_position;

-- 2. RLS status
SELECT 'RLS_STATUS' as step,
  tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'coupons';

-- 3. Existing coupons
SELECT 'COUPONS' as step,
  id, code, discount_type, discount_value, franchise_id
FROM coupons
ORDER BY created_at DESC;

-- 4. User with Vadodara franchise
SELECT 'USER' as step,
  id, email, franchise_id, role
FROM users
WHERE email = 'vadodara@safawala.com';

-- 5. Check if there are any constraints blocking inserts
SELECT 'CONSTRAINTS' as step,
  constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'coupons';
