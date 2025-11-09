# Franchise Admin Login - Diagnostic & Fix Guide

## Problem Statement
Created a franchise admin from super admin login, but cannot login with franchise admin's credentials.

## How the System Should Work

### When Creating Franchise Admin:
1. ✅ Super admin creates new staff member via Dashboard
2. ✅ API creates user record in database table `users` with `password_hash`
3. ✅ API attempts to sync user to Supabase Auth
4. ✅ Success response returned

### When Logging In:
1. ✅ Login API receives email + password
2. Try Supabase Auth first → If success, continue
3. If fails → Try legacy fallback (database password_hash)
4. ✅ If database password matches → Create user in Supabase Auth (migration)
5. ✅ Fetch user profile from database
6. ✅ Return session with permissions
7. ✅ User logged in!

## Diagnostic Steps (Run These First)

### Step 1: Check Database
```sql
-- Replace with your franchise admin's email
SELECT 
  id,
  email, 
  name,
  role,
  franchise_id,
  is_active,
  password_hash,
  created_at
FROM users 
WHERE email ILIKE 'franchise-admin@email.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Look for:**
- ✅ Email exact match (check case)
- ✅ role = 'franchise_admin'
- ✅ is_active = true
- ✅ password_hash exists and is not empty
- ✅ password_hash format: starts with "$2a$" or "$2b$" (bcrypt)

### Step 2: Check Supabase Auth
1. Go to Supabase Dashboard → Authentication → Users
2. Search for franchise admin email
3. Note:
   - Is user there?
   - Is email confirmed?
   - Last sign in: when?

### Step 3: Test Password Hash
If you have access to test env:
```javascript
// In browser console or Node.js
const bcrypt = require('bcryptjs');
const passwordFromDB = "$2b$10$..."; // Copy password_hash from database
const passwordTry = "the-password-user-entered";

bcrypt.compare(passwordTry, passwordFromDB).then(match => {
  console.log("Password match:", match); // Should be true
});
```

### Step 4: Check Logs
Check server logs for:
```
[v0] Login attempt for email: franchise-admin@email.com
[v0] Supabase Auth sign-in failed
[v0] Attempting legacy auth fallback
```

## Common Issues & Fixes

### Issue 1: User Not in Database
**Symptom**: SELECT query returns 0 rows

**Fix**:
```sql
-- Check if user exists with different email case
SELECT * FROM users WHERE email ILIKE 'franchise%';

-- If found but different case, note it for login
-- If NOT found, user was never created
```

**Solution**: Recreate the franchise admin from super admin dashboard

---

### Issue 2: User Not Active
**Symptom**: Database query shows `is_active = false`

**Fix**:
```sql
UPDATE users 
SET is_active = true 
WHERE email ILIKE 'franchise-admin@email.com';
```

Then try login again.

---

### Issue 3: Password Hash Missing or Wrong
**Symptom**: `password_hash` is NULL or doesn't start with "$2a$" or "$2b$"

**Fix**:
Super admin manually reset password:
1. Login as super admin
2. Go to Staff page
3. Find franchise admin
4. Click "Edit"
5. Scroll to "Reset Password" section
6. Enter new password
7. Send reset link to franchise admin
8. Franchise admin clicks link, confirms new password
9. Franchise admin can now login

---

### Issue 4: Email Case Sensitivity
**Symptom**: Login fails with "Invalid email or password"
- Database: email = "Admin@Franchise.com"
- Login attempt: "admin@franchise.com"

**Note**: Login is case-INSENSITIVE (.ilike query), so this should work. But if it's not:

**Fix**: Use EXACT same email case:
1. Get email from database: `SELECT email FROM users WHERE ...`
2. Login with that EXACT case

---

### Issue 5: Supabase Auth Sync Failed
**Symptom**: 
- User in database ✅
- User NOT in Supabase Auth ❌
- Login fails even with fallback

**Check logs for**:
- "Warning: Could not sync to Supabase Auth"
- Service role key misconfigured
- Network error during sync

**Fix**:
1. Check environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` set?
   - `SUPABASE_SERVICE_ROLE_KEY` set?
   - Both correct values?

2. Manually sync user to Supabase Auth:
```sql
-- This creates an endpoint to sync existing users
-- POST /api/auth/sync-user
-- { "user_id": "uuid-from-database" }
```

---

## Quick Fixes (Try In Order)

### Fix 1: Check is_active Flag
```sql
UPDATE users 
SET is_active = true 
WHERE email ILIKE 'franchise-admin@email.com';
```
Try login again.

### Fix 2: Password Reset
1. Super admin goes to Staff page
2. Edit franchise admin
3. Click "Reset Password"
4. New password set in database
5. Try login again

### Fix 3: Recreate User
1. Super admin notes franchise admin details (name, email, role, franchise)
2. Delete franchise admin user
3. Create new franchise admin user with same details
4. Try login immediately

### Fix 4: Check Environment
```bash
# In terminal at repo root
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "Service key exists: $([ -z "$SUPABASE_SERVICE_ROLE_KEY" ] && echo 'NO' || echo 'YES')"
```

If service key missing, set it in `.env.local`

## Testing After Fix

### Test 1: Basic Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "franchise-admin@email.com",
    "password": "password123"
  }'
```

Expected: 200 with user data + session

### Test 2: Dashboard Access
1. Logout super admin
2. Login as franchise admin
3. Should see own franchise's dashboard
4. Should NOT see other franchises

### Test 3: Permission Isolation
1. As franchise admin, try to:
   - View own franchise customers ✅
   - View other franchise customers ❌ (should fail)
   - Edit own staff ✅
   - Edit other franchise staff ❌ (should fail)

## What to Report If Still Stuck

When asking for help, provide:

1. **Database query result**:
```sql
SELECT id, email, name, role, franchise_id, is_active, 
       length(password_hash) as hash_length, 
       substring(password_hash, 1, 10) as hash_start
FROM users 
WHERE email ILIKE 'franchise-admin@email.com';
```

2. **Supabase Auth status**: Is user there? Email confirmed?

3. **Login attempt result**: What exact error message?

4. **Server logs**: Any warnings or errors?

## Prevention for Future

The code DOES sync to Supabase Auth on creation. If it's not working:

1. Check service key in `.env.local`
2. Check server logs for sync errors
3. Verify user is created in database successfully first

The fallback password hash login should work even if Supabase Auth sync fails.
