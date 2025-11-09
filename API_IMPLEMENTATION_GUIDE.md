# Custom API Authentication & Authorization Implementation Guide

## 🎯 Quick Start for Developers

### Standard API Endpoint Pattern (No RLS, No FK Constraints)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth-middleware'
import { requirePermission } from '@/lib/api/permission-middleware'
import { hasPermission, applyFranchiseFilter, canAccessResource } from '@/lib/api/authorization'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Step 1: Authenticate user
  const authResult = await authenticateRequest(request, {
    minRole: 'readonly',
  })

  if (!authResult.authorized) {
    return NextResponse.json(authResult.error, { status: authResult.statusCode || 401 })
  }

  const user = authResult.user!

  // Step 2: Check permission
  const permResult = await requirePermission(user, 'customers')
  if (!permResult.success) {
    return NextResponse.json(
      { error: permResult.message },
      { status: 403 }
    )
  }

  // Step 3: Build query with franchise filtering
  const supabase = createClient()
  let query = supabase.from('customers').select('*')
  
  // Automatically apply franchise filter for non-super-admins
  query = applyFranchiseFilter(query, user, 'franchise_id')

  // Step 4: Execute and return
  const { data, error } = await query

  if (error) {
    console.error('[API] Customers GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  // Authenticate & check permission
  const authResult = await authenticateRequest(request, {
    minRole: 'staff',
    requirePermission: 'customers',
  })

  if (!authResult.authorized) {
    return NextResponse.json(authResult.error, { status: authResult.statusCode || 403 })
  }

  const user = authResult.user!
  const body = await request.json()

  // Validate franchise access
  if (!canAccessResource(user, body.franchise_id)) {
    return NextResponse.json(
      { error: 'You do not have access to this franchise' },
      { status: 403 }
    )
  }

  // Create record
  const supabase = createClient()
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
```

---

## 📚 Core Concepts

### 1. **Permission Checking**

```typescript
import { hasPermission } from '@/lib/api/authorization'

// Check if user has specific permission
if (!hasPermission(user, 'customers')) {
  return NextResponse.json({ error: 'No permission' }, { status: 403 })
}
```

**Available Permissions:**
- `dashboard` - Main dashboard access
- `bookings` - Booking management
- `customers` - Customer database
- `inventory` - Product inventory
- `packages` - Package/sets management
- `vendors` - Vendor management
- `quotes` - Quote generation
- `invoices` - Invoice management
- `laundry` - Laundry operations
- `expenses` - Expense tracking
- `deliveries` - Delivery management
- `productArchive` - Archived products
- `payroll` - Payroll processing
- `attendance` - Attendance tracking
- `reports` - Reports & analytics
- `financials` - Financial statements
- `franchises` - Franchise management
- `staff` - Staff management
- `integrations` - Third-party integrations
- `settings` - System settings

### 2. **Franchise Isolation**

```typescript
import { applyFranchiseFilter, canAccessResource } from '@/lib/api/authorization'

// Automatically filter queries to user's franchise (if not super admin)
let query = supabase.from('customers').select('*')
query = applyFranchiseFilter(query, user, 'franchise_id')

// Or check specific resource access
if (!canAccessResource(user, customer.franchise_id)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
```

### 3. **Role-Based Access**

```typescript
import { canEditUser, canPerformRoleAction } from '@/lib/api/authorization'

// Check if user can edit another user
if (!canEditUser(currentUser, targetUserId, targetFranchiseId)) {
  return NextResponse.json({ error: 'Cannot edit this user' }, { status: 403 })
}

// Check role hierarchy
if (!canPerformRoleAction(user, 'franchise_admin')) {
  return NextResponse.json({ error: 'Insufficient role' }, { status: 403 })
}
```

---

## 🔄 Migration Path: Converting Existing Endpoints

### Before (With RLS - Current)
```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, 'readonly')
  if (!authResult.success) return NextResponse.json(authResult.response, { status: 401 })

  const { authContext } = authResult
  const user = authContext!.user

  // Check permission manually
  const permissions = await getUserPermissions(user.id)
  if (!hasModuleAccess(permissions, 'customers')) {
    return NextResponse.json({ error: 'No permission' }, { status: 403 })
  }

  // Manually apply franchise filter
  let query = supabase.from('customers').select('*')
  if (!user.is_super_admin && user.franchise_id) {
    query = query.eq('franchise_id', user.franchise_id)
  }

  const { data, error } = await query
  return NextResponse.json({ data })
}

// Database also has RLS policies checking the same thing - DUPLICATE LOGIC!
```

### After (Custom API Auth - New)
```typescript
export async function GET(request: NextRequest) {
  // Authenticate + check permission in one call
  const authResult = await authenticateRequest(request, {
    requirePermission: 'customers',
  })

  if (!authResult.authorized) {
    return NextResponse.json(authResult.error, { status: authResult.statusCode || 403 })
  }

  const user = authResult.user!

  // Franchise filtering is automatic
  let query = supabase.from('customers').select('*')
  query = applyFranchiseFilter(query, user, 'franchise_id')

  const { data, error } = await query
  return NextResponse.json({ data })
}

// Database: NO RLS policies - API handles everything
```

---

## 🛠️ Common Patterns

### Pattern 1: Protected CRUD Endpoint

```typescript
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // Authenticate
  const authResult = await authenticateRequest(request, {
    minRole: 'franchise_admin',
    requirePermission: 'customers',
  })

  if (!authResult.authorized) {
    return NextResponse.json(authResult.error, { status: authResult.statusCode })
  }

  const user = authResult.user!
  const supabase = createClient()

  // Get the record to check franchise
  const { data: customer, error: fetchError } = await supabase
    .from('customers')
    .select('franchise_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Verify franchise access
  if (!canAccessResource(user, customer.franchise_id)) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  // Delete
  const { error: deleteError } = await supabase
    .from('customers')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
```

### Pattern 2: Bulk Operations

```typescript
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request, {
    requirePermission: 'inventory',
  })

  if (!authResult.authorized) {
    return NextResponse.json(authResult.error, { status: authResult.statusCode })
  }

  const user = authResult.user!
  const { items } = await request.json()

  // Validate each item
  for (let i = 0; i < items.length; i++) {
    if (!canAccessResource(user, items[i].franchise_id)) {
      return NextResponse.json(
        {
          error: `Item ${i}: Franchise access denied`,
          invalidIndex: i,
        },
        { status: 403 }
      )
    }
  }

  // Bulk insert
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory')
    .insert(items.map(item => ({
      ...item,
      created_by: user.id,
    })))
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data, count: data.length }, { status: 201 })
}
```

### Pattern 3: User Management

```typescript
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authenticateRequest(request, {
    requirePermission: 'staff',
  })

  if (!authResult.authorized) {
    return NextResponse.json(authResult.error, { status: authResult.statusCode })
  }

  const editor = authResult.user!
  const updates = await request.json()
  const supabase = createClient()

  // Get target user
  const { data: targetUser, error: fetchError } = await supabase
    .from('users')
    .select('franchise_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if editor can edit target
  if (!canEditUser(editor, params.id, targetUser.franchise_id)) {
    return NextResponse.json(
      { error: 'You cannot edit this user' },
      { status: 403 }
    )
  }

  // Update
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data: data[0] })
}
```

---

## 📋 Checklist for Refactoring an Endpoint

- [ ] Remove manual permission checking (use `requirePermission` middleware)
- [ ] Remove manual franchise filtering (use `applyFranchiseFilter`)
- [ ] Remove franchise access checks (use `canAccessResource`)
- [ ] Add console logs for debugging
- [ ] Test with different roles (super_admin, franchise_admin, staff)
- [ ] Test franchise isolation (admin in franchise A cannot access franchise B data)
- [ ] Test with disabled permissions (staff with permission unchecked)
- [ ] Verify no RLS policy errors in logs

---

## 🧪 Testing Authorization

### Test Franchise Isolation
```typescript
// Create two franchises
const franchise1 = { id: 'f1', name: 'Franchise 1' }
const franchise2 = { id: 'f2', name: 'Franchise 2' }

