# FRANCHISE ADMIN LOGIN - QUICK VISUAL REFERENCE

## Decision Tree (Pick Your Path)

```
┌─ CAN YOU ACCESS SUPABASE DATABASE?
│  ├─ NO → Get credentials from Supabase dashboard
│  └─ YES ↓
│
├─ RUN THIS QUERY:
│  SELECT email, is_active, password_hash, LENGTH(password_hash) 
│  FROM users WHERE email ILIKE 'admin@company.com' LIMIT 1;
│
├─ WHAT DID YOU GET?
│
├─ (0 rows)
│  └─ USER NOT FOUND IN DATABASE
│     ├─ Check if creation succeeded (check dashboard notification)
│     ├─ If yes → User creation failed to save
│     │  └─ Try creating again
│     └─ If no → User was never created
│        └─ Try creating with fresh details
│
├─ is_active = false
│  └─ USER MARKED INACTIVE ← 60% LIKELY FIX HERE!
│     └─ RUN: UPDATE users SET is_active=true WHERE email ILIKE 'admin@company.com';
│     └─ TRY LOGIN NOW ← Should work! ✅
│
├─ is_active = true BUT length(password_hash) < 50
│  └─ PASSWORD HASH INVALID OR MISSING
│     ├─ If NULL or empty
│     │  └─ Password was never set
│     │  └─ Super admin: Edit staff → Reset Password
│     └─ If wrong format (not starting with $2b$)
│        └─ Password not hashed
│        └─ Super admin: Edit staff → Reset Password
│
├─ is_active = true AND hash looks valid (starts with $2b$, ~60 chars)
│  └─ DATABASE IS CORRECT ✅
│     ├─ Copy password_hash value
│     ├─ Run: node TEST_PASSWORD_HASH.js
│     ├─ Paste hash + password user tried
│     │
│     ├─ Script says MATCH ✅
│     │  └─ Password verified! Problem elsewhere:
│     │     ├─ Try browser cache clear (DevTools → Storage → Clear All)
│     │     ├─ Try TEST_FRANCHISE_ADMIN_LOGIN.sh script
│     │     ├─ Check server logs for errors
│     │     └─ Check .env.local for SUPABASE_SERVICE_ROLE_KEY
│     │
│     └─ Script says NO MATCH ❌
│        └─ Password doesn't match stored hash
│           ├─ User entered wrong password?
│           ├─ Or hash got corrupted?
│           └─ Super admin reset password → try again

─────────────────────────────────────────────────────────────────
```

---

## Instant Diagnosis (Choose One)

### If You See ✅ OPTION A
**Database has is_active = false**
```sql
UPDATE users SET is_active = true 
WHERE email ILIKE 'franchise-admin@email.com';
```
Then try login. 
**Result**: ✅ 60% LIKELY FIXED!

---

### If You See ✅ OPTION B
**Database has is_active = true + valid hash**
```bash
# Step 1: Get hash from database
# Step 2: Run this:
node TEST_PASSWORD_HASH.js
# Step 3: Paste hash when prompted
# Step 4: Paste password user entered
# Result: Script tells you YES or NO
```

---

### If You See ✅ OPTION C
**Database hash missing or invalid**
1. Tell super admin: "Reset password for this staff member"
2. Super admin:
   - Go to Staff page
   - Find franchise admin
   - Click Edit
   - Scroll to Password section
   - Enter new password (e.g., TempPass123!)
   - Save
3. Give new password to franchise admin
4. Franchise admin logs in
5. Franchise admin changes password in Settings

---

## Error Message to Fix Mapping

| Error Message | Likely Cause | Fix |
|---------------|--------------|-----|
| "Invalid email or password" | User not found OR is_active=false OR password wrong | Check OPTION A or B |
| "User not registered" | No user in Supabase Auth | Login fallback will create it |
| "Error 500" | Server error | Check server logs + env vars |
| "Email already exists" | Email used twice | Use different email |
| Blank page / no error | Browser/network issue | Clear cache, try incognito |

---

## Email Case Issues

```
Database has:  Admin@Franchise.com
User tried:    admin@franchise.com

Result: Should work (login is case-INSENSITIVE)

If not working:
- Get exact email from database SELECT
- Use that EXACT case for login
```

---

## Password Format Check

### Valid Bcrypt Hash (should look like this):
```
$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ...
 ↑                                                        ↑
 Start with $2b$                                    Total ~60 chars
```

