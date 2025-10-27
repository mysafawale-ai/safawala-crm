# RLS Policy Audit Report - Package Bookings

**Generated:** October 26, 2025  
**Status:** CRITICAL - RLS Currently Disabled

---

## Executive Summary

⚠️ **CRITICAL SECURITY ISSUE**: Row Level Security (RLS) is currently **DISABLED** on both `package_bookings` and `package_booking_items` tables. This was an emergency workaround to unblock booking creation after encountering 401 authorization errors.

**Impact:** All authenticated users can currently read/write ALL bookings regardless of franchise isolation. This is a **production blocker**.

---

## Current RLS Status

### Tables Affected

| Table | RLS Status | Risk Level | Action Required |
|-------|------------|------------|-----------------|
| `package_bookings` | ❌ **DISABLED** | 🔴 CRITICAL | Re-enable with proper policies |
| `package_booking_items` | ❌ **DISABLED** | 🔴 CRITICAL | Re-enable with proper policies |

### How to Check Current Status

Run this SQL in your Supabase SQL Editor:

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename;
```

---

## Why RLS Was Disabled

### Timeline of Events

1. **Initial Problem**: Franchise admin users received 401 errors when trying to create package bookings
2. **Root Cause**: RLS policies were either missing or misconfigured
3. **Emergency Solution**: Created `EMERGENCY_OPEN_PACKAGE_BOOKINGS.sql` to disable RLS
4. **Current State**: Basic booking flow works, but security is compromised

### Original Error

```
Error: Failed to create booking
code: "PGRST301"
message: "Insufficient privileges: The policy does not allow you to perform this operation."
```

---

## Required RLS Policies

### Policy Architecture

The system requires **franchise-isolated** policies with these characteristics:

1. **Franchise Isolation**: Users can only see/modify data from their own franchise
2. **Super Admin Bypass**: `super_admin` role can access all franchises
3. **Role-Based Access**: Different operations based on user roles
4. **Automatic Franchise ID**: New records automatically get user's franchise_id

### Policy Definitions Needed

#### 1. SELECT Policy - `package_bookings_select_policy`

**Purpose**: Control who can view bookings

```sql
CREATE POLICY package_bookings_select_policy ON package_bookings
FOR SELECT
USING (
  -- Super admins see everything
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Others only see their franchise
  franchise_id = (
    SELECT franchise_id FROM users WHERE users.id = auth.uid()
  )
);
```

**Access Matrix:**
- ✅ `super_admin`: All bookings across all franchises
- ✅ `franchise_admin`: Only their franchise's bookings
- ✅ `staff`: Only their franchise's bookings
- ❌ Unauthenticated: No access

#### 2. INSERT Policy - `package_bookings_insert_policy`

**Purpose**: Control who can create bookings

```sql
CREATE POLICY package_bookings_insert_policy ON package_bookings
FOR INSERT
WITH CHECK (
  -- Super admins can create for any franchise
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  -- Others can only create for their franchise
  (
    franchise_id = (SELECT franchise_id FROM users WHERE users.id = auth.uid())
    AND auth.uid() IS NOT NULL
  )
);
```

#### 3. UPDATE Policy - `package_bookings_update_policy`

**Purpose**: Control who can modify bookings

```sql
CREATE POLICY package_bookings_update_policy ON package_bookings
FOR UPDATE
USING (
  -- Can only update if you can see it (uses SELECT policy logic)
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
  OR
  franchise_id = (SELECT franchise_id FROM users WHERE users.id = auth.uid())
)
WITH CHECK (
  -- Cannot change franchise_id
  franchise_id = OLD.franchise_id
);
```

#### 4. DELETE Policy - `package_bookings_delete_policy`

**Purpose**: Control who can delete bookings

```sql
CREATE POLICY package_bookings_delete_policy ON package_bookings
FOR DELETE
USING (
  -- Only super_admins and franchise_admins
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'super_admin' 
      OR (
        users.role = 'franchise_admin' 
        AND users.franchise_id = package_bookings.franchise_id
      )
    )
  )
);
```

### Policies for `package_booking_items`

Similar policies needed with additional check:

```sql
-- SELECT: Can view items if can view parent booking
CREATE POLICY package_booking_items_select_policy ON package_booking_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    -- Inherits access from parent booking's policies
  )
);

