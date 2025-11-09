# Custom API Authentication & Authorization System

## Current Problems

### 1. **RLS (Row-Level Security) Issues**
- Complex RLS policies causing unexpected query failures
- Franchise isolation not always working correctly
- Permission updates require database re-evaluation
- Hard to debug when RLS blocks queries silently
- Policies conflict with direct queries

### 2. **Foreign Key Constraint Issues**
- FK constraints sometimes prevent cascading deletes
- Constraints interfere with soft deletes
- Hard to handle related data cleanup
- Orphaned records cause integrity errors
- Cannot modify relationships without constraint conflicts

### 3. **Current API Pattern Problems**
- Each endpoint manually checks permissions
- Inconsistent authorization logic across 114+ endpoints
- Code duplication for permission checks
- Franchise isolation logic repeated everywhere
- Hard to maintain and update permission rules

---

## Proposed Solution: Custom API Authorization Layer

### **Architecture Overview**

```
Request Flow:
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│  1. Authentication Middleware │  ← Verify JWT, get user
│  (`requireAuth`)             │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  2. Authorization Middleware  │  ← Check role + permissions
│  (`requirePermission`)       │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  3. Data Access Layer        │  ← Handle franchise isolation
│  (`withFranchiseFilter`)     │  ← Manual query filtering
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  4. Business Logic           │  ← Process request
│  (Your endpoint code)        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  5. Response                 │  ← Return data or error
└──────────────────────────────┘
```

### **Key Components**

#### 1. **Authentication Context** (`AuthContext`)
```typescript
interface AuthContext {
  user: {
    id: string
    email: string
    role: 'super_admin' | 'franchise_admin' | 'staff' | 'readonly'
    franchise_id: string | null
    permissions: UserPermissions
    is_active: boolean
  }
  timestamp: number
}
```

#### 2. **Permission System**
```typescript
interface UserPermissions {
  dashboard: boolean
  bookings: boolean
  customers: boolean
  inventory: boolean
  packages: boolean
  vendors: boolean
  quotes: boolean
  invoices: boolean
  laundry: boolean
  expenses: boolean
  deliveries: boolean
  productArchive: boolean
  payroll: boolean
  attendance: boolean
  reports: boolean
  financials: boolean
  franchises: boolean
  staff: boolean
  integrations: boolean
  settings: boolean
}
```

#### 3. **Authorization Helpers** (Replace RLS)

**File: `/lib/api/authorization.ts`**
```typescript
// Check if user has specific permission
async function checkPermission(userId: string, permission: keyof UserPermissions): Promise<boolean>

// Apply franchise filter for non-super-admins
function applyFranchiseFilter(query: any, user: AuthContext['user']): any

// Check if user can modify user in franchise
function canEditUser(editor: AuthContext['user'], targetUser: any): boolean

// Check if user can access resource
function canAccessResource(user: AuthContext['user'], resourceFranchiseId: string): boolean
```

#### 4. **Standard API Pattern** (No RLS needed)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-middleware'
import { requirePermission } from '@/lib/api/permission-middleware'
import { applyFranchiseFilter } from '@/lib/api/authorization'

