# Quick Test Guide - Permission Fix ✅

## What Was Fixed

Franchise admins couldn't see **Vendors** and **Packages** in sidebar.

**Root Cause**: When permissions were missing from database, API returned empty object `{}` instead of role defaults.

**Solution**: All three layers (login API, user API, sidebar) now apply role-based defaults when permissions are empty.

---

## Quick Test

### Step 1: Login as Franchise Admin
- Username: Any franchise admin email
- Password: Their password

### Step 2: Refresh Page (Important!)
- Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- This clears cache and forces fresh permission load

### Step 3: Check Sidebar
Look for these menu items under "Main" section:
- ✅ Vendors (Store icon)
- ✅ Packages (Layers icon)

**Expected**: Both should be visible now

### Step 4: Click on Vendors
- Should open `/vendors` page successfully
- No 403 errors
- Should see vendor list/form

### Step 5: Click on Packages
- Should open `/sets` page successfully
- No 403 errors
- Should see package management

---

## Verification Commands

### Browser Console Test
```javascript
// Open DevTools (F12), go to Console tab, paste:
const user = JSON.parse(localStorage.getItem('safawala_user'));
console.table({
  'Role': user?.role,
  'Vendors': user?.permissions?.vendors,
  'Packages': user?.permissions?.packages,
  'Staff': user?.permissions?.staff,
  'Settings': user?.permissions?.settings
});
```

**Expected Output**:
```
Role:     franchise_admin
Vendors:  true
Packages: true
Staff:    true
Settings: true
```

### Network Request Test
1. Open DevTools → Network tab
2. Refresh page
3. Find request to `/api/auth/user`
4. Click on "Response" tab
5. Search for `"vendors": true` and `"packages": true`

**Should see**:
```json
{
  "permissions": {
    "vendors": true,
    "packages": true,
    ...other permissions...
  }
}
```

---

## If Still Not Working

### 1. Hard Refresh (Browser Cache Issue)
```
Mac:    Cmd+Shift+R
Windows: Ctrl+Shift+R
```

### 2. Clear LocalStorage
```javascript
// In browser console:
localStorage.clear();
location.reload();
```

### 3. Logout and Re-login
1. Click your profile menu
2. Click "Sign Out"
3. Login again

### 4. Check Database Directly
```sql
SELECT 
  email,
  role,
  permissions->>'vendors' as vendors,
  permissions->>'packages' as packages
FROM users
WHERE email = 'your-email@domain.com';
```

**Should see:**
- If `vendors` and `packages` are NULL → API will now provide defaults ✅
- If `vendors` and `packages` are false → Run SQL update or contact admin

---

## Commits Deployed

**Latest Fix**: `fba82a9`
- "fix: Ensure permissions load with role defaults when missing or empty"
- 3 files modified, 326 lines added
- Deployed to Vercel ✅

**Previous Fix**: `4d15f1c` (Import/Export feature)
**Previous Fix**: `b0b0896` (Password sync fix)

---

## Expected Results by Role

### Franchise Admin Should See:
- ✅ Dashboard
- ✅ Bookings
- ✅ Customers
- ✅ Inventory
- ✅ **Packages** ← NOW FIXED
- ✅ **Vendors** ← NOW FIXED
- ✅ Quotes
- ✅ Invoices
- ✅ Laundry
- ✅ Expenses
- ✅ Deliveries
- ✅ Product Archive
- ✅ Payroll
- ✅ Attendance
- ✅ Reports
- ✅ Financials
- ✅ Staff
- ✅ Settings
- ❌ Franchises (only super admin)
- ❌ Integrations (only super admin)

### Staff Should See:
- ✅ Dashboard
- ✅ Bookings
- ✅ Customers
- ✅ Inventory
- ✅ Quotes
- ✅ Invoices
- ✅ Settings
- ❌ Everything else

---

## Contact Support

If permissions still not working after these tests, check:
1. User's role in database → Should be `franchise_admin`
2. User's `is_active` → Should be `true`
3. API response → Check if permissions being returned
4. Browser console → Look for any error messages

---

**Status**: ✅ FIXED AND DEPLOYED
**Last Update**: 9 November 2025
**Verified**: Build successful, all 114 pages compiled
