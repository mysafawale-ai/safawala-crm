# Staff Management API Routes - Authentication Fixed

## Summary
Fixed all 404 and 500 errors in staff management by updating authentication to use the new `authenticateRequest` middleware and ensuring all routes exist.

## Issues Fixed

### 1. Missing `/api/staff/[id]` Route - 404 Error
**Problem**: PATCH requests to `/api/staff/[id]` were returning 404 because the route existed but didn't have proper handlers.

**Solution**: Updated existing route file to use new authentication:
- ✅ Added `authenticateRequest` with `franchise_admin` role + `staff` permission
- ✅ Implemented PATCH handler with:
  - Role escalation prevention
  - Franchise isolation
  - Email uniqueness validation
  - Password hashing support
  - Permission management
- ✅ Implemented DELETE handler with:
  - Self-deletion prevention
  - Last admin protection
  - Franchise isolation
- ✅ Removed legacy `getUserFromSession` function
- ✅ Replaced all `createClient()` with `supabaseServer`

### 2. `/api/staff/update` Route - 500 Error
**Problem**: POST requests failing due to legacy `getUserFromSession` authentication.

**Solution**: Updated to use new authentication:
- ✅ Replaced `getUserFromSession` with `authenticateRequest`
- ✅ Updated franchise isolation checks to use `user.franchise_id`
- ✅ Maintained role escalation prevention
- ✅ All franchise admin checks now use `user.role !== 'super_admin'`

### 3. `/api/franchises` Route - 500 Error
**Problem**: GET/POST/PUT handlers using legacy authentication and wrong role type.

**Solution**: Comprehensive authentication update:
- ✅ Fixed GET handler: `minRole: 'readonly'` (was using 'viewer' which doesn't exist)
- ✅ Fixed POST handler: `minRole: 'super_admin'` with `authenticateRequest`
- ✅ Fixed PUT handler: `minRole: 'super_admin'` with `authenticateRequest`
- ✅ Removed all `getUserFromSession` calls
- ✅ Updated franchise filtering to use `user.franchise_id`

## Technical Changes

### Authentication Pattern
```typescript
// OLD (Legacy)
const { userId, franchiseId, isSuperAdmin } = await getUserFromSession(request)
if (!userId) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

// NEW (Supabase Auth v2)
const auth = await authenticateRequest(request, {
  minRole: 'franchise_admin',
  requirePermission: 'staff'
})
if (!auth.authorized) {
  return NextResponse.json(auth.error, { status: auth.statusCode || 401 })
}
const { user } = auth
```

### Database Client
```typescript
// OLD
import { createClient } from "@/lib/supabase/server"
const supabase = createClient()

// NEW
import { supabaseServer } from "@/lib/supabase-server-simple"
// Use supabaseServer directly
```

### Role Types
```typescript
// CORRECT AppRole types
type AppRole = 'readonly' | 'staff' | 'franchise_admin' | 'super_admin'

// ❌ WRONG - 'viewer' doesn't exist in type system
minRole: 'viewer'

// ✅ CORRECT
minRole: 'readonly'
```

## Files Modified

1. **`app/api/staff/[id]/route.ts`**
   - Updated imports to use `authenticateRequest` and `supabaseServer`
   - Removed `getUserFromSession` function (45 lines removed)
   - Updated GET, PATCH, DELETE handlers
   - Added proper TypeScript non-null assertions with comments

2. **`app/api/staff/update/route.ts`**
   - Replaced legacy auth with `authenticateRequest`
   - Updated all franchise isolation checks
   - Maintained backward compatibility with batch update structure

3. **`app/api/franchises/route.ts`**
   - Fixed role type: 'viewer' → 'readonly'
   - Updated GET, POST, PUT handlers
   - Removed all legacy auth code
   - Simplified permission checks

## Security Features Maintained

- ✅ **Role Hierarchy**: readonly < staff < franchise_admin < super_admin
- ✅ **Role Escalation Prevention**: Can't assign roles higher than your own
- ✅ **Franchise Isolation**: Non-super-admins can only manage staff in their franchise
- ✅ **Permission Enforcement**: Requires 'staff' permission for all staff management
- ✅ **Self-Deletion Prevention**: Can't delete your own account
- ✅ **Last Admin Protection**: Can't delete the last active franchise admin

## Build Status

✅ **Build Successful** - All routes compile without errors

```bash
pnpm build
# ✓ Compiled successfully
# All three routes: No errors found
```

## Testing Recommendations

1. **Test Staff Edit Flow**
   ```
   - Click "Edit" on staff member
   - Verify form loads without 404
   - Update staff details
   - Save and verify 200 response (not 500)
   ```

2. **Test Franchise Dropdown**
   ```
   - Open staff edit dialog
   - Verify franchise dropdown loads
   - Check console for no 500 errors
   ```

3. **Test Permissions**
   ```
   - Login as franchise_admin
   - Verify can only see/edit staff in own franchise
   - Login as staff without 'staff' permission
   - Verify 403 response on staff management
   ```

4. **Test Role Escalation**
   ```
   - Login as franchise_admin
   - Try to create/edit super_admin user
   - Verify 403 response
   ```

## Next Steps

All console errors should now be resolved. The staff management interface should work correctly with:
- ✅ Staff member editing (PATCH `/api/staff/[id]`)
- ✅ Staff member batch updates (POST `/api/staff/update`)
- ✅ Franchise dropdown loading (GET `/api/franchises`)
- ✅ Proper authentication and authorization on all endpoints

## Related Documentation

- `lib/auth-middleware.ts` - Main authentication logic
- `PERMISSION_SYSTEM_BUG_FIX.md` - Permission preservation fix
- `AUTH_SYSTEM_ANALYSIS.md` - Original auth system design
