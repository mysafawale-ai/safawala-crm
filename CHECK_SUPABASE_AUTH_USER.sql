-- Check if franchise admin user exists in Supabase Auth

-- This query checks the auth.users table
SELECT 
  id,
  email,
  email_confirmed_at,
  last_sign_in_at,
  created_at,
  user_metadata
FROM auth.users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com')
LIMIT 1;

-- If no results, the user is NOT in Supabase Auth
-- That's fine! The fallback will create them during login
-- But the fallback is failing, which means password mismatch

-- To see if the password matches, we'd need to test bcrypt.compare locally
-- But we can try a workaround: Reset the password
