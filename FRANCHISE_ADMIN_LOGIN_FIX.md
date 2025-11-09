# Franchise Admin Login Issue - Diagnosis & Fix

## Problem
- Created franchise admin from super admin dashboard
- Cannot login with that franchise admin's email/password
- Error: "Invalid email or password"

## Root Cause Analysis

### What Should Happen:
1. Super admin creates franchise admin through `/api/staff` POST
2. User record created in database with `password_hash`
3. Login attempt → Check Supabase Auth → Fallback to DB password hash
4. Password matches → Create user in Supabase Auth
5. Login successful

### What Might Be Going Wrong:

#### Scenario 1: Password Hashing Issue
- Password not hashed correctly when stored
- OR bcrypt comparison failing

#### Scenario 2: Email Case Sensitivity
- Email stored as "admin@franchise.com"
- Login attempt with "Admin@Franchise.com"
- Query is case-insensitive (.ilike) but might still fail

#### Scenario 3: User Not Active
- User created with `is_active: false`
- Login check: `legacyUser.is_active` fails

#### Scenario 4: Supabase Auth Creation Failed Silently
- Error creating user in Supabase Auth
- But error was swallowed

## Quick Diagnosis Steps

### Step 1: Check if User Exists in Database
```sql
SELECT id, email, name, role, franchise_id, is_active, password_hash
FROM users
WHERE email = 'franchise-admin@email.com'
ORDER BY created_at DESC
LIMIT 1;
```

**What to look for:**
- ✓ Email matches exactly
- ✓ is_active = true
- ✓ password_hash is NOT null and NOT empty
- ✓ password_hash starts with "$2a$" or "$2b$" (bcrypt format)

### Step 2: Check if User Exists in Supabase Auth
Go to Supabase Dashboard → Authentication → Users
- Search for the franchise admin's email
- Check if it's there
- Check email confirmation status

### Step 3: Verify Password Hash Format
If password_hash looks wrong, it wasn't hashed properly

### Step 4: Test Login with Exact Email Case
Try logging in with exact same email case as stored in database

## Fixes to Try (In Order)

### Fix 1: Ensure User is Active
```sql
UPDATE users
SET is_active = true
WHERE email = 'franchise-admin@email.com';
```

### Fix 2: Manually Test Password Hash
1. Get password_hash from database
2. Use bcrypt tool to verify password against hash
3. If fails, password wasn't hashed correctly

### Fix 3: Reset Password
If password hashing is the issue, reset the password:
1. Super admin goes to Staff page
2. Edit franchise admin user
3. Click "Reset Password"
4. Try login again

### Fix 4: Re-create User
If all else fails:
1. Delete franchise admin user
2. Create new one
3. Try login

## Proper Fix for Future (Code Change)

The staff creation API should also sync to Supabase Auth:

```typescript
// After creating user in database, also create in Supabase Auth
const supabaseAdmin = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Create in Supabase Auth
await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { app_user_id: data.id }
})
```

This ensures Supabase Auth and database stay in sync.

## Quick Test

Try this in browser console or with curl:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "franchise-admin@email.com",
    "password": "correct-password-123"
  }'
```

Expected response:
- ✓ { "success": true, "message": "Login successful" }
- ✗ { "error": "Invalid email or password" }

If you get error, check:
1. Is email correct?
2. Is password correct?
3. Is user active in database?
4. Is password_hash in database?

## Next Steps

1. **Check database** using queries above
2. **Share results** so we can narrow down issue
3. **Apply fix** once we identify root cause
4. **Test login** to verify fix works
