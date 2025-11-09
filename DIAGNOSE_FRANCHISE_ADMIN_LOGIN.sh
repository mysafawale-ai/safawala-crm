#!/bin/bash

# IMMEDIATE DIAGNOSTIC FOR FRANCHISE ADMIN LOGIN

EMAIL="mysafawale@gmail.com"
DB_CHECK=$(cat << 'SQL'
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  password_hash IS NOT NULL as has_password,
  LENGTH(COALESCE(password_hash, '')) as hash_len,
  SUBSTRING(COALESCE(password_hash, ''), 1, 10) as hash_start,
  created_at
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com')
LIMIT 1;
SQL
)

echo "🔍 FRANCHISE ADMIN LOGIN DIAGNOSTIC"
echo "=================================="
echo ""
echo "Checking database for: $EMAIL"
echo ""
echo "Run this SQL query in Supabase SQL Editor:"
echo "---"
echo "$DB_CHECK"
echo "---"
echo ""
echo "📋 What to look for:"
echo "✅ is_active = true (if false, that's the problem!)"
echo "✅ hash_len > 50 (should be ~60 for bcrypt)"
echo "✅ hash_start = \$2a\$ or \$2b\$ (bcrypt format)"
echo "✅ role = franchise_admin"
echo ""
echo "🔧 If is_active = false, run:"
echo "UPDATE users SET is_active = true WHERE LOWER(email) = LOWER('$EMAIL');"
echo ""
echo "⚠️ If password_hash is wrong:"
echo "1. Super admin: Go to Staff page"
echo "2. Edit this user"
echo "3. Click 'Reset Password'"
echo "4. Set new password"
echo "5. User logs in with new password"