// Create users
const admin1 = { id: 'admin1', franchise_id: franchise1.id, role: 'franchise_admin' }
const admin2 = { id: 'admin2', franchise_id: franchise2.id, role: 'franchise_admin' }

// Admin1 should NOT see franchise2 customers
const result = await GET(request) // Called as admin1 looking for franchise2 data
// Should return only franchise1 data

```

### Test Permission Blocking
```typescript
// User with 'customers' permission = unchecked
const user = {
  id: 'user1',
  permissions: { customers: false }
}

// Accessing customers API should fail
const result = await requirePermission(user, 'customers')
// Should return: { success: false, code: 'PERMISSION_DENIED' }
```

### Test Role Hierarchy
```typescript
const staff = { role: 'staff' }
const result = await requireMinRole(staff, 'franchise_admin')
// Should return: { success: false, code: 'ROLE_DENIED' }
```

---

## 🚀 Deployment Checklist

### Before Going Live

- [ ] All 114 API endpoints refactored to use new system
- [ ] No more custom permission checking in endpoints
- [ ] Franchise isolation tests passing
- [ ] Permission blocking tests passing
- [ ] Role hierarchy tests passing
- [ ] Load test with concurrent requests
- [ ] Monitor auth/permission logs
- [ ] Document new patterns for team

### Database Cleanup

- [ ] Disable RLS policies on all tables
- [ ] Remove foreign key constraints (API validates instead)
- [ ] Keep franchise_id columns for data isolation
- [ ] Keep indexeson franchise_id for performance
- [ ] Backup before making changes

### Monitoring

```typescript
// Log all authorization decisions
console.log(`[Authorization] ${action} - ${user.id} - ${permission} - ${result}`)

// Monitor permission denials
if (!hasPermission(user, 'customers')) {
  console.warn(`[Authorization] Permission denied - user: ${user.id}, permission: customers`)
}
```

---

## 📞 Support

### Common Issues

**"User has no franchise_id"**
- Check if user was created properly with franchise assignment
- Verify user is active

**"Permission denied but I'm super admin"**
- Ensure `user.is_super_admin` is true
- Check if `user.permissions[permission]` is explicitly false

**"Franchise filter not working"**
- Verify franchise_id column exists in table
- Check franchise_id is not null
- Ensure `applyFranchiseFilter` is called before query execution

### Debug Checklist

1. Enable debug logging: Check `console.log` in authorization functions
2. Add request logging: Log `user`, `permission`, `franchise_id`
3. Check database: Verify user record has correct franchise_id
4. Test with super admin: Verify system works at highest level
5. Gradually reduce permissions: Test with fewer permissions

---

## 📚 Related Documentation

- `CUSTOM_API_AUTH_SYSTEM_DESIGN.md` - Architecture & design
- `/lib/api/authorization.ts` - Core functions
- `/lib/api/permission-middleware.ts` - Middleware
- `/lib/auth-middleware.ts` - Authentication