export async function GET(request: NextRequest) {
  // 1. Authenticate user
  const authResult = await requireAuth(request)
  if (!authResult.success) return NextResponse.json(authResult.response, { status: 401 })
  const { authContext } = authResult

  // 2. Check permission
  const permResult = await requirePermission(authContext, 'customers')
  if (!permResult.success) return NextResponse.json(permResult.response, { status: 403 })

  // 3. Build query with franchise filtering
  let query = supabase.from('customers').select('*')
  query = applyFranchiseFilter(query, authContext.user)

  // 4. Execute and return
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
```

---

## Implementation Strategy

### **Phase 1: Core Infrastructure** (Week 1)
- [ ] Create `/lib/api/authorization.ts` with helper functions
- [ ] Update `requireAuth` middleware
- [ ] Create `requirePermission` middleware
- [ ] Create helper function for franchise filtering
- [ ] Set up error handling utilities

### **Phase 2: High-Priority Endpoints** (Week 2-3)
Start with endpoints causing most errors:
- [ ] Customers API (`/api/customers/*`)
- [ ] Vendors API (`/api/vendors/*`)
- [ ] Bookings API (`/api/bookings/*`)
- [ ] Products/Inventory API (`/api/products/*`, `/api/inventory/*`)

### **Phase 3: Business Module APIs** (Week 4-5)
- [ ] Quotes API
- [ ] Invoices API
- [ ] Orders API (Product & Package)
- [ ] Expenses API

### **Phase 4: Admin APIs** (Week 6)
- [ ] Staff Management API
- [ ] Franchises API
- [ ] Settings APIs

### **Phase 5: Cleanup** (Week 7)
- [ ] Disable RLS policies
- [ ] Remove FK constraints (use API validation instead)
- [ ] Test full system
- [ ] Document for team

---

## Database Changes

### **What We Keep**
- Table structure
- Indexes for performance
- Basic columns (created_at, updated_at, etc.)

### **What We Remove**
- RLS Policies (security handled by API)
- Foreign Key Constraints (validation in API)
- Complex Triggers (handle in API or simple triggers)

### **Why This Works**
1. **API controls access** - No bypassing via direct SQL
2. **Clearer logic** - All rules in one place (API code)
3. **Easier debugging** - Add console logs, step through code
4. **Better performance** - No RLS overhead
5. **Scalability** - Franchise isolation always consistent

---

## Example: Refactoring Customers API

### **Before (Current - With RLS)**
```typescript
// app/api/customers/route.ts
async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, 'readonly')
  if (!authResult.success) return NextResponse.json(authResult.response, { status: 401 })
  
  // Check permission
  const permissions = await getUserPermissions(authContext!.user.id)
  if (!hasModuleAccess(permissions, 'customers')) {
    return NextResponse.json({ error: 'No permission' }, { status: 403 })
  }

  // Manually apply franchise filter
  let query = supabase.from("customers").select("*")
  if (!isSuperAdmin && franchiseId) {
    query = query.eq("franchise_id", franchiseId)
  }
  
  const { data, error } = await query
  return NextResponse.json({ data })
}

// Database: RLS policies doing same checks again
// This creates duplicate logic!
```

### **After (Custom API Auth)**
```typescript
// app/api/customers/route.ts
import { requireAuth } from '@/lib/auth-middleware'
import { requirePermission } from '@/lib/api/permission-middleware'
import { applyFranchiseFilter } from '@/lib/api/authorization'

async function GET(request: NextRequest) {
  // 1. Verify user is authenticated
  const authResult = await requireAuth(request)
  if (!authResult.success) return NextResponse.json(authResult.response, { status: 401 })
  const { authContext } = authResult

  // 2. Verify user has 'customers' permission
  const permResult = await requirePermission(authContext, 'customers')
  if (!permResult.success) return NextResponse.json(permResult.response, { status: 403 })

  // 3. Build and filter query for franchise
  let query = supabase.from('customers').select('*')
  query = applyFranchiseFilter(query, authContext.user)

  // 4. Execute query
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  
  return NextResponse.json({ data })
}

// Database: NO RLS policies needed - API handles all authorization
```

### **Database Changes for Customers**
```sql
-- Remove RLS policies
DROP POLICY "customers_select" ON customers;
DROP POLICY "customers_insert" ON customers;
DROP POLICY "customers_update" ON customers;
DROP POLICY "customers_delete" ON customers;

-- Disable RLS (security now in API)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- Keep franchise_id column for data isolation
-- No foreign key constraints - API validates

-- Indexes remain for performance
CREATE INDEX idx_customers_franchise ON customers(franchise_id);
```

---

## Benefits Summary

| Current (RLS) | New (Custom API) |
|---|---|
| ❌ Duplicate logic (DB + API) | ✅ Single source of truth (API) |
| ❌ Hard to debug | ✅ Add logs, step through |
| ❌ Complex policies | ✅ Simple TypeScript |
| ❌ FK conflicts | ✅ API validation only |
| ❌ Performance overhead | ✅ Direct queries, no RLS eval |
| ❌ Permission checks scattered | ✅ Centralized authorization |
| ❌ Cascading delete issues | ✅ Handle in API cleanly |
| ❌ Inconsistent across endpoints | ✅ Standardized pattern |

---

## Next Steps

1. **Confirm scope**: Which endpoints cause most errors?
2. **Start Phase 1**: Build authorization helpers
3. **Pilot Phase 2**: Refactor 2-3 endpoints
4. **Test thoroughly**: Verify all permissions work
5. **Rollout remaining**: Scale to all 114 endpoints
6. **Cleanup**: Remove RLS and FK constraints

---

## Files to Create/Modify

### New Files
- `/lib/api/authorization.ts` - Core helpers
- `/lib/api/permission-middleware.ts` - Permission checking
- `/lib/api/errors.ts` - Standard error responses
- `/lib/api/types.ts` - Shared types
- `API_IMPLEMENTATION_GUIDE.md` - Developer guide

### Modified Files
- All 114 API route files (gradual refactoring)
- Database migration script
- Authentication middleware

---

## Risk Mitigation

- **Gradual rollout**: Phase by phase, not all at once
- **Testing**: Full permission tests for each endpoint
- **Rollback plan**: Keep RLS policies during transition
- **Documentation**: Clear guides for developers
- **Monitoring**: Log all auth/permission decisions

---

## Questions for You

1. Which APIs cause the most errors currently?
2. Do you want to disable FK constraints entirely?
3. Should we do this gradually or all at once?
4. Do you need audit logs for permission checks?
