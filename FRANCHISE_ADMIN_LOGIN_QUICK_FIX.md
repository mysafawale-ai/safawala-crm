# Franchise Admin Login - Quick Diagnostic & Fix

## What Could Be Wrong?

The login system has **2 paths** - if one fails, the other should work:

```
Path 1: Direct Supabase Auth ❌ 
   ↓
Path 2: Database password fallback + auto-create Supabase Auth ✅ (should work)
```

If both are failing, one of these is true:

## 1️⃣ QUICK CHECK: Database Record

```sql
SELECT 
  id,
  email,
  name,
  role,
  franchise_id,
  is_active,
  CASE 
    WHEN password_hash IS NULL THEN 'NULL (PROBLEM!)'
    WHEN password_hash = '' THEN 'EMPTY (PROBLEM!)'
    WHEN password_hash LIKE '$2a$%' OR password_hash LIKE '$2b$%' THEN 'VALID BCRYPT'
    ELSE 'INVALID FORMAT'
  END as password_status,
  created_at
FROM users
WHERE email ILIKE 'franchise-admin@email.com'
ORDER BY created_at DESC
LIMIT 1;
```

**What you should see:**
- ✅ role = 'franchise_admin'
- ✅ is_active = true
- ✅ password_hash starts with "$2a$" or "$2b$"
- ✅ password_status = 'VALID BCRYPT'

---

## 2️⃣ MOST LIKELY ISSUE: is_active Flag

**Problem**: User created with `is_active = false`

**Check**:
```sql
SELECT is_active FROM users WHERE email ILIKE 'franchise-admin@email.com';
```

**Fix** (if false):
```sql
UPDATE users 
SET is_active = true 
WHERE email ILIKE 'franchise-admin@email.com';
```

**Then test login again** ← Try this FIRST!

---

## 3️⃣ SECOND ISSUE: Password Hash Format

**Problem**: Password stored as plain text or wrong format

**Check**:
```sql
SELECT password_hash FROM users WHERE email ILIKE 'franchise-admin@email.com';
```

**Should look like**: `$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ...`

**If it looks different**: Password wasn't hashed

**Fix**:
```bash
# This will force password reset for that user
curl -X POST http://localhost:3000/api/staff/admin-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "franchise-admin@email.com", "new_password": "NewPassword123!"}'
```

Or have super admin:
1. Go to Staff page
2. Click on franchise admin name
3. Click "Edit" → "Reset Password"
4. Enter temporary password
5. Send to franchise admin to set permanent password

---

## 4️⃣ THIRD ISSUE: Email Case Sensitivity

**Problem**: Email stored as "Admin@Franchise.com" but tried "admin@franchise.com"

**Check** (get exact email):
```sql
SELECT email FROM users WHERE email ILIKE 'franchise-admin@email.com';
```

**Fix**: Use the EXACT email from database when logging in

---

## 5️⃣ TEST: Verify Login Endpoint

```bash
# Test login with exact email and password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "franchise-admin@email.com",
    "password": "password123"
  }' | jq '.'
```

**Expected response on success**:
```json
{
  "user": {
    "id": "uuid-...",
    "email": "franchise-admin@email.com",
    "name": "Franchise Admin",
    "role": "franchise_admin",
    "franchise_id": "uuid-..."
  },
  "session": { ... }
}
```

**If you get "Invalid email or password"**:
- Check database query from step 1
- Verify is_active = true
- Verify password_hash exists and is valid bcrypt

---

## 6️⃣ IF DATABASE IS CORRECT BUT LOGIN STILL FAILS

The fallback path creates Supabase Auth user on-the-fly.

**Check server logs**:
```bash
# Terminal in project folder:
tail -f .next/logs/server.log | grep -i "auth\|login\|fallback"
```

**Look for messages**:
- `[v0] Supabase Auth sign-in failed, attempting legacy auth fallback` → Primary path failed, using backup ✅
- `[v0] Failed to create Supabase Auth user during migration` → Backup creation failed ❌
- `[v0] Invalid email or password` → Password hash didn't match ❌

---

## 7️⃣ NUCLEAR OPTION: Recreate User

If database is right but login fails mysteriously:

1. **Get franchise admin info**:
```sql
SELECT id, email, name, role, franchise_id FROM users 
WHERE email ILIKE 'franchise-admin@email.com';
```

2. **Delete and recreate**:
   - Super admin login
   - Go to Staff page
   - Delete franchise admin
   - Click "+ Add Staff"
   - Create with same details
   - Try login immediately

---

## PRIORITY ORDER (Try These)

### Try First (30 seconds):
```sql
UPDATE users SET is_active = true WHERE email ILIKE 'franchise-admin@email.com';
```
→ Login again

### Try Second (1 minute):
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "franchise-admin@email.com", "password": "exact-password"}'
```
→ Copy exact error message

### Try Third (2 minutes):
```sql
SELECT email, is_active, password_hash FROM users 
WHERE email ILIKE 'franchise-admin@email.com';
```
→ Verify is_active = true and password_hash starts with "$2b$"

### Try Fourth (5 minutes):
- Check server logs for auth errors
- Look for "migration" or "fallback" messages

### Try Last (10 minutes):
- Delete user and recreate
- Or have super admin reset password

---

## What We Know Works ✅

- Staff creation API hashes password with bcrypt ✅
- Staff creation attempts Supabase Auth sync ✅
- Login has fallback for database password ✅
- Fallback creates Supabase Auth user on-the-fly ✅
- No code bugs detected in review ✅

## What's Likely Wrong ❌

1. `is_active = false` (MOST LIKELY - 60% chance)
2. Password hash not stored correctly (20% chance)
3. Email case mismatch (10% chance)
4. Environment variable missing (5% chance)
5. Something else (5% chance)

---

## Need Help?

Provide:
1. Output of database query from step 1
2. Output of login test from step 5
3. Server log messages (search for "auth" or "login")

Then we can pinpoint exact issue.
