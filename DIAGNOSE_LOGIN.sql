-- Diagnose franchise admin login issue for mysafawale@gmail.com

-- Step 1: Check if user exists and what state they're in
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  password_hash IS NOT NULL as has_password,
  LENGTH(COALESCE(password_hash, '')) as hash_length,
  SUBSTRING(COALESCE(password_hash, ''), 1, 10) as hash_start,
  franchise_id,
  created_at
FROM users
WHERE email ILIKE 'mysafawale@gmail.com'
ORDER BY created_at DESC;

-- Step 2: If user exists, check permissions
SELECT 
  id,
  email,
  permissions,
  is_active
FROM users
WHERE email ILIKE 'mysafawale@gmail.com'
LIMIT 1;

-- Step 3: Check if there are multiple accounts with similar email
SELECT 
  id,
  email,
  role,
  is_active,
  created_at
FROM users
WHERE email ILIKE 'mysafawale%'
ORDER BY created_at DESC;
