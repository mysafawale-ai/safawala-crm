# 🏢 Complete Franchise Isolation Architecture

## 📋 Overview

This implementation provides complete multi-tenant architecture with franchise isolation while giving Super Admin full visibility and their own operational franchise.

---

## 🎯 Requirements Met

### ✅ Super Admin Capabilities
- **Full Visibility**: Can view all franchise data (customers, invoices, bookings, staff, revenue)
- **HQ Franchise**: Has their own "Safawala Headquarters" franchise (HQ001)
- **Dual Mode**: 
  - Can manage all franchises (view reports, analytics, manage users)
  - Can operate their own HQ franchise (create customers, bookings, invoices)
- **No Restrictions**: RLS policies allow access to all data

### ✅ Franchise Admin Capabilities
- **Isolated Access**: Can only see data from their assigned franchise
- **Complete Control**: Full CRUD on their franchise data
- **Data Protection**: Cannot access other franchise data
- **RLS Enforced**: Database-level security prevents data leaks

### ✅ Backend Logic
- **Franchise Filter**: All queries automatically filtered by franchise_id
- **Super Admin Bypass**: Super admin queries skip franchise filter
- **Auto Assignment**: New records automatically get franchise_id
- **Access Validation**: Updates/deletes check franchise ownership
- **No Data Leaks**: Cross-franchise access blocked at multiple levels

---

## 📁 Files Created

### 1. Database Setup
**File**: `scripts/CREATE_SUPER_ADMIN_HQ_FRANCHISE.sql`
- Creates HQ franchise for super admin
- Assigns super admin to HQ franchise
- Sets up company & branding settings for HQ
- Gives super admin their operational base

### 2. Middleware Layer
**File**: `lib/middleware/franchise-isolation.ts`
- `getFranchiseContext()` - Gets user role and franchise
- `applyFranchiseFilter()` - Applies franchise filter to queries
- `getFranchiseIdForCreate()` - Gets franchise_id for new records
- `canAccessFranchise()` - Validates franchise access
- `withFranchiseIsolation()` - Wraps API handlers

### 3. Example API Implementation
**File**: `EXAMPLE_API_WITH_FRANCHISE_ISOLATION.ts`
- Shows GET with franchise filtering
- Shows POST with auto franchise assignment
- Shows PUT with access validation
- Shows DELETE with ownership check

### 4. RLS Policies
**File**: `scripts/BULLETPROOF_RLS_SETUP.sql` (Already run)
- Super admin: Full access to all tables
- Franchise users: Access only their franchise data
- Database-level enforcement

---

## 🚀 How It Works

### Super Admin Flow

```typescript
// Super Admin queries customers
const context = await getFranchiseContext()
// context.canAccessAllFranchises = true
// context.franchiseId = "hq-franchise-uuid"

let query = supabase.from("customers").select("*")
query = applyFranchiseFilter(query, context)
// No filter applied - sees ALL customers from ALL franchises

// Super Admin creates a customer
const franchiseId = getFranchiseIdForCreate(context)
// Returns HQ franchise ID - customer belongs to HQ

const customer = {
  name: "John Doe",
  franchise_id: franchiseId // HQ franchise
}
```

### Franchise Admin Flow

```typescript
// Franchise Admin queries customers
const context = await getFranchiseContext()
// context.canAccessAllFranchises = false
// context.franchiseId = "mumbai-franchise-uuid"

let query = supabase.from("customers").select("*")
query = applyFranchiseFilter(query, context)
// Filter applied: .eq("franchise_id", "mumbai-franchise-uuid")
// Sees ONLY Mumbai franchise customers

// Franchise Admin creates a customer
const franchiseId = getFranchiseIdForCreate(context)
// Returns their franchise ID - customer belongs to their franchise

const customer = {
  name: "Jane Doe",
  franchise_id: franchiseId // Mumbai franchise
}
```

---

## 📊 Data Access Matrix

| User Type | View All Franchises | Own Franchise | Create Records | Update Any | Delete Any |
|-----------|-------------------|---------------|----------------|-----------|-----------|
| **Super Admin** | ✅ Yes | ✅ HQ Franchise | ✅ In HQ | ✅ Yes | ✅ Yes |
| **Franchise Admin** | ❌ No | ✅ Their Franchise | ✅ In theirs | ❌ Own only | ❌ Own only |
| **Staff** | ❌ No | ✅ View only | ❌ Limited | ❌ No | ❌ No |

---

## 🔒 Security Layers

### Layer 1: RLS Policies (Database)
```sql
-- Super Admin Policy
CREATE POLICY "super_admin_full_access_customers" ON customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Franchise User Policy
CREATE POLICY "franchise_users_own_customers" ON customers
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.franchise_id = customers.franchise_id
        )
    );
```

### Layer 2: Middleware (Application)
```typescript
// Automatically filters queries
const query = applyFranchiseFilter(baseQuery, context)
```

### Layer 3: API Validation (Endpoints)
```typescript
// Validates franchise access before operations
if (!canAccessFranchise(context, targetFranchiseId)) {
  return { error: "Access denied" }
}
```

---

## 🛠️ Implementation Guide

### Step 1: Create HQ Franchise
Run in Supabase SQL Editor:
```sql
-- Copy entire content from:
scripts/CREATE_SUPER_ADMIN_HQ_FRANCHISE.sql
```

### Step 2: Update Existing APIs
Apply franchise isolation to your API routes:

```typescript
// Before
export async function GET() {
  const { data } = await supabase
    .from("customers")
    .select("*")
  
  return NextResponse.json({ data })
}

// After
export async function GET() {
  const context = await getFranchiseContext()
  
  let query = supabase.from("customers").select("*")
  query = applyFranchiseFilter(query, context)
  
  const { data } = await query
  
  return NextResponse.json({ 
    data,
    franchise_id: context.franchiseId,
    can_access_all: context.canAccessAllFranchises 
  })
}
```

### Step 3: Apply to All CRUD Operations

**For each API route:**
1. ✅ GET: Apply `applyFranchiseFilter()`
2. ✅ POST: Use `getFranchiseIdForCreate()`
3. ✅ PUT: Check with `canAccessFranchise()`
4. ✅ DELETE: Check with `canAccessFranchise()`

### Step 4: Update Frontend Components

Show franchise info in UI:
```typescript
const { user } = useAuth()

return (
  <div>
    {user.role === 'super_admin' ? (
      <Badge>Super Admin - All Franchises</Badge>
    ) : (
      <Badge>Franchise: {user.franchise_name}</Badge>
    )}
  </div>
)
```

---

## 📍 API Routes to Update

Apply franchise isolation to these routes:

- ✅ `/api/customers` - Customer management
- ✅ `/api/bookings` - Booking management
- ✅ `/api/products` - Product inventory
- ✅ `/api/invoices` - Invoice management
- ✅ `/api/expenses` - Expense tracking
- ✅ `/api/staff` - Staff management
- ✅ `/api/packages` - Package management
- ✅ `/api/services` - Service management
- ✅ `/api/reports` - Analytics (super admin sees all)

---

## 🧪 Testing Guide

### Test Super Admin Access

```sql
-- 1. Login as super admin
-- 2. Run this to verify HQ franchise
SELECT 
    u.email,
    u.role,
    u.franchise_id,
    f.name as franchise_name,
    f.code
FROM users u
JOIN franchises f ON f.id = u.franchise_id
WHERE u.id = auth.uid();

-- Should show: HQ001 franchise

-- 3. Test data access
SELECT COUNT(*) FROM customers; -- Should see ALL customers
SELECT COUNT(*) FROM bookings;  -- Should see ALL bookings
SELECT COUNT(*) FROM invoices;  -- Should see ALL invoices
```

### Test Franchise Admin Access

```sql
-- 1. Create test franchise admin
INSERT INTO users (email, role, franchise_id)
VALUES (
    'admin@mumbai.com', 
    'franchise_admin',
    (SELECT id FROM franchises WHERE code = 'MUM001')
);

-- 2. Login as franchise admin
-- 3. Test data access
SELECT COUNT(*) FROM customers; -- Should see ONLY Mumbai customers
SELECT COUNT(*) FROM bookings;  -- Should see ONLY Mumbai bookings

-- 4. Try accessing other franchise data
SELECT * FROM customers WHERE franchise_id != auth.franchise_id();
-- Should return empty (blocked by RLS)
```

---

## 🎨 UI Considerations

### Super Admin Dashboard
- Show "All Franchises" dropdown
- Display total revenue across all franchises
- Show per-franchise breakdown
- Allow switching between HQ operations and global view

### Franchise Admin Dashboard
- Show their franchise name prominently
- Display only their franchise metrics
- Hide franchise selector (they only have one)

### Example Component
```typescript
const Dashboard = () => {
  const { user, franchise } = useAuth()
  const isSuperAdmin = user.role === 'super_admin'

  return (
    <div>
      {isSuperAdmin ? (
        <div>
          <h1>All Franchises Dashboard</h1>
          <FranchiseSelector /> {/* Can switch views */}
          <GlobalMetrics />
        </div>
      ) : (
        <div>
          <h1>{franchise.name} Dashboard</h1>
          <FranchiseMetrics franchiseId={franchise.id} />
        </div>
      )}
    </div>
  )
}
```

---

## ⚠️ Important Notes

### Super Admin HQ Franchise
- Super admin can create customers, bookings, invoices in HQ franchise
- HQ franchise is for super admin's own operations
- When viewing reports, super admin sees ALL franchises
- When creating records, they go to HQ by default

### Franchise Transfer
- Customers/bookings cannot be transferred between franchises
- franchise_id is immutable once set
- To move data, create new record in target franchise

### Data Integrity
- All franchise_id columns are `NOT NULL`
- Foreign keys ensure referential integrity
- RLS policies enforce at database level
- Middleware enforces at application level

---

## 🚨 Migration Checklist

- [ ] Run `CREATE_SUPER_ADMIN_HQ_FRANCHISE.sql`
- [ ] Verify super admin has HQ franchise assigned
- [ ] Update all API routes with franchise isolation
- [ ] Test super admin can see all data
- [ ] Create test franchise admin
- [ ] Test franchise admin can only see their data
- [ ] Update UI components to show franchise info
- [ ] Add franchise selector for super admin
- [ ] Test cross-franchise access is blocked
- [ ] Verify RLS policies are working

---

## 📞 Support

If you encounter issues:
1. Check RLS policies are enabled
2. Verify user has franchise_id assigned
3. Check middleware is applied to API routes
4. Review console logs for franchise context
5. Test with both super admin and franchise admin

---

**Status**: ✅ Ready for implementation
**Last Updated**: October 10, 2025
