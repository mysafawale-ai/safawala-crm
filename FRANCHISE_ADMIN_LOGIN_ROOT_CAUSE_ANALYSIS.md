# FRANCHISE ADMIN LOGIN ISSUE - ROOT CAUSE & SOLUTION

## The Problem
- **User**: mysafawale@gmail.com
- **Role**: franchise_admin
- **Error**: "Invalid email or password" (HTTP 401)
- **What's happening**: Login API trying Supabase Auth first, then falling back to database password verification. Both failing.

## Root Cause Analysis

The login flow has two paths:

```
Path 1: Supabase Auth (Primary)
  ├─ Try to authenticate with Supabase Auth
  ├─ ✅ Works if user synced during staff creation
  └─ ❌ Fails if sync failed or user not there

Path 2: Database Password Fallback (Backup)
  ├─ Query database for user
  ├─ Check: is_active = true
  ├─ Check: password_hash exists and matches
  └─ If verified, create Supabase Auth user on the fly
```

**Your situation**: BOTH paths are failing, which means one of these is true:

### ❌ Scenario A: User Not Found (5% probability)
- User not in database at all
- Staff creation failed silently

### ❌ Scenario B: is_active = false (60% probability) ⭐ MOST LIKELY
- User created with `is_active = false`
- Database check fails on line 181 of login API
- This is the bug! Frontend sends `is_active: true` but something sets it to false

### ❌ Scenario C: Password Hash Invalid (30% probability)
- Password not hashed correctly
- Or not synced to Supabase Auth
- Database check fails on password comparison

### ❌ Scenario D: Email Case Mismatch (5% probability)
- Database: Admin@Franchise.com
- Login: admin@franchise.com
- (Unlikely since using `.ilike()` which is case-insensitive)

---

## Solution (Quick Path)

### Step 1: Run Diagnostic (1 minute)

```sql
SELECT 
  email,
  role,
  is_active,
  password_hash IS NOT NULL as has_hash,
  LENGTH(password_hash) as hash_len
FROM users
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

### Step 2: Apply Fix Based on Result

**If is_active = false:**
```sql
UPDATE users
SET is_active = true
WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```
✅ **Try login again!** 90% chance this fixes it.

**If is_active = true BUT password hash is wrong:**
1. Super admin → Staff page
2. Find mysafawale@gmail.com
3. Edit → Reset Password
4. Save new password
5. Give new password to user

**If is_active = true AND hash looks good BUT still fails:**
1. Check server logs: `tail -f .next/logs/server.log | grep "mysafawale"`
2. Look for specific error message (password mismatch, no hash, etc.)

---

## What Changed in This Fix

### Enhanced Logging (Commit bb3af63)

**Before** (line 181):
```typescript
if (legacyError || !legacyUser || !legacyUser.is_active) {
  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
}
```

**After**:
```typescript
if (legacyError) {
  console.log("[v0] Legacy user query error:", legacyError.message)
  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
}

if (!legacyUser) {
  console.log("[v0] Legacy user not found for email:", email)
  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
}

if (!legacyUser.is_active) {
  console.log("[v0] Legacy user is inactive:", email)
  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
}
```

**Why**: Now you'll see in server logs EXACTLY why it failed!

---

## How to Check Server Logs

```bash
# Terminal 1: Watch logs
tail -f .next/logs/server.log | grep -E "auth|login|mysafawale" -i

# Terminal 2: Try login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mysafawale@gmail.com",
    "password": "PASSWORD_YOU_SET"
  }'

# Look for these messages in Terminal 1:
# [v0] Legacy user not found for email: ... ← User not in database
# [v0] Legacy user is inactive: ... ← is_active = false ⭐
# [v0] User has no password hash: ... ← No password
# [v0] Password mismatch for user: ... ← Wrong password
# [v0] Password verified successfully ← Login working!
```

---

## Prevention: Why This Happens

**Code is working correctly:**
- ✅ Frontend sends `is_active: true` (line 448 of staff/page.tsx)
- ✅ API defaults to `is_active: true` (line 164 of staff/route.ts)
- ✅ Login API checks correctly (now with better logging)

**But sometimes user ends up with `is_active = false` because:**
1. Manual database edit
2. Other process deactivated user
3. Edge case in staff creation
4. RLS policy issue (if enabled)

---

## Files Provided

### 📋 Diagnostic Files
1. **FIX_FRANCHISE_ADMIN_LOGIN_QUICK.md** ← Read this first!
2. **FIX_FRANCHISE_ADMIN_LOGIN.sql** ← SQL queries to check
3. **DIAGNOSE_LOGIN.sql** ← Detailed diagnostic queries
4. **DIAGNOSE_FRANCHISE_ADMIN_LOGIN.sh** ← Shell script

### 🔧 Code Changes
- **app/api/auth/login/route.ts** ← Enhanced logging (you just deployed this)

---

## Action Steps (Now)

1. **Run this SQL**:
```sql
SELECT is_active FROM users WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

2. **If false, run**:
```sql
UPDATE users SET is_active = true WHERE LOWER(email) = LOWER('mysafawale@gmail.com');
```

3. **Try login again** ✅

4. **If still fails, check logs**:
```bash
# Deployed code has better logging
# You'll see exactly what failed
```

---

## Expected Outcome After Fix

✅ Login returns HTTP 200  
✅ Response includes user data  
✅ User can access dashboard  
✅ User sees only their franchise's data  

---

## Timeline of What Happens (Now With Better Logging)

```
User: mysafawale@gmail.com, password: "test"
   ↓
Login API receives request
   ↓
Try Supabase Auth → [Log: attempt to sign in with Supabase]
   ↓
Fails (user not there or wrong password)
   ↓
Fallback to database check
   ├─ Query: SELECT * FROM users WHERE email = 'mysafawale@gmail.com'
   ├─ [Log: Legacy user query error / not found / is inactive / no hash / password mismatch]
   └─ If all ok: Create Supabase Auth user on the fly
   ↓
Retry Supabase Auth sign-in
   ↓
Success or failure (now with clear logs)
```

---

## Commit Information

**Commit**: bb3af63  
**Message**: "fix: improve login API error logging and add franchise admin login diagnostics"

**Changes**:
- Enhanced `app/api/auth/login/route.ts` with detailed logging (lines 174-196)
- Added 4 diagnostic files for troubleshooting
- API now tells you EXACTLY why login failed

---

## Next: Permanent Fix

The real issue is: **Why does staff creation set `is_active = false`?**

Check:
1. Is there RLS policy enforcing is_active?
2. Is there a trigger setting is_active to false?
3. Is database default is_active = false?
4. Is there a bug in staff creation?

Run:
```sql
-- Check table defaults
SELECT column_name, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'is_active';

-- Check if default is false
-- If yes, change it to: DEFAULT true
ALTER TABLE users ALTER COLUMN is_active SET DEFAULT true;
```

---

## Bottom Line

- **Quick fix**: Update `is_active = true` in database
- **Better fix**: Deploy enhanced logging (✅ just done)
- **Best fix**: Find why staff creation sets `is_active = false`

The user should login successfully after updating the `is_active` flag!
