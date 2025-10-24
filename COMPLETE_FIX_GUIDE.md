# Complete Fix Guide: Franchise Owner Packages Permissions

## Issue
Franchise owners getting 401 errors when trying to create package categories.

## Root Causes
1. **Missing Supabase Auth Session** - Client not properly authenticated
2. **RLS Policies** - Row Level Security blocking INSERT operations
3. **Multiple Supabase Client Instances** - Auth token not shared

## ✅ Solution Applied

### 1. Fixed Supabase Client Authentication
**Files Modified:**
- `lib/supabase/client.ts` - Added singleton pattern + proper auth config
- `lib/auth.ts` - Added `setSession()` call after login
- `app/api/auth/login/route.ts` - Returns session tokens to client

**What it does:**
- Returns access_token and refresh_token from login API
- Manually sets session in Supabase client after login
- Uses singleton to prevent multiple client instances

### 2. Fixed RLS Policies
**SQL Scripts Created:**
- `SAFE_GRANT_FRANCHISE_OWNERS_PACKAGES.sql` - Main fix (safe, checks table existence)
- `GRANT_FRANCHISE_OWNERS_PACKAGES_PERMISSIONS.sql` - Full version
- `DIAGNOSTIC_AUTH_AND_PERMISSIONS.sql` - Verification script

**What it does:**
- Grants `franchise_admin` and `franchise_owner` roles INSERT/UPDATE/DELETE permissions
- Maintains franchise isolation where applicable
- Allows viewing of global categories (franchise_id IS NULL)

## 🚀 Steps to Fix (Run in Order)

### Step 1: Run Diagnostic
```sql
-- In Supabase SQL Editor, run:
-- DIAGNOSTIC_AUTH_AND_PERMISSIONS.sql
```
This shows your current auth status and permissions.

### Step 2: Apply Permissions Fix
```sql
-- In Supabase SQL Editor, run:
-- SAFE_GRANT_FRANCHISE_OWNERS_PACKAGES.sql
```
This updates RLS policies to allow franchise owners to create categories.

### Step 3: Clear Browser & Re-Login
1. **Open DevTools** (F12)
2. **Application Tab** → Click "Clear site data"
3. **Log out** from the app completely
4. **Close all tabs** with the app
5. **Open fresh tab** and log back in as: `surat@safawala.com`

### Step 4: Verify Session
Open browser console and run:
```javascript
// Check if session exists
localStorage.getItem('sb-xplnyaxkusvuajtmorss-auth-token')
```
Should return a JSON object with `access_token`.

### Step 5: Test Category Creation
1. Navigate to **Sets** page
2. Click **"Create Category"** button
3. Fill in category name and description
4. Click **Save**
5. Check console for: `[v0] Category created successfully`

## 🔍 Troubleshooting

### Still Getting 401 Errors?
Run this in browser console:
```javascript
// Check Supabase client auth
const supabase = window.supabase || createClient()
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)
```

If session is `null`:
1. The login didn't properly set the session
2. Try logging out and back in again
3. Check Network tab for `/api/auth/login` response - should include `session` object

### Multiple GoTrueClient Warning?
This is normal but not ideal. The singleton pattern in `lib/supabase/client.ts` will prevent issues.

### "No franchise associated with your account"?
Check your user record:
```sql
SELECT id, email, role, franchise_id FROM users WHERE email = 'surat@safawala.com';
```
If `franchise_id` is NULL, you need to assign a franchise.

## 📊 What Changed

### Before
```typescript
// lib/supabase/client.ts
export function createClient() {
  return createSupabaseClient(url, key) // New instance every call
}
```

### After
```typescript
let supabaseInstance: SupabaseClient | null = null

export function createClient() {
  if (supabaseInstance) return supabaseInstance // Reuse instance
  
  supabaseInstance = createSupabaseClient(url, key, {
    auth: {
      persistSession: true,
      storageKey: 'sb-xplnyaxkusvuajtmorss-auth-token',
      autoRefreshToken: true
    }
  })
  return supabaseInstance
}
```

### RLS Policies Before
```sql
-- Too restrictive or missing
CREATE POLICY "Allow insert for authenticated users" 
ON packages_categories
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- ❌ Doesn't check user role from users table
```

### RLS Policies After
```sql
-- Properly checks user role
CREATE POLICY "packages_categories_insert" 
ON packages_categories
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('franchise_admin', 'franchise_owner', 'super_admin')
  )
);
-- ✅ Checks actual role from users table
```

## ✅ Success Criteria

You'll know it's working when:
1. ✅ No 401 errors in Network tab
2. ✅ Console shows: `[v0] Category created successfully`
3. ✅ Category appears in the list immediately
4. ✅ No "Multiple GoTrueClient" warnings (or just one warning)
5. ✅ `localStorage.getItem('sb-xplnyaxkusvuajtmorss-auth-token')` returns session

## 📝 Next Steps (Optional)

### Add Franchise Isolation to Distance Pricing
If you need franchise-specific distance pricing:
```sql
ALTER TABLE distance_pricing 
ADD COLUMN franchise_id UUID REFERENCES franchises(id);

-- Update policies to filter by franchise_id
```

### Add Audit Logging
Track who creates/modifies categories:
```sql
ALTER TABLE packages_categories 
ADD COLUMN created_by UUID REFERENCES users(id),
ADD COLUMN updated_by UUID REFERENCES users(id);
```

## 🆘 If All Else Fails

**Nuclear Option** - Super permissive policies (testing only):
```sql
DROP POLICY IF EXISTS "packages_categories_insert" ON packages_categories;
CREATE POLICY "temp_allow_all" ON packages_categories 
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

If this works, the issue is with the policy logic. If it doesn't work, the issue is with authentication.
