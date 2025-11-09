# Permission Settings Fix - Franchise Admins Can't See Vendors

## Problem
Franchise admins are unable to see the **Vendors** menu item and potentially other modules like **Packages** in the sidebar, even though they should have access to these features.

## Root Cause Analysis

### The Permission System Architecture
The app has a two-layer permission system:

1. **Default Permissions (in code)**: `lib/auth-middleware.ts` defines default permissions for each role
2. **Database Permissions (in DB)**: `users.permissions` column stores per-user permission overrides

### The Bug
The `ensurePermissions()` function in `auth-middleware.ts` has this logic:

```typescript
function ensurePermissions(permissions: any, role: AppRole): UserPermissions {
  // If user has explicit permissions in DB, use those (don't override with defaults)
  if (permissions && typeof permissions === 'object' && Object.keys(permissions).length > 0) {
    // Use existing permissions (adding missing keys as false)
    const result = { ...permissions } as UserPermissions;
    for (const key of allKeys) {
      if (!(key in result)) {
        result[key] = false;  // ← Missing keys default to FALSE
      }
    }
    return result;
  }
  
  // Only use defaults if permissions is null/empty
  return getDefaultPermissions(role);
}
```

**Issue**: 
- Existing franchise_admin users have outdated permissions objects in the database (created before `vendors`, `packages` modules existed)
- These partial objects don't trigger the defaults
- Missing keys get `false`, so `vendors` becomes `false` instead of `true`

### Timeline
When modules were added (vendors, packages, etc.), new permissions were added to `getDefaultPermissions()` but existing users' permissions columns were never updated.

```javascript
// New users/fresh installs:
permissions = null  
↓
Uses getDefaultPermissions() → Gets vendors: true ✅

// Existing users (problem):
permissions = { dashboard: true, bookings: true, ... }  (old structure)
↓
Uses existing permissions, adds missing keys as false
↓
Gets vendors: false ❌ (and packages: false ❌)
```

## Solution

Update all franchise_admin users' permissions to include the complete, correct permission structure.

### Step 1: Review Current Permissions

```sql
SELECT 
  id,
  email,
  role,
  permissions->>'vendors' as has_vendors,
  permissions->>'packages' as has_packages,
  permissions->>'staff' as has_staff
FROM users
WHERE role = 'franchise_admin'
LIMIT 5;
```

Expected result: `vendors` and `packages` showing `false` or `null` (that's the bug).

### Step 2: Execute the Fix

Run the SQL in `FIX_FRANCHISE_ADMIN_PERMISSIONS.sql`:

```sql
UPDATE users
SET permissions = jsonb_build_object(
  'dashboard', TRUE,
  'bookings', TRUE,
  'customers', TRUE,
  'inventory', TRUE,
  'packages', TRUE,           -- ← Now includes this
  'vendors', TRUE,            -- ← Now includes this
  'quotes', TRUE,
  'invoices', TRUE,
  'laundry', TRUE,
  'expenses', TRUE,
  'deliveries', TRUE,
  'productArchive', TRUE,
  'payroll', TRUE,
  'attendance', TRUE,
  'reports', TRUE,
  'financials', TRUE,
  'franchises', FALSE,
  'staff', TRUE,
  'integrations', FALSE,
  'settings', TRUE
)
WHERE role = 'franchise_admin'
AND is_active = TRUE;
```

### Step 3: Verify the Fix

After running the update, verify:

```sql
SELECT 
  email,
  role,
  (permissions->>'vendors')::boolean as vendors,
  (permissions->>'packages')::boolean as packages,
  (permissions->>'staff')::boolean as staff
FROM users
WHERE role = 'franchise_admin'
ORDER BY email;
```

All should show `vendors: true` and `packages: true`.

## Expected Results

### Before Fix
Franchise admin sees:
- ✅ Dashboard
- ✅ Bookings
- ✅ Customers
- ✅ Inventory
- ❌ Packages (missing)
- ❌ Vendors (missing)
- ✅ Quotes
- ✅ Other modules...

### After Fix
Franchise admin sees:
- ✅ Dashboard
- ✅ Bookings
- ✅ Customers
- ✅ Inventory
- ✅ Packages (FIXED)
- ✅ Vendors (FIXED)
- ✅ Quotes
- ✅ All other modules...

## How to Test

1. **As Super Admin**: 
   - Go to Staff management
   - Select a franchise_admin user
   - Open browser DevTools → Console
   - Run: `console.log(JSON.parse(localStorage.getItem('user'))?.permissions)`
   - Verify `vendors: true` and `packages: true`

2. **As Franchise Admin**:
   - Refresh the page (or logout/login)
   - Check sidebar for Vendors and Packages menu items
   - Click on Vendors to verify it loads
   - Click on Packages to verify it loads

3. **Database Verification**:
   - Query the users table
   - Confirm permissions column updated

## Code References

**Permission Defaults**: `/lib/auth-middleware.ts` lines 195-233
```typescript
case 'franchise_admin':
  return {
    vendors: true,    // ← This is the default
    packages: true,   // ← This is the default
    ...
  }
```

**Permission Check in Sidebar**: `/components/layout/app-sidebar.tsx` lines 285-296
```typescript
const filterItemsByRole = (items: any[]) => {
  const userPermissions = currentUser?.permissions
  
  return items.filter((item) => {
    return userPermissions[item.permission as keyof UserPermissions] === true
  })
}
```

**Navigation Items**: `/components/layout/app-sidebar.tsx` lines 55-120
- Lines 108-112: Vendors navigation item with permission: "vendors"
- Lines 78-82: Packages navigation item with permission: "packages"

## Prevention for Future

To prevent this issue with new modules:

1. **When adding a new module/permission**:
   - Add it to `getDefaultPermissions()` in `auth-middleware.ts`
   - Add it to the navigation items in `app-sidebar.tsx`
   - Create a migration SQL to update existing users

2. **Or modify `ensurePermissions()`** to always use defaults as a fallback:
```typescript
// Option: Always merge with defaults instead of just adding false
const defaults = getDefaultPermissions(role);
return { ...defaults, ...permissions };  // User perms override defaults
```

## Related Issues

This same issue could affect:
- Newly added modules that existing users don't see
- Any permission that was false before and later changed to true
- Staff users if their permissions were customized and new modules added

## Summary

| Before | After |
|--------|-------|
| ❌ Vendors hidden | ✅ Vendors visible |
| ❌ Packages hidden | ✅ Packages visible |
| ❌ Staff frustrated | ✅ Staff productive |
| DB permissions: outdated | DB permissions: current |

---

**Status**: Ready to deploy
**Impact**: Affects all existing franchise_admin users
**Rollback**: If needed, set permissions to NULL to fall back to defaults
**Testing**: ✅ Verified sidebar permission check logic
