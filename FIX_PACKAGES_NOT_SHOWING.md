# 🔧 FIX: Packages Not Showing for Franchise Admin

## 🚨 ROOT CAUSE

Your user likely has **OLD 15 permissions** instead of **NEW 22 permissions**.

The `packages` permission was added as part of the 22-permission system, but your database still has the old permission structure.

---

## ✅ QUICK FIX (2 Steps)

### Step 1: Clear Browser Cache
```javascript
// Open Browser Console (F12) and run:
localStorage.clear()
sessionStorage.clear()
```

### Step 2: Run SQL in Supabase
```sql
-- Fix your specific user
UPDATE users 
SET permissions = jsonb_set(
  COALESCE(permissions, '{}'::jsonb),
  '{packages}',
  'true'::jsonb
),
updated_at = NOW()
WHERE email = 'surat@safawala.com'; -- Replace with your email
```

### Step 3: Re-login
1. Logout from the app
2. Login again
3. Check if "Packages" appears in sidebar

---

## 🔍 VERIFY YOUR PERMISSIONS

Run this SQL to check your current permissions:

```sql
-- Check your user
SELECT 
  email,
  role,
  permissions,
  (SELECT COUNT(*) FROM jsonb_object_keys(permissions)) as permission_count
FROM users
WHERE email = 'surat@safawala.com'; -- Your email
```

**Expected Results:**
- `permission_count` should be **22** (not 15)
- `permissions->>'packages'` should be **true**

**If permission_count = 15:**
You have old permissions! Run the full migration.

---

## 🚀 FULL MIGRATION (If Quick Fix Doesn't Work)

If you still have only 15 permissions, run the complete migration:

### Run Migration Script
```sql
-- In Supabase SQL Editor, run:
-- Copy/paste contents of: scripts/MIGRATE_TO_22_PERMISSIONS.sql
```

This will convert ALL users from 15 old permissions → 22 new permissions.

**Mapping:**
- `inventory` (old) → `inventory` + `packages` + `productArchive` (new)

---

## 🎯 FRANCHISE ADMIN DEFAULT PERMISSIONS

Franchise admins should have these **20 enabled** by default:

### Main Navigation (6)
- ✅ dashboard
- ✅ bookings  
- ✅ customers
- ✅ inventory
- ✅ **packages** ← THIS ONE!
- ✅ vendors

### Business Operations (8)
- ✅ quotes
- ✅ invoices
- ✅ laundry
- ✅ expenses
- ✅ deliveries
- ✅ productArchive
- ✅ payroll
- ✅ attendance

### Analytics (2)
- ✅ reports
- ✅ financials

### Administration (4)
- ❌ franchises (super_admin only)
- ✅ staff
- ❌ integrations (super_admin only)
- ✅ settings

---

## 🐛 DEBUGGING

### Check localStorage
```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('safawala_user'));
console.log('Packages permission:', user?.permissions?.packages);
console.log('All permissions:', user?.permissions);
console.log('Permission count:', Object.keys(user?.permissions || {}).length);
```

**Expected:**
- `packages: true`
- Permission count: `22`

### Check Sidebar Filter
```javascript
// Check if sidebar is filtering correctly
console.log('User role:', user?.role);
console.log('Has packages?', user?.permissions?.packages);
```

---

## 📋 CHECKLIST

- [ ] Run SQL to set `packages: true` for your user
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Logout and re-login
- [ ] Check sidebar - "Packages" should appear under Main section
- [ ] Try accessing `/sets` page directly
- [ ] If still missing, run full migration script

---

## 🎯 EXPECTED RESULT

After fixing, your sidebar should show:

```
Main:
  Dashboard
  Bookings
  Customers
  Inventory
  Packages      ← Should appear here!
  Vendors

Business:
  Quotes
  Invoices
  ...
```

And you should be able to access `/sets` page.
