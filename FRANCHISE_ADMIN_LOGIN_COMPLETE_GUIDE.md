# FRANCHISE ADMIN LOGIN ISSUE - COMPLETE TROUBLESHOOTING GUIDE

## Problem
Created franchise admin from super admin, but franchise admin cannot login.

## Root Cause Analysis

### The System Design
```
User Creation Flow:
  Super admin creates staff
  ↓
  API stores password hash in database
  ↓
  API attempts to create user in Supabase Auth
  ↓
  Response sent (success regardless of Auth sync)

Login Flow:
  User enters email + password
  ↓
  Try Supabase Auth sign-in (PRIMARY)
  ↓
  If fails → Query database for password hash (FALLBACK)
  ↓
  If fallback succeeds → Create Supabase Auth user + retry login
  ↓
  User logged in
```

**Key Point**: Even if Supabase Auth sync fails during creation, login should work via fallback path because:
1. Database password hash stored ✅
2. Login fallback verifies hash with bcrypt ✅
3. Fallback creates Supabase Auth user if needed ✅

---

## Diagnosis Flowchart

```
┌─ Does staff creation show success message?
│  └─ NO  → Staff creation failed (check response for error)
│  └─ YES → Continue
│
├─ Can you login as super admin?
│  └─ NO  → Supabase Auth issue (not franchise admin specific)
│  └─ YES → Continue
│
├─ Is franchise admin user in database?
│  │  SELECT * FROM users WHERE email ILIKE 'franchise-admin@email.com'
│  ├─ 0 rows → User creation failed to save in database
│  │  └─ Contact support with staff creation response
│  └─ Found user → Check is_active flag
│
├─ is_active = true?
│  ├─ NO  → User marked inactive
│  │  └─ Run: UPDATE users SET is_active = true WHERE ...
│  │  └─ Then try login again
│  └─ YES → Check password hash
│
├─ password_hash exists and valid?
│  │  Should start with: $2a$ or $2b$
│  │  Should be ~60 characters
│  ├─ NO  → Password not hashed correctly
│  │  └─ Super admin: Go to Staff page, click Edit, Reset Password
│  │  └─ Franchise admin enters temporary password from email
│  │  └─ Then can login
│  └─ YES → Test login endpoint
│
├─ Does login endpoint return 200?
│  │  curl -X POST http://localhost:3000/api/auth/login \
│  │    -H "Content-Type: application/json" \
│  │    -d '{"email": "...", "password": "..."}'
│  ├─ 200 → ✅ LOGIN WORKS!
│  ├─ 401 → Password mismatch or something wrong
│  │  └─ Verify exact password (check for spaces, caps)
│  │  └─ Run TEST_PASSWORD_HASH.js to verify hash
│  │  └─ If hash verified: Try browser cache clear
│  └─ 500 → Server error
│     └─ Check server logs, report error
```

---

## Step-by-Step Troubleshooting

### Step 1: Database Verification (5 min)

**Query to run**:
```sql
-- In Supabase SQL Editor or your SQL client
SELECT 
  'Staff Record Status' as step,
  id,
  email,
  name,
  role,
  is_active,
  password_hash IS NOT NULL as has_password,
  LENGTH(COALESCE(password_hash, '')) as hash_length
FROM users
WHERE email ILIKE 'franchise-admin@email.com'
ORDER BY created_at DESC
LIMIT 1;
```

**What you should see**:
| Column | Value | Status |
|--------|-------|--------|
| role | 'franchise_admin' | ✅ |
| is_active | true | ✅ |
| has_password | true | ✅ |
| hash_length | ~60 | ✅ |

**If you see**:
| Result | Meaning | Fix |
|--------|---------|-----|
| 0 rows | User not created | Check staff creation was successful |
| is_active = false | User marked inactive | `UPDATE users SET is_active = true WHERE ...` |
| has_password = false | No password hash | Reset password via dashboard |
| hash_length < 50 | Invalid hash | Password not hashed correctly, reset |

---

### Step 2: Password Hash Validation (5 min)