-- INSERT: Can create items if can access parent booking
CREATE POLICY package_booking_items_insert_policy ON package_booking_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    AND (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
      OR package_bookings.franchise_id = (SELECT franchise_id FROM users WHERE users.id = auth.uid())
    )
  )
);

-- UPDATE: Can modify items if can access parent booking
CREATE POLICY package_booking_items_update_policy ON package_booking_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    AND (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
      OR package_bookings.franchise_id = (SELECT franchise_id FROM users WHERE users.id = auth.uid())
    )
  )
);

-- DELETE: Same as UPDATE
CREATE POLICY package_booking_items_delete_policy ON package_booking_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    AND (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
      OR package_bookings.franchise_id = (SELECT franchise_id FROM users WHERE users.id = auth.uid())
    )
  )
);
```

---

## Helper Functions Required

### 1. Get Current User's Franchise ID

```sql
CREATE OR REPLACE FUNCTION current_user_franchise_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT franchise_id 
    FROM users 
    WHERE id = auth.uid()
  );
END;
$$;
```

### 2. Auto-set Franchise ID on Insert (Trigger)

```sql
CREATE OR REPLACE FUNCTION set_franchise_id_default()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.franchise_id IS NULL THEN
    NEW.franchise_id := current_user_franchise_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Apply to package_bookings
CREATE TRIGGER set_package_bookings_franchise_id
  BEFORE INSERT ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_franchise_id_default();
```

---

## Implementation Script

### Complete Re-Enable Script

Save as `ENABLE_PACKAGE_BOOKINGS_RLS.sql`:

```sql
-- =====================================================
-- RE-ENABLE RLS FOR PACKAGE BOOKINGS WITH PROPER POLICIES
-- =====================================================

-- Step 1: Drop existing policies (if any)
DO $$ 
DECLARE 
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('package_bookings', 'package_booking_items')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- Step 2: Create helper function
CREATE OR REPLACE FUNCTION current_user_franchise_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (SELECT franchise_id FROM users WHERE id = auth.uid());
END;
$$;

-- Step 3: Create trigger function
CREATE OR REPLACE FUNCTION set_franchise_id_default()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.franchise_id IS NULL THEN
    NEW.franchise_id := current_user_franchise_id();
  END IF;
  RETURN NEW;
END;
$$;

-- Step 4: Apply trigger to package_bookings
DROP TRIGGER IF EXISTS set_package_bookings_franchise_id ON package_bookings;
CREATE TRIGGER set_package_bookings_franchise_id
  BEFORE INSERT ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_franchise_id_default();

-- Step 5: Create policies for package_bookings
CREATE POLICY package_bookings_select_policy ON package_bookings
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR franchise_id = current_user_franchise_id()
);

CREATE POLICY package_bookings_insert_policy ON package_bookings
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR franchise_id = current_user_franchise_id()
);

CREATE POLICY package_bookings_update_policy ON package_bookings
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
  OR franchise_id = current_user_franchise_id()
)
WITH CHECK (
  franchise_id = OLD.franchise_id
);

CREATE POLICY package_bookings_delete_policy ON package_bookings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND (
      users.role = 'super_admin' 
      OR (users.role = 'franchise_admin' AND users.franchise_id = package_bookings.franchise_id)
    )
  )
);

-- Step 6: Create policies for package_booking_items
CREATE POLICY package_booking_items_select_policy ON package_booking_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
  )
);

CREATE POLICY package_booking_items_insert_policy ON package_booking_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    AND (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
      OR package_bookings.franchise_id = current_user_franchise_id()
    )
  )
);

CREATE POLICY package_booking_items_update_policy ON package_booking_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    AND (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
      OR package_bookings.franchise_id = current_user_franchise_id()
    )
  )
);

CREATE POLICY package_booking_items_delete_policy ON package_booking_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM package_bookings
    WHERE package_bookings.id = package_booking_items.booking_id
    AND (
      EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super_admin')
      OR package_bookings.franchise_id = current_user_franchise_id()
    )
  )
);

-- Step 7: Enable RLS
ALTER TABLE package_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_booking_items ENABLE ROW LEVEL SECURITY;

