# 🔍 Direct Sales RLS Error - Diagnostic Guide

## Error Message
```
Error: new row violates row-level security policy for table "direct_sales_orders"
```

## Root Cause
The `direct_sales_orders` table does **NOT exist** in your Supabase database, or the RLS policies are not configured correctly.

---

## Check 1: Verify Tables Exist

Run this query in Supabase SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'direct_%';
```

**Expected Result**: Should show `direct_sales_orders` and `direct_sales_items`

**If Empty**: Tables don't exist → Go to **Solution 1** below

---

## Check 2: Verify RLS is Enabled

If tables exist, run:
```sql
SELECT 
  t.tablename,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE tablename IN ('direct_sales_orders', 'direct_sales_items')
AND schemaname = 'public';
```

**Expected Result**: Should show policy_count > 0 for both tables

**If policy_count = 0**: RLS policies aren't created → Go to **Solution 2** below

---

## Check 3: Verify User Franchise Assignment

Run this query (replace with your user ID):
```sql
SELECT id, email, role, franchise_id 
FROM users 
WHERE id = 'YOUR_USER_ID';
```

**Expected Result**: Should show your user with `role` and `franchise_id` filled

**If franchise_id is NULL**: User not assigned to franchise → Go to **Solution 3** below

---

## Check 4: Test RLS Policy Manually

As a test, run this query in Supabase SQL Editor:
```sql
-- Check if the RLS policy allows your user
SELECT 
  u.id, 
  u.email, 
  u.role,
  u.franchise_id,
  'Can INSERT to direct_sales_orders' as can_insert
FROM users u
WHERE u.id = auth.uid()
  AND (u.role = 'super_admin' OR u.franchise_id IS NOT NULL);
```

**Expected Result**: Should return 1 row showing your user

**If Empty**: RLS policy is rejecting the user → Check franchise_id assignment

---

## Solution 1: Execute Migration (PRIMARY FIX)

### Option A: Direct Execution in Supabase Console

1. **Open**: https://app.supabase.com → Your Project → **SQL Editor**
2. **Click**: "+ New Query"
3. **Paste**: The complete SQL from `/Applications/safawala-crm/sql/ADD_DIRECT_SALES_TABLES.sql`
4. **Click**: "▶️ Run"

### Option B: Split Execution (If Single Query Fails)

If the full SQL fails, execute it in sections:

**Section 1: Create Tables**
```sql
-- Copy lines 15-122 from ADD_DIRECT_SALES_TABLES.sql
-- (Table creation and indexes)
```

**Section 2: Enable RLS & Create Policies**
```sql
-- Copy lines 123-256 from ADD_DIRECT_SALES_TABLES.sql
-- (RLS policies)
```

**Section 3: Grants & Views**
```sql
-- Copy lines 257-330 from ADD_DIRECT_SALES_TABLES.sql
-- (Grants and backward compatibility view)
```

---

## Solution 2: Fix RLS Policies

If tables exist but policies are missing, run:

```sql
-- Re-enable RLS
ALTER TABLE direct_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_sales_items ENABLE ROW LEVEL SECURITY;

-- Re-create policies
DROP POLICY IF EXISTS "dso_insert_franchise" ON direct_sales_orders;

CREATE POLICY "dso_insert_franchise" ON direct_sales_orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (u.role = 'super_admin' OR u.franchise_id = direct_sales_orders.franchise_id)
    )
  );

GRANT INSERT ON direct_sales_orders TO authenticated;
```

---

## Solution 3: Assign User to Franchise

If your user doesn't have a franchise assigned:

```sql
UPDATE users
SET franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'  -- Replace with your franchise_id
WHERE id = 'YOUR_USER_ID';  -- Replace with your user ID
```

To find your franchise_id, run:
```sql
SELECT id, name FROM franchises LIMIT 1;
```

To find your user_id, run:
```sql
SELECT id, email FROM users WHERE email = 'your-email@example.com';
```

---

## Solution 4: Temporarily Disable RLS (Development Only)

⚠️ **NOT for production** - Only for testing:

```sql
ALTER TABLE direct_sales_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE direct_sales_items DISABLE ROW LEVEL SECURITY;
```

Then test your app. If it works, the issue is RLS. Re-enable with:
```sql
ALTER TABLE direct_sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_sales_items ENABLE ROW LEVEL SECURITY;
```

---

## Next Steps

1. **Run Check 1** to verify tables exist
2. **If tables exist**, run Check 2 to verify RLS policies
3. **If policies exist**, run Check 3 to verify user franchise assignment
4. **If all pass**, run Check 4 for manual RLS test
5. **Apply appropriate solution** from above
6. **Test in app**: Create a direct sale order
7. **Should see**: ✅ "Direct sale created successfully"

---

## Quick Command Reference

```bash
# SSH into your machine and run:
psql postgresql://user:password@db.supabase.co:5432/postgres

# Then in psql:
\d direct_sales_orders  # Check if table exists
\dp direct_sales_orders  # Check if policies exist
```

---

## Still Having Issues?

1. **Check browser console** (F12 → Console tab) for detailed error
2. **Check Supabase logs**: SQL Editor → "Logs" tab
3. **Verify user is logged in**: App should show your name in top-right
4. **Clear browser cache**: Cmd+Shift+Delete → Clear all
5. **Restart dev server**: Stop (`Ctrl+C`), then `pnpm dev`

---

**Status**: Awaiting migration execution. Once migration runs, direct sales feature will be fully functional. ✅
