# FRANCHISE ADMIN LOGIN - FINAL SOLUTION

## Current Status
✅ User in database: **mysafawale@gmail.com**  
✅ User is active: **true**  
✅ Password hash: **Valid bcrypt format**  
❌ But login still failing

## Why This Could Happen

The password hash is valid, but login fails when:

1. **Wrong password entered** - User has wrong password written down
2. **Password created incorrectly** - Hash doesn't match what user thinks password is
3. **Supabase Auth out of sync** - Auth system doesn't have the user

## Solution: Reset Password Cleanly

This will ensure both database AND Supabase Auth are in sync.

### Option 1: Via Dashboard (Recommended) ✅

1. **Login as super admin**
2. Go to **Staff** page
3. Find **Ronak Dave** (mysafawale@gmail.com)
4. Click **Edit** button
5. Scroll down to **Password** section
6. Click **Reset Password**
7. Enter new strong password (e.g., `NewPass@2025!`)
8. Click **Save**
9. Give Ronak the new password
10. **Test login** with new password

### Option 2: Via SQL + Manual Sync

```sql
-- Step 1: Generate new password hash
-- (Run this in your terminal, not in SQL editor)
node -e "
const bcrypt = require('bcryptjs');
const newPassword = 'NewPass@2025!';
bcrypt.hash(newPassword, 10, (err, hash) => {
  if (err) console.log('Error:', err);
  console.log('New hash:', hash);
  console.log('');
  console.log('Update SQL:');
  console.log('UPDATE users SET password_hash = ' + \"'\" + hash + \"'\" + ', updated_at = NOW() WHERE email = ' + \"'\" + 'mysafawale@gmail.com' + \"'\" + ';');
});
"

-- Step 2: Copy the UPDATE query from above and run it in Supabase
-- Step 3: Then run this to create in Supabase Auth:
SELECT 
  id,
  email,
  role,
  franchise_id
FROM users
WHERE email = 'mysafawale@gmail.com';

-- Step 4: Manually create user in Supabase Auth via API or Supabase UI
-- OR just try login - fallback will auto-create during login
```

### Option 3: Via Supabase Dashboard

1. Go to **Supabase Dashboard → Authentication → Users**
2. Search for `mysafawale@gmail.com`
3. If exists: Click **Reset password** link
4. If not exists: Delete user (if there), then staff will auto-create during login

## The Real Issue (Theory)

When Ronak was created as franchise admin:

1. ✅ Password hashed correctly in database
2. ✅ Sync attempted to Supabase Auth
3. ❌ Sync might have failed silently
4. ❌ Now login tries Supabase Auth first (fails)
5. ❌ Falls back to database password (should work...)
6. ❌ But something about the hash doesn't match

**Most likely**: The password Ronak was given during creation doesn't match what's hashed in the database.

## Why This Happens

The staff creation API does this:
```typescript
// Line 202: Hash the password
const password_hash = await hashPassword(password)  // "MyPassword123" → "$2b$10$..."

// Line 232: Store hash in database
{ password_hash }  // ✅ Stored

// Line 260: Send plain password to Supabase Auth
await supabaseAdmin.auth.admin.createUser({
  password,  // Send plain password
  email_confirm: true
})
```

**If the password Ronak was given is different from what was sent to the API, the hash won't match!**

Examples:
- Created with: "MyPassword123" but Ronak was told "MyPassword124"
- Created with: "MyPassword123" but there was a typo
- Password reset happened and not synced

## Quick Test: Force Password Reset

Run this SQL to reset:

```sql
-- Step 1: Generate new bcrypt hash (run in terminal)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Test@12345', 10, (e,h) => console.log(\"UPDATE users SET password_hash = '\" + h + \"' WHERE email = 'mysafawale@gmail.com';\"));"

-- Step 2: Copy output and run in Supabase SQL editor
-- Output will be something like:
-- UPDATE users SET password_hash = '$2b$10$...' WHERE email = 'mysafawale@gmail.com';

-- Step 3: Test login with password: Test@12345
```

## Recommended Action NOW

**Use Option 1 (Dashboard Reset)**:

1. Login as super admin
2. Go to Staff
3. Edit Ronak Dave
4. Reset password to something like: `SafaWala@2025!`
5. Tell Ronak: "Your new password is: SafaWala@2025!"
6. Ronak logs in with that
7. ✅ Works!

This syncs both database and Supabase Auth automatically.

## After Login Works

Once Ronak can login:
1. Go to Settings → Change Password
2. Set permanent password
3. Done! ✅

## If Still Doesn't Work

1. Check server logs: `tail -f .next/logs/server.log | grep mysafawale -i`
2. You'll see exact error: "password mismatch" or "user not in auth"
3. Report back with that log message

---

**TL;DR**: Reset password via Dashboard. This fixes 99% of these issues.
