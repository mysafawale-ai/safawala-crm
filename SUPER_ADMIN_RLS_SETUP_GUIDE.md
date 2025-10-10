# 🚀 COMPLETE SETUP GUIDE - Super Admin RLS Fix

## 🎯 What We're Fixing
You're a super admin but can't see franchises or other data because RLS (Row Level Security) policies are blocking access. We need to:
1. ✅ Grant super admin full access to ALL tables
2. ✅ Make the app fetch a default franchise for super admin operations
3. ✅ Ensure data loads properly across the entire CRM

---

## 📋 STEP 1: Run RLS Policies Script

This will give super admin full access to ALL tables in the CRM.

### How to Run:
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy the entire content from: `scripts/SUPER_ADMIN_COMPLETE_RLS_POLICIES.sql`
4. Paste it in the SQL Editor
5. Click **RUN** (or press Cmd+Enter)

### What This Does:
- ✅ Removes old conflicting policies
- ✅ Creates `super_admin_full_access_*` policies for ALL tables:
  - franchises, users, user_profiles
  - customers, products, bookings, booking_items
  - invoices, expenses, expense_categories
  - staff, attendance, payroll
  - packages, services, product_items
  - distance_pricing, company_settings, branding_settings, banking_details
  - audit_logs, deliveries, laundry_bookings (if they exist)
- ✅ Also keeps franchise-specific policies for regular users
- ✅ Runs verification queries to confirm success

### Expected Output:
You should see:
```
✅ RLS policies created successfully for super admin!
```

And a table showing RLS is enabled on all tables with policies for super admin and franchise users.

---

## 📋 STEP 2: Verify Your Super Admin Role

Run this query in SQL Editor to confirm you're a super admin:

```sql
SELECT 
    email,
    role,
    franchise_id,
    created_at
FROM users 
WHERE id = auth.uid();
```

### Expected Result:
```
email          | role        | franchise_id | created_at
---------------|-------------|--------------|------------------
your@email.com | super_admin | (null or ID) | 2025-10-10 ...
```

**Important:** Your `role` MUST be `super_admin` (not `admin` or anything else).

### If Role is Wrong:
Run this to fix it:
```sql
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'your@email.com';
```

---

## 📋 STEP 3: Check if Franchises Exist

Run this to see if you have any franchises in the database:

```sql
SELECT 
    id,
    name,
    code,
    city,
    state,
    is_active,
    created_at
FROM franchises
ORDER BY created_at DESC
LIMIT 5;
```

### If NO Franchises Exist:
You need to create at least one franchise first! Run this:

```sql
INSERT INTO franchises (name, code, city, state, address, phone, email, owner_name, is_active)
VALUES 
    ('Mumbai Central', 'MUM001', 'Mumbai', 'Maharashtra', '123 Main Street, Mumbai', '+91 9876543210', 'mumbai@safawala.com', 'Rahul Sharma', true),
    ('Delhi North', 'DEL001', 'Delhi', 'Delhi', '456 Ring Road, Delhi', '+91 9876543211', 'delhi@safawala.com', 'Priya Singh', true);
```

---

## 📋 STEP 4: Test the Franchises Page

1. **Refresh your browser** (Cmd+R or Ctrl+R)
2. **Open Browser Console** (Cmd+Option+J or F12)
3. Go to `/franchises` page
4. Look for logs starting with `[Franchises]`

### What You Should See:
```
[Franchises] Starting to fetch franchises...
[Franchises] ✅ Raw franchise data: [{id: "...", name: "Mumbai Central", ...}]
[Franchises] Number of franchises: 2
[Franchises] ✅ Transformed franchises: [...]
```

### If Still Empty:
Share the console output with me. It will show the exact error.

---

## 📋 STEP 5: Test Profile Photo

The profile photo should now work because the API automatically fetects default franchise for super admin.

1. Refresh the page
2. Check console for logs starting with `[Sidebar]`
3. You should see your profile photo loaded

---

## 📋 STEP 6: Verify Other Pages Work

After running the RLS script, these pages should ALL work:

### Test These Pages:
- ✅ `/franchises` - Franchise management
- ✅ `/customers` - Customer list
- ✅ `/bookings` - Booking management
- ✅ `/products` - Product inventory
- ✅ `/invoices` - Invoice list
- ✅ `/expenses` - Expense tracking
- ✅ `/staff` - Staff management
- ✅ `/packages` - Package management
- ✅ `/settings` - All settings tabs

### If Any Page Shows "No Data":
1. Check browser console for errors
2. Run this query to verify RLS for that table:

```sql
-- Replace 'table_name' with customers, bookings, products, etc.
SELECT * FROM pg_policies 
WHERE tablename = 'table_name' 
AND policyname LIKE '%super_admin%';
```

---

## 🔧 TROUBLESHOOTING

### Issue: "No franchises found" after running RLS script
**Solution:** Make sure you have franchises in the database (Step 3)

### Issue: "Permission denied" errors in console
**Solution:** 
1. Verify your role is `super_admin` (Step 2)
2. Re-run the RLS script (Step 1)
3. Clear browser cache and refresh

### Issue: Profile photo not showing
**Solution:** 
1. The API now automatically fetches default franchise
2. Make sure you uploaded a profile photo in Settings → Profile
3. Check console logs for `[Sidebar]` messages

### Issue: Other pages still empty
**Solution:**
1. Run the RLS script (it covers ALL tables)
2. Make sure those tables have data
3. Check console for specific error messages

---

## 📝 WHAT WAS CHANGED

### Files Modified:
1. ✅ **SUPER_ADMIN_COMPLETE_RLS_POLICIES.sql** - Complete RLS policies for all tables
2. ✅ **lib/utils/franchise.ts** - Helper to get default franchise for super admin
3. ✅ **app/api/settings/profile/route.ts** - Auto-fetch default franchise
4. ✅ **app/franchises/page.tsx** - Better error logging

### How It Works Now:
1. **Super Admin Access:** You can now see ALL data across ALL franchises
2. **Default Franchise:** When no franchise_id is set, system uses first franchise
3. **Profile API:** Automatically handles super admin without franchise_id
4. **Error Logging:** Better console logs show exactly what's happening

---

## ✅ SUCCESS CHECKLIST

Run through this checklist:

- [ ] Ran `SUPER_ADMIN_COMPLETE_RLS_POLICIES.sql` in Supabase
- [ ] Verified role is `super_admin` in database
- [ ] Confirmed franchises exist in database
- [ ] Refreshed browser and checked console logs
- [ ] Franchises page shows data
- [ ] Profile photo appears in sidebar
- [ ] Can access customers, bookings, products pages
- [ ] Settings page works properly

---

## 🎉 AFTER COMPLETION

Once everything works:
1. You'll have full access to ALL data as super admin
2. Profile photo will load automatically
3. All CRM pages will display data
4. Banking, company settings, branding all working
5. Can manage franchises, users, and all resources

---

## 📞 NEED HELP?

If you encounter any issues:
1. Share the **exact error message** from browser console
2. Share the **output** from running the RLS verification queries
3. Tell me which **specific page** is not working

I'll help you debug and fix it! 🚀
