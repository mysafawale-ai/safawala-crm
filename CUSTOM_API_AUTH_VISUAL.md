# Custom API Authorization System - Visual Overview

## 📊 Problem vs Solution

```
CURRENT STATE (With RLS - Pain Points)
═════════════════════════════════════════════════════════════

Request comes in
        ↓
┌──────────────────────────────────────────────────────────┐
│ API Endpoint (114 of these)                              │
│ ✓ Check permission manually                              │
│ ✓ Apply franchise filter manually                        │
│ ✗ Inconsistent logic across endpoints                    │
└──────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────┐
│ Database Query                                           │
│ ✗ RLS Policy checks SAME permission again (DUPLICATE!)   │
│ ✗ RLS Policy applies SAME franchise filter again         │
│ ✗ FK constraints causing cascading delete errors         │
└──────────────────────────────────────────────────────────┘
        ↓
Problems:
- Duplicate logic (checked twice!)
- Hard to debug (RLS policy blocked it silently)
- Slow (RLS evaluation overhead)
- FK constraint conflicts
- Inconsistent across 114 endpoints


NEW STATE (Custom API Auth - Clean & Simple)
═════════════════════════════════════════════════════════════

Request comes in
        ↓
┌──────────────────────────────────────────────────────────┐
│ API Endpoint (Standardized Pattern)                      │
│ ✓ Authenticate user (JWT)                                │
│ ✓ Check permission (once)                                │
│ ✓ Check role hierarchy (once)                            │
│ ✓ Apply franchise filter (once)                          │
│ ✓ Execute business logic                                 │
└──────────────────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────────────────────────┐
│ Database Query                                           │
│ ✓ Direct query (NO RLS overhead)                         │
│ ✓ NO FK constraint conflicts                             │
│ ✓ API handles all validation                             │
└──────────────────────────────────────────────────────────┘
        ↓
Benefits:
- Single source of truth
- Easy to debug (read TypeScript code)
- Fast (no RLS evaluation)
- No FK constraint issues
- Consistent pattern everywhere
```

---

## 🔐 Three-Layer Authorization

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: PERMISSION CHECK                                   │
├─────────────────────────────────────────────────────────────┤
│ Q: Does user have permission for this module?               │
│ Examples:                                                   │
│  • 'customers' permission checked = Show/Allow              │
│  • 'customers' permission unchecked = Hide/Deny             │
│  • 'customers' permission missing = Deny                    │
│                                                              │
│ User Permissions Table:                                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ dashboard ✓ | bookings ✗ | customers ✓ | vendors ✗ │   │
│ │ quotes ✓ | invoices ✓ | inventory ✗ | ...         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Code: hasPermission(user, 'customers')                     │
│ Returns: true/false                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: ROLE CHECK                                         │
├─────────────────────────────────────────────────────────────┤
│ Q: Does user's role allow this action?                      │
│                                                              │
│ Role Hierarchy:                                             │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Super Admin (Level 4)                                  │ │
│ │ ├─ Can access everything                              │ │
│ │ ├─ Can bypass franchise isolation                     │ │
│ │ └─ Can manage all franchises                          │ │
│ │                                                        │ │
│ │ Franchise Admin (Level 3)                             │ │
│ │ ├─ Can access own franchise                           │ │
│ │ ├─ Can manage own franchise's staff                   │ │
│ │ └─ Cannot access other franchises                     │ │
│ │                                                        │ │
│ │ Staff (Level 2)                                       │ │
│ │ ├─ Can access own franchise (limited modules)         │ │
│ │ ├─ Limited to their assigned permissions              │ │
│ │ └─ Cannot edit other staff                            │ │
│ │                                                        │ │
│ │ Readonly (Level 1)                                    │ │
│ │ └─ Read-only access to assigned modules               │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Code: canPerformRoleAction(user, 'franchise_admin')        │
│ Returns: true/false                                        │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: FRANCHISE ISOLATION                                │
├─────────────────────────────────────────────────────────────┤
│ Q: Is the resource in user's franchise?                     │
│                                                              │
│ Super Admin:                                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Sees ALL franchises data                               ││
│ │ Franchise A, B, C, D, ... (no filtering)               ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Franchise Admin:                                            │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Admin in Franchise A                                   ││
│ │ ✓ Sees Franchise A data                                ││
│ │ ✗ Cannot see Franchise B data                          ││
│ │ ✗ Cannot see Franchise C data                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                              │
│ Code: canAccessResource(user, franchise_id)                │
│ Returns: true/false                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Standard API Pattern