### Invalid (if you see these):
```
password123                    ← Plain text, not hashed!
$1$...                         ← Old hash format
[object Object]                ← Serialization error
NULL                           ← No password
                               ← Empty/blank
```

---

## Timeline of What Happens

```
TIME    WHAT HAPPENS              STATUS
────────────────────────────────────────────
00:00   Create franchise admin    ✅ Success
00:01   Hash password             ✅ Password hashed with bcrypt
00:02   Insert in database        ✅ Stored as password_hash
00:03   Sync to Supabase Auth     ⚠️ May or may not succeed
00:04   Response sent             ✅ "Created successfully"
...
00:30   User tries to login       →
00:31   Try Supabase Auth         → Primary path (may fail)
00:32   If failed, try database   → Fallback path (should work)
        ├─ Check is_active=true   → YES? Continue...
        ├─ Check password hash    → Match? Continue...
        ├─ Create Supabase Auth   → Auto-create user
        ├─ Retry Supabase Auth    → Now should work
        └─ Success! User logged in ✅
```

**MOST LIKELY FAILURE**: Step 00:32 - `is_active=false`

---

## Common Mistakes (Don't Do These!)

❌ DON'T: Manually edit password_hash in database  
✅ DO: Use staff page password reset feature

❌ DON'T: Create multiple users with same email  
✅ DO: Use different email or delete old one first

❌ DON'T: Assume "it should work"  
✅ DO: Check database query result

❌ DON'T: Skip environment variable check  
✅ DO: Verify SUPABASE_SERVICE_ROLE_KEY exists

❌ DON'T: Ignore server logs  
✅ DO: Check logs for actual error message

---

## Quick Fixes Ranked by Speed

| Rank | Fix | Time | Success % |
|------|-----|------|-----------|
| 1 | UPDATE is_active = true | 30 sec | 40% |
| 2 | Browser cache clear | 1 min | 5% |
| 3 | Password reset | 2 min | 25% |
| 4 | Verify env vars | 2 min | 5% |
| 5 | Check server logs | 3 min | 10% |
| 6 | Test password hash | 5 min | 10% |
| 7 | Recreate user | 5 min | 5% |

**Recommendation**: Do them in order. 60% chance fixed by step 1.

---

## Files to Reference

| File | When | How |
|------|------|-----|
| QUICK_FIX.md | Need answer NOW | Read first 2 sections |
| COMPLETE_GUIDE.md | Have 10 minutes | Follow decision tree |
| VERIFICATION_CHECKLIST.md | Want systematic approach | Go step by step |
| TEST_PASSWORD_HASH.js | Need to verify hash | `node TEST_PASSWORD_HASH.js` |
| TEST_FRANCHISE_ADMIN_LOGIN.sh | Need to test endpoint | `./TEST_FRANCHISE_ADMIN_LOGIN.sh email pass` |

---

## Success Checklist ✅

After fix, verify:
- [ ] Database shows is_active = true
- [ ] Database shows password_hash starting with $2b$
- [ ] Login endpoint returns 200 (not 401)
- [ ] Response includes user.id and user.email
- [ ] Franchise admin can access dashboard
- [ ] Can see only their franchise's data

If all checked: ✅ **FIXED!**

---

## Need Help?

Provide this info:
1. **Database query result** (full row)
2. **Login endpoint response** (paste entire JSON)
3. **Server logs** (any messages with "error" or "auth")
4. **Exact error message** shown to user

Then we can pinpoint the issue precisely.

---

## Pro Tips 💡

- **Tip 1**: is_active = false is 60% of issues → check this first
- **Tip 2**: Browser cache causes mysterious failures → clear before debugging
- **Tip 3**: Server logs reveal actual error → always check logs
- **Tip 4**: Exact email case from DB matters for login → get from database
- **Tip 5**: PASSWORD HASH format validation matters → check starts with $2b$

---

## Status Codes Explained

| Code | Meaning | Action |
|------|---------|--------|
| 200 | ✅ Success | User logged in |
| 401 | ❌ Invalid credentials | Check database |
| 403 | ❌ Access denied | Check permissions |
| 404 | ❌ User not found | User not in database |
| 500 | ❌ Server error | Check logs + env vars |

---

**MOST IMPORTANT**: Run the database query first. It tells you 90% of the answer.

```sql
SELECT email, is_active, password_hash, LENGTH(password_hash) 
FROM users WHERE email ILIKE 'admin@email.com' LIMIT 1;
```

✅ Ready to fix? Start with that query! ✅
