-- FIX FRANCHISE ADMIN LOGIN ISSUE
-- Issue: Franchise admin showing "invalid password" error
-- Root cause: Usually is_active = false OR password_hash not stored correctly

-- STEP 1: Check current state
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  password_hash IS NOT NULL as has_hash,
  LENGTH(COALESCE(password_hash, '')) as hash_len
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com')
LIMIT 1;

-- STEP 2: If is_active = false, fix it
UPDATE users
SET is_active = true
WHERE LOWER(email) = LOWER('mysafawale@gmail.com')
  AND role = 'franchise_admin'
  AND is_active = false;

-- STEP 3: Verify fix
SELECT 
  id,
  email,
  role,
  is_active,
  created_at
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');

-- STEP 4: If password_hash is NULL or empty, user needs password reset
-- Super admin should: Go to Staff → Find this user → Edit → Reset Password
-- Or run this to check:
SELECT 
  email,
  CASE 
    WHEN password_hash IS NULL THEN 'NO HASH - NEEDS RESET'
    WHEN LENGTH(COALESCE(password_hash, '')) < 50 THEN 'INVALID HASH - NEEDS RESET'
    WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN 'VALID HASH'
    ELSE 'UNKNOWN FORMAT'
  END as password_status
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