```typescript
// Step 1: Authenticate
const authResult = await authenticateRequest(request, {
  minRole: 'staff',
  requirePermission: 'customers',
})
│
├─ Verifies JWT token
├─ Loads user profile from database
├─ Checks role hierarchy
├─ Checks permission
│
└─ Returns: { authorized: true/false, user, error }

                         ↓

// Step 2: Apply Authorization
const user = authResult.user!

// Check franchise isolation
if (!canAccessResource(user, resource.franchise_id)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
│
├─ Checks if resource is in user's franchise
├─ Bypasses check for super admins
│
└─ Returns: true/false

                         ↓

// Step 3: Apply Franchise Filter (Automatic)
let query = supabase.from('customers').select('*')
query = applyFranchiseFilter(query, user, 'franchise_id')
│
├─ If super admin: no filter (see all data)
├─ If franchise admin: filter by user.franchise_id
│
└─ Returns: filtered query

                         ↓

// Step 4: Execute Query
const { data, error } = await query

                         ↓

// Step 5: Return Response
if (error) {
  return NextResponse.json({ error: error.message }, { status: 400 })
}
return NextResponse.json({ data })
```

---

## 📋 Authorization Decision Tree

```
User makes request to API endpoint
         │
         ▼
    ┌─────────────┐
    │ Verify JWT? │
    └──────┬──────┘
           │
      YES  │  NO
     ┌─────┴─────┐
     │           │
    ✓           ✗ Return 401 Unauthorized
     │
     ▼
    ┌──────────────────┐
    │ Permission set?  │ (e.g., 'customers')
    └──────┬───────────┘
           │
      YES  │  NO
     ┌─────┴─────┐
     │           │
    ✓           ✗ Return 403 Permission Denied
     │
     ▼
    ┌──────────────────┐
    │ Role high enough?│ (e.g., needs franchise_admin)
    └──────┬───────────┘
           │
      YES  │  NO
     ┌─────┴─────┐
     │           │
    ✓           ✗ Return 403 Role Denied
     │
     ▼
    ┌──────────────────────────┐
    │ Super Admin?             │
    └──────┬───────────────────┘
           │
      YES  │  NO
     ┌─────┴─────┐
     │           │
    ✓           ✓ (Continue to franchise check)
     │           │
     │      ┌────▼──────────────────────┐
     │      │ Is resource in user's     │
     │      │ franchise?                │
     │      └────┬─────────────────────┘
     │           │
     │      YES  │  NO
     │     ┌─────┴─────┐
     │     │           │
     │    ✓           ✗ Return 403 Franchise Access Denied
     │     │
     │     └──────────┐
     │                │
     └────────┬───────┘
              │
              ▼
        ┌──────────────┐
        │ Execute API  │
        │ Business     │
        │ Logic        │
        └──────┬───────┘
               │
               ▼
        ┌──────────────┐
        │ Return Data  │
        │ (200 OK)     │
        └──────────────┘
```

---

## 📦 What Gets Checked & Filtered

```
┌─────────────────────────────────────────────────────────────┐
│ REQUEST COMES IN                                            │
├─────────────────────────────────────────────────────────────┤
│ GET /api/customers?search=john                              │
│                                                              │
│ Headers: { Authorization: 'Bearer jwt_token...' }           │
│ User Agent: (device/browser info)                           │
│ User ID in token: 'user_123'                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION CHECK                                        │
├─────────────────────────────────────────────────────────────┤
│ ✓ Token signature valid? YES                                │
│ ✓ Token expired? NO                                         │
│ ✓ User exists? YES (user_123 found in database)             │
│ ✓ User active? YES                                          │
│                                                              │
│ Loaded User Data:                                           │
│ ├─ id: 'user_123'                                           │
│ ├─ name: 'John'                                             │
│ ├─ email: 'john@franchise-a.com'                            │
│ ├─ role: 'franchise_admin'                                  │
│ ├─ franchise_id: 'franchise_a_id'                           │
│ └─ permissions: { customers: true, vendors: false, ... }    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ AUTHORIZATION CHECKS                                        │
├─────────────────────────────────────────────────────────────┤
│ [Permission Check]                                          │
│ ✓ Has 'customers' permission? YES (customers: true)         │
│                                                              │
│ [Role Check]                                                │
│ ✓ Is 'franchise_admin' role? YES                            │
│ ✓ Can read data? YES (role level 3 ≥ required level 1)      │
│                                                              │
│ [Franchise Check]                                           │
│ ✗ Super admin? NO                                           │
│ ✓ Has franchise_id? YES (franchise_a_id)                    │
│ → Franchise filter: WHERE franchise_id = 'franchise_a_id'   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ DATABASE QUERY (Direct - NO RLS)                            │
├─────────────────────────────────────────────────────────────┤
│ SELECT * FROM customers                                     │
│ WHERE franchise_id = 'franchise_a_id'                       │
│ AND name ILIKE '%john%'                                     │
│ ORDER BY created_at DESC                                    │
│                                                              │
│ Result: 3 customers found                                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE (200 OK)                                           │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "data": [                                                 │
│     { "id": "cust_1", "name": "John Doe", ... },           │
│     { "id": "cust_2", "name": "John Smith", ... },         │
│     { "id": "cust_3", "name": "John Brown", ... }          │
│   ]                                                         │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Side-by-Side Comparison

```
CUSTOMERS API - GET /api/customers