**Local Test (requires Node.js)**:
```bash
# Copy password_hash from database query above
# Then run:
node TEST_PASSWORD_HASH.js

# Paste the hash and the password you tried
# Script will tell you if hash matches password
```

**Or Manual Test in Node REPL**:
```javascript
const bcrypt = require('bcryptjs');

// Get these from database query
const hashFromDB = "$2b$10$..."; // Copy password_hash
const password = "password123";   // The password user tried

bcrypt.compare(password, hashFromDB)
  .then(match => console.log("Match:", match))
  .catch(err => console.log("Error:", err.message));
```

**Expected**: `Match: true`

**If false**: Password doesn't match, user entered wrong password or hash is corrupted

---

### Step 3: Login Endpoint Test (5 min)

**Using curl**:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "franchise-admin@email.com",
    "password": "PASSWORD_THEY_ENTERED"
  }' | jq '.'
```

**Using Postman**:
1. New → Request
2. Method: POST
3. URL: `http://localhost:3000/api/auth/login`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "email": "franchise-admin@email.com",
  "password": "PASSWORD_THEY_ENTERED"
}
```

**Expected Response (200)**:
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

**If 401 "Invalid email or password"**:
- Database check failed (is_active false)
- OR password doesn't match hash
- OR user not found in database
- → Go back to Step 1

**If 500 Error**:
- Server error during login
- → Check server logs: `tail -f .next/logs/server.log | grep -i error`

---

### Step 4: Server Logs Analysis (5 min)

**Start logging**:
```bash
# Terminal window
tail -f .next/logs/server.log 2>/dev/null | grep -i "auth\|login\|sync"
```

**Trigger login and watch for messages**:
```bash
# Another terminal
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "franchise-admin@email.com", "password": "test"}'
```

**Look for**:
- `[Staff API] Synced new staff member to Supabase Auth: ...` → ✅ Sync worked
- `[Staff API] Could not sync ... to Supabase Auth` → ⚠️ Sync failed (ok, fallback exists)
- `[v0] Supabase Auth sign-in failed, attempting legacy auth fallback` → ✅ Primary failed, trying fallback
- `[v0] Invalid email or password` → ❌ Both paths failed

---

## Common Fixes (Try In Order)

### Fix 1: Activate User (30 seconds)
```sql
UPDATE users 
SET is_active = true 
WHERE email ILIKE 'franchise-admin@email.com';

-- Verify:
SELECT is_active FROM users WHERE email ILIKE 'franchise-admin@email.com';
```

Then try login again immediately.

---

### Fix 2: Reset Password (2 minutes)

**Method A: Dashboard UI**
1. Login as super admin
2. Go to Staff page
3. Find franchise admin → Click menu ⋮
4. Click "Edit" or select staff member
5. Scroll to "Password" or "Reset Password"
6. Enter new temporary password (e.g., `TempPass123!`)
7. Save
8. Have franchise admin login with new password
9. Dashboard → Settings → Change password to permanent

**Method B: Direct Database Update**
```bash
# In your terminal (requires Node.js + bcrypt):
node -e "
const bcrypt = require('bcryptjs');
const pwd = 'NewPassword123!';
const salt = 10;

