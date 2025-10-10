# IMMEDIATE FIX FOR FRANCHISE DATA ISOLATION

## THE PROBLEM
You created a new franchise and staff, but they see data from other franchises. This is because:
1. RLS (Row Level Security) policies aren't enforced yet in Supabase
2. Client-side queries don't filter by franchise_id
3. No automatic franchise_id injection on inserts

## THE SOLUTION (3 STEPS - RUN NOW)

### STEP 1: Run RLS Policy Script in Supabase (CRITICAL - DO THIS FIRST)

1. Open Supabase Dashboard → SQL Editor
2. Copy/paste the entire contents of `/Applications/safawala-crm/scripts/IMMEDIATE_RLS_FIX.sql`
3. Click "Run" 
4. Wait for "✅ RLS POLICIES APPLIED SUCCESSFULLY" message

**This will:**
- Enable RLS on all tenant tables (customers, products, bookings, etc.)
- Drop overly permissive "Enable all" policies
- Create strict franchise-scoped policies
- Ensure each franchise admin sees ONLY their own data

### STEP 2: Log Out and Log Back In

1. Log out from all franchise admin accounts
2. Log back in as each franchise admin
3. Verify localStorage contains `franchise_id` in the user object

**Check by running in browser console:**
```javascript
const user = JSON.parse(localStorage.getItem('safawala_user'))
console.log('Franchise ID:', user.franchise_id)
console.log('Role:', user.role)
```

### STEP 3: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
pnpm dev
```

## VERIFICATION

After completing all 3 steps, verify isolation:

### Test 1: Different Franchise Admins See Different Data
1. Log in as Franchise A admin
2. Note customer count, bookings, products
3. Log out
4. Log in as Franchise B admin
5. Should see ZERO customers, bookings, products (clean slate)

### Test 2: New Data Stays Isolated
1. As Franchise B admin, create a new customer
2. Log out
3. Log in as Franchise A admin
4. The new customer should NOT appear

### Test 3: Super Admin Sees All
1. Log in as super_admin
2. Should see data from ALL franchises

## WHAT WAS CHANGED

### Database (Supabase)
- `scripts/IMMEDIATE_RLS_FIX.sql` - Complete RLS policy enforcement

### Backend
- `/app/api/auth/login/route.ts` - Now includes `franchise_code` in user response

### Frontend Helpers
- `/lib/franchise-supabase.ts` - NEW: Auto-filtering helper for franchise-scoped queries
- `/lib/supabase-service.ts` - Added enforcement comment for franchise filtering

## IF IT STILL SHOWS MIXED DATA

### Quick Debug Checklist:
1. ✅ Did you run `IMMEDIATE_RLS_FIX.sql` in Supabase?
2. ✅ Did you log out and log back in?
3. ✅ Does `localStorage.getItem('safawala_user')` contain `franchise_id`?
4. ✅ Did you restart dev server?

### Still Not Working?
Run this query in Supabase SQL Editor to verify RLS is active:

```sql
SELECT 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies WHERE polrelid = c.oid) as policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND tablename IN ('customers', 'products', 'bookings', 'users')
ORDER BY tablename;
```

Expected output: All tables should have `rls_enabled = true` and `policy_count > 0`.

## NEXT STEPS (OPTIONAL BUT RECOMMENDED)

### Migrate to Supabase Auth (Long-term Solution)
The current setup uses localStorage + custom login. For production:
1. Migrate to Supabase Auth sessions
2. Store franchise_id in user metadata
3. RLS will then enforce automatically on server-side

I can help with this migration next if needed.

## SUPPORT

If you still see data mixing after Step 3:
1. Share the output of the verification SQL query above
2. Check browser console for any errors
3. Confirm which Supabase project you're using (dev vs prod)