┌────────────────────────────────┬────────────────────────────────┐
│ OLD (With RLS - 40 lines)      │ NEW (Custom Auth - 20 lines)   │
├────────────────────────────────┼────────────────────────────────┤
│                                │                                │
│ // Manual auth                 │ // Standard pattern            │
│ const authResult =             │ const authResult =             │
│   await requireAuth(...)       │   await authenticateRequest()  │
│                                │                                │
│ // Manual permission check     │ // Permission built in         │
│ const permissions =            │ if (!authResult.authorized)    │
│   await getUserPermissions()   │   return NextResponse.json()   │
│ if (!permissions.customers)    │                                │
│   return error                 │ const user = authResult.user   │
│                                │                                │
│ // Manual franchise filter     │ // Automatic franchise filter  │
│ let query = db.from(...)       │ let query = db.from(...)       │
│ if (!user.is_super_admin &&    │ query = applyFranchiseFilter() │
│     user.franchise_id) {       │                                │
│   query = query.eq(...)        │ // Execute & return            │
│ }                              │ const { data } = await query   │
│                                │ return NextResponse.json()     │
│ // Execute & return            │                                │
│ const { data } = await query   │                                │
│ return NextResponse.json()     │                                │
│                                │                                │
│ // Database ALSO checks:       │ // No database checks needed   │
│ // - RLS policies              │ // (API handles everything)    │
│ // - Duplicate logic!          │                                │
│ // - Slow!                     │                                │
│                                │                                │
└────────────────────────────────┴────────────────────────────────┘

Lines of Code:      OLD: 40+ | NEW: 20
Logic Duplication:  OLD: Yes (DB+API) | NEW: No
Debugging:          OLD: Hard (RLS) | NEW: Easy (TypeScript)
Performance:        OLD: Slow (RLS eval) | NEW: Fast (direct query)
Consistency:        OLD: Varies | NEW: Standardized
Maintenance:        OLD: Update 2 places | NEW: Update 1 place
```

---

## 💾 What's in the Database

```
USERS TABLE
┌──────────────────────────────────────┐
│ id              | TEXT               │
│ email           | TEXT               │
│ name            | TEXT               │
│ role            | TEXT               │ ← 'super_admin', 'franchise_admin', 'staff', 'readonly'
│ franchise_id    | UUID               │ ← Foreign key to franchises table
│ is_active       | BOOLEAN            │
│ permissions     | JSONB              │ ← { dashboard: true, customers: false, ... }
│ created_at      | TIMESTAMP          │
│ updated_at      | TIMESTAMP          │
└──────────────────────────────────────┘

permissions JSONB Column Example:
{
  "dashboard": true,
  "bookings": true,
  "customers": false,
  "inventory": true,
  "packages": false,
  "vendors": true,
  "quotes": true,
  "invoices": true,
  "laundry": false,
  "expenses": true,
  "deliveries": true,
  "productArchive": false,
  "payroll": false,
  "attendance": false,
  "reports": false,
  "financials": false,
  "franchises": false,
  "staff": false,
  "integrations": false,
  "settings": true
}


ALL BUSINESS TABLES (customers, vendors, bookings, etc.)
┌──────────────────────────────────────┐
│ id              | UUID               │
│ franchise_id    | UUID               │ ← All records have franchise_id
│ ... other columns ...                │
│ created_at      | TIMESTAMP          │
│ updated_at      | TIMESTAMP          │
└──────────────────────────────────────┘

NO RLS POLICIES (removed in Phase 5)
NO FOREIGN KEY CONSTRAINTS (removed in Phase 5)
API handles all validation
```

---

## 🎯 Quick Reference

| Check | Code | Returns |
|-------|------|---------|
| **Has Permission** | `hasPermission(user, 'customers')` | true/false |
| **Can Access Resource** | `canAccessResource(user, franchiseId)` | true/false |
| **Can Edit User** | `canEditUser(editor, userId, userFranchiseId)` | true/false |
| **Can Perform Role Action** | `canPerformRoleAction(user, 'franchise_admin')` | true/false |
| **Apply Franchise Filter** | `applyFranchiseFilter(query, user)` | filtered query |
| **Check Permission (Middleware)** | `await requirePermission(user, 'customers')` | {success: true/false} |
| **Check Role** | `await requireMinRole(user, 'franchise_admin')` | {success: true/false} |
| **Check Franchise Access** | `await requireFranchiseAccess(user, franchiseId)` | {success: true/false} |

---

**This is the foundation. Now we scale it to all 114 API endpoints!**
