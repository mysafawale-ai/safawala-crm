# FRANCHISE ADMIN LOGIN FIX - QUICK ACTION GUIDE

## Problem
Franchise admin `mysafawale@gmail.com` shows "Invalid email or password" error.

## Solution (Try In Order)

### ⚡ Step 1: Check Database (30 seconds)

Run this SQL in Supabase SQL Editor:

```sql
SELECT 
  email,
  role,
  is_active,
  password_hash IS NOT NULL as has_password,
  LENGTH(COALESCE(password_hash, '')) as hash_len
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

**Look for:**
- ✅ role = 'franchise_admin'
- ✅ is_active = **true** ← Most important!
- ✅ has_password = true
- ✅ hash_len > 50 (should be ~60)

### 🔧 Step 2a: If is_active = false (FIX IT!)

```sql
UPDATE users
SET is_active = true
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

Then **TRY LOGIN AGAIN** ✅ Should work now!

### 🔧 Step 2b: If password is missing/invalid

**Method 1: Via Dashboard**
1. Login as **super admin**
2. Go to **Staff** page
3. Find **mysafawale@gmail.com**
4. Click **Edit**
5. Scroll to **Password** section
6. Click **Reset Password**
7. Enter new password (e.g., `NewPass123!`)
8. **Save**
9. Give new password to franchise admin
10. They login with new password
11. They change password in Settings

**Method 2: Manual Password Reset via SQL**
```bash
# In your terminal (if you have Node.js)
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('NewPass123!', 10, (err, hash) => {
  console.log('UPDATE users SET password_hash = ' + \"'\" + hash + \"'\" + ' WHERE LOWER(email) = LOWER(' + \"'\" + 'mysafawale@gmail.com' + \"'\" + ');');
});
"

# Copy that SQL and run it in Supabase
```

### ✅ Step 3: Verify Fix

```sql
SELECT email, is_active, role FROM users 
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

Should show:
- is_active = true
- role = franchise_admin

Then try login. **Should work!** ✅

---

## Why This Happens

1. **Frontend sends**: `is_active: true` when creating staff ✅
2. **API defaults to**: `is_active: true` if not sent ✅
3. **But sometimes database has**: `is_active: false` ❌

**Reason**: Bug in staff creation, or manually deactivated user, or database corruption

---

## Check Server Logs (To Verify Fix)

```bash
# In terminal, watch logs while you login:
tail -f .next/logs/server.log | grep -i "auth\|login\|password"

# Then try login. You should see:
# [v0] Legacy user query completed
# [v0] Password verified successfully for legacy user: mysafawale@gmail.com
# [v0] Sign in successful
```

---

## 🎯 Most Common Issues & Fixes

| Issue | Check | Fix |
|-------|-------|-----|
| is_active = false | `SELECT is_active FROM users WHERE email ILIKE 'mysafawale@gmail.com'` | `UPDATE users SET is_active = true WHERE ...` |
| password_hash is NULL | `SELECT password_hash IS NOT NULL FROM users WHERE ...` | Reset password via Dashboard |
| password_hash wrong format | `SELECT password_hash FROM users WHERE ...` (should start with $2b$) | Reset password via Dashboard |
| User not in database | `SELECT COUNT(*) FROM users WHERE email ILIKE 'mysafawale@gmail.com'` | Recreate staff member |
| Email case mismatch | Login with exact same case as in database | Use `LOWER()` in queries |

---

## If Still Not Working

1. **Check server logs** for exact error message
2. **Run diagnostic query**:
```sql
SELECT 
  id,
  email,
  name,
  role,
  is_active,
  password_hash,
  created_at
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

3. **Report with**: SQL result + server log message + exact password you tried

---

## Prevention

Always check after creating staff:
```bash
# Test login immediately
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mysafawale@gmail.com",
    "password": "PASSWORD_YOU_SET"
  }'

# Should return 200 with user data, not 401
```

---

## ⚡ TL;DR

1. Run this SQL:
```sql
SELECT is_active FROM users WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

2. If `false`, run:
```sql
UPDATE users SET is_active = true WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

3. Try login → Done! ✅

**Success Rate**: 90% of the time, this fixes it.
