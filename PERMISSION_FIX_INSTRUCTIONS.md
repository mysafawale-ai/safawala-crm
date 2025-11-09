# Permission Settings Issue - Complete Solution Guide

## Issue Summary

Franchise admins cannot see **Vendors** and **Packages** menu items in the sidebar, despite these permissions being enabled by default in the code.

## Root Cause

The permission system has a two-layer architecture:
1. **Code defaults** (`auth-middleware.ts`): Defines default permissions per role
2. **Database overrides** (`users.permissions` column): Stores user-specific permissions

**The Problem**: 
- When the `vendors` and `packages` modules were added to the system, they were added to code defaults
- But existing users already had a `permissions` object in the database from before these modules existed
- The `ensurePermissions()` function doesn't merge with defaults—it treats existing database permissions as "complete"
- Any key missing from the database object defaults to `false`

Result: `vendors` and `packages` = `false` ❌

## How to Fix

### Option 1: Quick Fix (Recommended)

Run the SQL migration file provided:

**File**: `FIX_FRANCHISE_ADMIN_PERMISSIONS.sql`

This updates all franchise_admin users with the complete, correct permission structure:
- `vendors: true` ✅
- `packages: true` ✅
- All other modules properly configured ✅

**Steps**:
1. Open your database client (pgAdmin, or your Supabase dashboard)
2. Copy the SQL from `FIX_FRANCHISE_ADMIN_PERMISSIONS.sql`
3. Run it in your database
4. Ask franchise admins to refresh their browser
5. They should now see Vendors and Packages in the sidebar

### Option 2: Manual Database Update

If you prefer to do this manually:

```sql
UPDATE users
SET permissions = jsonb_build_object(
  'dashboard', TRUE,
  'bookings', TRUE,
  'customers', TRUE,
  'inventory', TRUE,
  'packages', TRUE,
  'vendors', TRUE,
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

### Option 3: Set Permissions to NULL (Fallback to Defaults)

If you want all new permissions to use code defaults instead of database overrides:

```sql
UPDATE users
SET permissions = NULL
WHERE role = 'franchise_admin';
```

This makes the system use `getDefaultPermissions()` from code. When new modules are added, franchise admins automatically get them.

## Verify the Fix

```sql
-- Check that franchise admins now have correct permissions
SELECT 
  email,
  (permissions->>'vendors')::boolean as has_vendors,
  (permissions->>'packages')::boolean as has_packages,
  (permissions->>'staff')::boolean as has_staff,
  (permissions->>'franchises')::boolean as has_franchises
FROM users
WHERE role = 'franchise_admin'
AND is_active = TRUE
ORDER BY email;
```

Expected results:
- `has_vendors`: `true`
- `has_packages`: `true`
- `has_staff`: `true`
- `has_franchises`: `false` (only super_admin should have this)

## Test After Fix

1. **Ask a franchise admin to**:
   - Refresh their browser (Cmd+Shift+R or Ctrl+Shift+R)
   - Check the sidebar for Vendors and Packages menu items
   - Click on both to verify they load properly

2. **Verify in browser console**:
   ```javascript
   // Open Developer Tools Console and run:
   JSON.stringify(JSON.parse(localStorage.getItem('user'))?.permissions, null, 2)
   
   // Should show:
   // "vendors": true
   // "packages": true
   ```

## How This Will Be Prevented in Future

We have two options going forward:

### Strategy A: Keep Using Database Overrides
When adding new modules:
1. Add to `getDefaultPermissions()` in `auth-middleware.ts`
2. Create a migration SQL to update all users

### Strategy B: Switch to Defaults-Only (Recommended)
Modify `ensurePermissions()` to:
```typescript
// Always merge with role defaults instead of treating DB as "complete"
const defaults = getDefaultPermissions(role);
return { ...defaults, ...(permissions || {}) };
```

This way:
- Code defaults are the source of truth
- Database only stores customizations
- New modules automatically appear for all users

## Files Provided

1. **FIX_FRANCHISE_ADMIN_PERMISSIONS.sql**
   - SQL migration to fix franchise admin permissions
   - Includes before/after verification queries
   - Ready to run in your database

2. **FRANCHISE_ADMIN_PERMISSIONS_FIX.md**
   - Detailed technical analysis
   - Root cause explanation
   - Code references and prevention strategies

## Technical Details

**Sidebar Permission Check** (`/components/layout/app-sidebar.tsx`):
```typescript
const filterItemsByRole = (items: any[]) => {
  const userPermissions = currentUser?.permissions
  return items.filter((item) => 
    userPermissions[item.permission] === true  // ← Checks if permission is true
  )
}
```

**Navigation Items** (`/components/layout/app-sidebar.tsx`):
- Vendors: `permission: "vendors"`
- Packages: `permission: "packages"`

**Permission Defaults** (`/lib/auth-middleware.ts`):
```typescript
case 'franchise_admin':
  return {
    vendors: true,
    packages: true,
    // ... all other modules
  }
```

## Summary

| Item | Status |
|------|--------|
| Root cause identified | ✅ Outdated permissions in database |
| Solution ready | ✅ SQL migration prepared |
| Documentation | ✅ Complete with examples |
| Prevention strategy | ✅ Documented in detailed guide |
| Expected outcome | ✅ Franchise admins see Vendors & Packages |

**Next Step**: Run the SQL fix and ask franchise admins to refresh their browsers.