-- Step 8: Verify
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items');

SELECT 
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename, policyname;
```

---

## Testing Checklist

After re-enabling RLS, test these scenarios:

### Test 1: Franchise Admin Access
- [ ] Can view only their franchise's bookings
- [ ] Can create new bookings (auto-assigned to their franchise)
- [ ] Can edit their franchise's bookings
- [ ] Cannot see other franchises' bookings

### Test 2: Super Admin Access
- [ ] Can view all bookings across all franchises
- [ ] Can create bookings for any franchise
- [ ] Can edit any booking
- [ ] Can delete any booking

### Test 3: Staff Access
- [ ] Can view their franchise's bookings
- [ ] Can create bookings for their franchise
- [ ] Can edit their franchise's bookings (if permitted by role)

### Test 4: Edge Cases
- [ ] Unauthenticated users cannot access any data
- [ ] Cannot modify franchise_id after creation
- [ ] Booking items inherit parent booking access
- [ ] Franchise filter works correctly in API responses

### Test 5: API Integration
- [ ] `/api/bookings` returns only authorized bookings
- [ ] `/api/bookings/[id]` respects RLS
- [ ] `/book-package` page can create bookings without 401 errors
- [ ] Edit booking functionality works properly

---

## Rollback Plan

If re-enabling causes issues:

### Quick Disable (Emergency)

```sql
ALTER TABLE package_bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE package_booking_items DISABLE ROW LEVEL SECURITY;
```

### Investigate

1. Check Supabase logs for specific policy violations
2. Verify user's `franchise_id` is set correctly
3. Test with super_admin account first
4. Check if `auth.uid()` resolves correctly

---

## Impact Analysis

### Current Risk (RLS Disabled)

| Issue | Impact | Severity |
|-------|--------|----------|
| No franchise isolation | Users can access other franchises' data | 🔴 CRITICAL |
| No role enforcement | Staff can delete bookings | 🟠 HIGH |
| Audit trail compromised | Cannot track who accessed what | 🟡 MEDIUM |
| Compliance violation | May violate data privacy regulations | 🔴 CRITICAL |

### Post-Fix Benefits

- ✅ Franchise data completely isolated
- ✅ Role-based permissions enforced
- ✅ Audit trail maintained
- ✅ Production-ready security
- ✅ Scalable multi-tenant architecture

---

## Recommendations

### Immediate (Within 24 hours)
1. ⚠️ **Re-enable RLS** using the provided script
2. ⚠️ Test with all user roles (super_admin, franchise_admin, staff)
3. ⚠️ Verify existing bookings are still accessible

### Short-term (This week)
4. Add audit logging for policy violations
5. Document RLS testing procedures
6. Create automated RLS policy tests
7. Add monitoring for 401 errors in production

### Long-term (This month)
8. Implement row-level audit logs
9. Add policy version tracking
10. Create RLS policy templates for new tables
11. Set up alerts for RLS policy changes

---

## Related Files

- `EMERGENCY_OPEN_PACKAGE_BOOKINGS.sql` - Current disabled state script
- `scripts/AUTH_RLS_BASELINE.sql` - Comprehensive RLS baseline for all tables
- `app/book-package/page.tsx` - Main booking creation page
- `app/api/bookings/route.ts` - Bookings API with franchise filtering

---

## Questions to Answer Before Re-Enabling

1. **Data Integrity**: Are all existing bookings assigned to correct franchise_id?
   ```sql
   SELECT COUNT(*) FROM package_bookings WHERE franchise_id IS NULL;
   ```

2. **User Setup**: Do all users have franchise_id set?
   ```sql
   SELECT COUNT(*) FROM users WHERE franchise_id IS NULL;
   ```

3. **Testing Environment**: Can you test in staging first?

4. **Rollback Window**: Do you have a maintenance window for rollback if needed?

---

## Contact

If you encounter issues after re-enabling RLS:

1. Check Supabase logs immediately
2. Note the exact error message and user role
3. Verify franchise_id values in both users and bookings tables
4. Consider creating a support user with super_admin for emergency access

---

**Last Updated:** October 26, 2025  
**Next Review:** After RLS re-enable