bcrypt.hash(pwd, salt, (err, hash) => {
  if (err) console.log('Error:', err);
  console.log('Hash:', hash);
  console.log('');
  console.log('Run this SQL:');
  console.log(\`UPDATE users SET password_hash = '\${hash}' WHERE email ILIKE 'franchise-admin@email.com';\`);
  console.log('');
  console.log('Then franchise admin can login with:', pwd);
});
"
```

Then try login with new password.

---

### Fix 3: Recreate User (5 minutes)

1. Super admin login → Staff page
2. Find franchise admin → Click menu ⋮ → Delete
3. Confirm delete
4. Click "+ Add Staff"
5. Fill form:
   - Name: [same as before]
   - Email: [same as before]
   - Role: Franchise Admin
   - Franchise: [correct franchise]
   - Password: [new password]
6. Click Save
7. Try login immediately with new password

---

### Fix 4: Environment Variables (2 minutes)

```bash
# Check if set:
cat .env.local | grep -i supabase

# Should show:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

If missing:
1. Go to Supabase dashboard → Settings → API
2. Copy Project URL
3. Copy Service Role Secret
4. Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```
5. Save
6. Restart dev server: Ctrl+C then `npm run dev`

---

### Fix 5: Browser Cache (1 minute)

1. Open DevTools (F12)
2. Application → Storage → Clear Site Data
3. Close all tabs
4. Try login again in fresh tab

---

## If Still Stuck

Gather this information and ask for help:

```markdown
## Debug Info

### Database State
[Paste output of this query]
```sql
SELECT email, role, is_active, LENGTH(password_hash), 
       SUBSTRING(password_hash, 1, 10), created_at
FROM users 
WHERE email ILIKE 'franchise-admin@email.com'
LIMIT 1;
```

### Login Test Result
```
Email: franchise-admin@email.com
Password tried: [enter what they tried]

Response code: [e.g., 401, 500]
Response body: [paste entire response]
```

### Server Logs
[From around the time of login attempt, any messages with "auth" or "error"]

### Environment
- NEXT_PUBLIC_SUPABASE_URL: [set? Y/N]
- SUPABASE_SERVICE_ROLE_KEY: [set? Y/N]
- Checked Supabase Auth dashboard?
```

---

## Code Paths Verified ✅

**Staff Creation** (`/app/api/staff/route.ts`):
- ✅ Line 161: `is_active = true` default
- ✅ Line 212: Password hashed with bcrypt
- ✅ Line 231: `is_active` included in DB insert
- ✅ Lines 245-280: Supabase Auth sync with error handling

**Login Fallback** (`/app/api/auth/login/route.ts`):
- ✅ Line 177: Query database with case-insensitive email
- ✅ Line 182: Check `is_active = true`
- ✅ Line 185: `bcrypt.compare()` password verification
- ✅ Line 189: Create Supabase Auth user if needed
- ✅ Line 197: Retry login with Supabase Auth

**Conclusion**: Code is correct. Issue is in data or environment.

---

## Timeline of What Happens

```
1. Super admin creates franchise admin (00:00)
   └─ Frontend sends: {email, password, is_active: true, ...}

2. API receives request (00:01)
   └─ Validates permissions (super admin ✅)
   └─ Validates role (can create franchise_admin ✅)
   └─ Hashes password: bcrypt.hash(password, 10) = "$2b$10$..."

3. API inserts into database (00:02)
   └─ INSERT INTO users (email, password_hash, is_active, ...)
   └─ is_active = true
   └─ password_hash = "$2b$10$..."

4. API attempts Supabase Auth sync (00:03)
   └─ Uses SUPABASE_SERVICE_ROLE_KEY
   └─ Creates user with email_confirm: true
   └─ May fail (network, key invalid) but doesn't block response

5. Response sent (00:04)
   └─ Frontend shows: "Staff member added successfully!"

6. Franchise admin attempts login (00:05)
   └─ Sends email + password

7. Login API tries Supabase Auth (00:06)
   └─ May succeed or fail

8. If Supabase Auth fails → Fallback (00:07)
   └─ Query database: SELECT * WHERE email ILIKE '$email'
   └─ Check: is_active = true ✅ (or fails here)
   └─ Check: bcrypt.compare(password, hash) ✅ (or fails here)
   └─ If both ok: Create Supabase Auth user (first time migration)
   └─ Retry Supabase Auth login → Success ✅

9. User logged in (00:08)
```

**Most likely failure point**: Step 8 - either `is_active=false` or password hash mismatch

---

## Success Indicators ✅

You'll know it's fixed when:
1. ✅ Database query shows `is_active = true` for franchise admin
2. ✅ Password hash starts with `$2b$` and is ~60 chars
3. ✅ Login endpoint returns 200 with user data
4. ✅ Franchise admin can login to dashboard
5. ✅ Franchise admin sees only their own franchise data

---

## Prevention for Future

When creating franchise admin in future:
1. Verify creation shows success message ✅
2. Check database immediately: `SELECT * FROM users WHERE ...`
3. Test login immediately
4. If fails: Check steps above while details fresh

---

**Questions?** Follow the decision tree at the top, run the SQL queries, and check server logs.
