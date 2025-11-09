-- DETAILED FRANCHISE ADMIN PASSWORD DIAGNOSTIC
-- Run this to see EXACTLY what's wrong

SELECT 
  id,
  email,
  name,
  role,
  is_active,
  password_hash,
  LENGTH(COALESCE(password_hash, '')) as hash_length,
  SUBSTRING(COALESCE(password_hash, ''), 1, 10) as hash_start,
  CASE 
    WHEN password_hash IS NULL THEN '❌ NO PASSWORD - NEEDS RESET'
    WHEN LENGTH(COALESCE(password_hash, '')) = 0 THEN '❌ EMPTY PASSWORD - NEEDS RESET'
    WHEN LENGTH(COALESCE(password_hash, '')) < 50 THEN '❌ INVALID LENGTH (too short) - NEEDS RESET'
    WHEN SUBSTRING(password_hash, 1, 4) = '$2a$' THEN '✅ VALID BCRYPT (old format)'
    WHEN SUBSTRING(password_hash, 1, 4) = '$2b$' THEN '✅ VALID BCRYPT (current format)'
    WHEN SUBSTRING(password_hash, 1, 4) = '$2x$' THEN '✅ VALID BCRYPT (old format)'
    WHEN SUBSTRING(password_hash, 1, 4) = '$2y$' THEN '✅ VALID BCRYPT (new format)'
    ELSE '❌ INVALID FORMAT - NOT BCRYPT'
  END as password_status,
  created_at,
  updated_at
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com')
LIMIT 1;
