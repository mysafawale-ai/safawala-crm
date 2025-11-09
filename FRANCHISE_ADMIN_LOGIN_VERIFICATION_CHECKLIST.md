# FRANCHISE ADMIN LOGIN ISSUE - VERIFICATION CHECKLIST

## The Incident
- Super admin creates franchise admin via Dashboard
- Franchise admin creation appears successful
- Franchise admin cannot login with provided credentials

## What We Know ✅
1. **Frontend sends correct data**: `is_active: true` in POST request (line 449 of staff/page.tsx)
2. **API defaults correctly**: `is_active = true` default parameter (line 161 of staff/route.ts)
3. **Database insert includes it**: `is_active` passed to DB insert (line 231 of staff/route.ts)
4. **Supabase Auth sync attempted**: Lines 245-280 of staff/route.ts with proper error handling
5. **Login fallback exists**: Database password hash verification with bcrypt (line 190+ of login/route.ts)
6. **Code review complete**: No bugs found in authentication paths

## Verification Steps (Run in Order)

### STEP 1: Verify User Created in Database ✅
```sql
-- Run this query in Supabase SQL Editor
SELECT 
  id,
  email,
  name,
  role,
  franchise_id,
  is_active,
  LENGTH(COALESCE(password_hash, '')) as hash_length,
  SUBSTRING(COALESCE(password_hash, ''), 1, 10) as hash_start,
  created_at
FROM users
WHERE email ILIKE 'franchise-admin@email.com'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Results:**
```
id          | email                    | name              | role            | franchise_id | is_active | hash_length | hash_start | created_at
------------|--------------------------|-------------------|-----------------|--------------|-----------|-------------|------------|----------
uuid-xxx    | franchise-admin@...      | Franchise Admin    | franchise_admin | uuid-yyy     | true      | 60          | $2b$10$... | 2024-01-15
```

**If you see something different:**
| Result | Problem | Solution |
|--------|---------|----------|
| 0 rows | User not created | Check staff creation response, try creating again |
| is_active = false | User marked inactive | Run UPDATE query below |
| hash_length = 0 | No password hash | Password not saved, try reset |
| hash_length < 50 | Invalid hash | Password format wrong, try reset |
| hash_start ≠ "$2b$" | Not bcrypt | Password format wrong, try reset |

**QUICK FIX if is_active = false**:
```sql
UPDATE users 
SET is_active = true 
WHERE email ILIKE 'franchise-admin@email.com';
```
Then try login again immediately.

---

### STEP 2: Check Environment Variables
```bash
# In terminal, at project root:
cat .env.local | grep -i supabase
```

**Expected output:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

**If missing or blank:**
- Get these from Supabase dashboard → Settings → API
- Add to `.env.local`
- Restart dev server

---

### STEP 3: Test Login Endpoint Directly
```bash
# Using curl (or Postman)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "franchise-admin@email.com",
    "password": "PASSWORD_USER_ENTERED"
  }' | jq '.'
```

**Expected success response (200)**:
```json
{
  "user": {
    "id": "uuid-...",
    "email": "franchise-admin@email.com",
    "name": "Franchise Admin",
    "role": "franchise_admin",
    "franchise_id": "uuid-...",
    "is_active": true
  },
  "session": { ... }
}
```

**If you get 401 "Invalid email or password"**:
- Database check failed (is_active=false or no hash)
- OR password hash doesn't match password sent
- OR email case mismatch

**Troubleshoot 401**:
```sql
-- Verify user exists and is active
SELECT email, is_active, password_hash 
FROM users 
WHERE email ILIKE 'franchise-admin@email.com';

-- Check exact email used
SELECT email FROM users WHERE email ILIKE 'franchise-admin%';
```

---

### STEP 4: Check Server Logs for Auth Errors
```bash
# Terminal 1: Start dev server (if not running)
npm run dev
# or
pnpm dev

# Terminal 2: Watch logs
tail -f .next/logs/server.log 2>/dev/null | grep -i "auth\|login\|fallback\|sync"

# Terminal 3: Trigger login attempt
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "franchise-admin@email.com", "password": "test"}'
```

**Look for messages like:**
- `[Staff API] Synced new staff member to Supabase Auth` → ✅ Sync succeeded
- `[Staff API] Could not sync to Supabase Auth` → ⚠️ Sync failed (ok, fallback will work)
- `[v0] Supabase Auth sign-in failed, attempting legacy auth fallback` → ✅ Primary failed, using backup
- `[v0] Invalid email or password` → ❌ Fallback failed too

---

### STEP 5: Check Supabase Auth Dashboard
1. Go to Supabase dashboard → Authentication → Users
2. Search for franchise admin email
3. Check:
   - ✅ User exists?
   - ✅ Email confirmed?
   - ⏰ Last sign in: when?

**If user not in Supabase Auth:**
- Sync failed during creation
- But fallback should create user during login
- If fallback also failed → Check logs from STEP 4

---

## DECISION TREE

```
Does franchise admin exist in database?
├─ NO → Staff creation failed, try again
└─ YES → Check is_active flag
    ├─ is_active = false → UPDATE to true, try login
    └─ is_active = true → Check password hash
        ├─ hash_length < 50 or not "$2b$" → Password format wrong
        │  └─ Super admin reset password for franchise admin
        └─ hash looks valid → Test login endpoint
            ├─ 401 error → Password mismatch or other issue
            │  └─ Have user try again with correct password
            └─ 200 success → ✅ LOGIN WORKS!
```

---

## If All Checks Pass But Still Can't Login

1. **Clear browser cache/cookies**:
   - Dev tools → Storage → Clear all
   - Then try login again

2. **Try incognito/private browser**:
   - Open private window
   - Try login fresh

3. **Restart dev server**:
   ```bash
   # Kill current server (Ctrl+C)
   npm run dev
   # or
   pnpm dev
   ```

4. **Check if database was modified**:
   - Another admin might have disabled user
   - Run STEP 1 query again

---

## Report Template

If you still need help, provide:

```
=== DATABASE CHECK ===
(Output of STEP 1 query)

=== LOGIN TEST ===
Email: franchise-admin@email.com
Password: [what you tried]
Response Code: [e.g., 401]
Error Message: [from curl/Postman]

=== SERVER LOGS ===
(Messages containing "auth" or "login" from around login attempt time)

=== ENVIRONMENT ===
NEXT_PUBLIC_SUPABASE_URL: [set? Y/N]
SUPABASE_SERVICE_ROLE_KEY: [set? Y/N]

=== SUPABASE AUTH ===
User exists in Supabase Auth: [Y/N]
Email confirmed: [Y/N]
```

---

## What NOT to Do

❌ Don't assume "it should work"
✅ Do run database query first

❌ Don't change code before verifying data
✅ Do verify user data is correct first

❌ Don't manually add users to Supabase Auth
✅ Do use the staff creation API

❌ Don't ignore error messages
✅ Do read server logs carefully

---

## Estimated Root Cause (Based on Code Review)

| Issue | Probability | Fix Time |
|-------|-------------|----------|
| User `is_active = false` | 40% | 30 seconds |
| Password hash invalid | 25% | 2 minutes |
| Not testing correct email | 15% | 1 minute |
| Environment var missing | 10% | 2 minutes |
| Browser cache | 5% | 1 minute |
| Unknown issue | 5% | 15+ minutes |

**Action**: Run STEP 1 database query immediately. This will reveal the actual problem.
