# Permission Management Hierarchy - Complete

## The 3-Level Permission System

Now you have a complete permission management hierarchy:

### Level 1: Super Admin ⭐
- **Can edit**: ALL users, everywhere
- **Can manage permissions for**: Anyone in any franchise
- **Go to**: Staff page → Edit any user → Permissions tab

### Level 2: Franchise Admin 🏢
- **Can edit**: Staff members in their own franchise
- **Can manage permissions for**: Their franchise's staff
- **Cannot edit**: Themselves, or staff from other franchises
- **Go to**: Staff page → Find their franchise's staff → Edit → Permissions tab

### Level 3: Staff Member 👤
- **Can edit**: Nobody
- **Cannot access**: Staff management features
- **To get permissions**: Ask their franchise admin or super admin

---

## How It Works Now

### Scenario 1: Super Admin Managing Everything
```
Super Admin goes to Staff page
        ↓
Sees: All staff from all franchises
        ↓
Can Edit: Any staff member
        ↓
Can Change: Permissions, role, everything
```

### Scenario 2: Franchise Admin Managing Their Staff
```
Franchise Admin logs in
        ↓
Goes to Staff page
        ↓
Sees: Only their franchise's staff
        ↓
Can Edit: Their staff (except themselves)
        ↓
Can Change: Permissions, password, etc.
```

### Scenario 3: Staff Can't Self-Edit
```
Staff member tries to edit own profile
        ↓
Sidebar shows Staff page ✅
        ↓
Finds themselves in the list
        ↓
Clicks Edit
        ↓
Edit button is DISABLED ❌
        ↓
Error: "You cannot edit your own profile"
```

---

## Detailed Permission Rules

### Who Can Edit Whom?

| Editor | Can Edit | Cannot Edit |
|--------|----------|-------------|
| **Super Admin** | Anyone | (Nobody blocked) |
| **Franchise Admin** | Own franchise staff (except self) | Other franchises, themselves |
| **Staff** | Nobody | Everyone |
| **Read Only** | Nobody | Everyone |

### What Can They Change?

✅ **Super Admin can change**:
- Name, Email, Password
- Role (staff → franchise_admin → super_admin)
- Franchise assignment
- All 20 permissions
- Active/Inactive status

✅ **Franchise Admin can change**:
- Name, Email, Password (of their staff)
- Permissions (of their staff)
- Active/Inactive status
- ❌ Cannot change role (that requires super admin)
- ❌ Cannot move staff to different franchise

✅ **Staff cannot change**:
- Anything about anyone (including themselves)
- View-only access to user list

---

## Step-by-Step: Franchise Admin Managing Staff

### 1. Go to Staff Page
- Click **Staff** in sidebar
- Automatically filtered to show only your franchise's staff

### 2. See Your Team
```
Staff page shows:
✅ Your franchise's staff
✅ Their roles
✅ Their permissions count
✅ Their active status
❌ Staff from other franchises (not visible)
```

### 3. Edit a Staff Member
- Find staff member in list
- Click three dots menu ⋮
- Click **Edit** (now ENABLED for franchise admin!)
- **Edit button disabled?** Only if:
  - You're trying to edit yourself, OR
  - The staff member is from another franchise

### 4. Manage Their Permissions
- Click **Permissions** tab
- See 4 categories:
  - Main Navigation (Dashboard, Bookings, Customers, etc.)
  - Business Operations (Quotes, Invoices, Laundry, etc.)
  - Analytics & Reports (Reports, Financials)
  - Administration (Staff, Settings - you can't give them Staff!)
- Check/uncheck permissions
- Click **Update Staff Member**

### 5. Changes Take Effect
- Immediately in database
- User sees changes on next refresh or login
- They can now access enabled features

---

## Step-by-Step: Super Admin Managing Everything

### 1. Go to Staff Page
- Click **Staff** in sidebar
- See: ALL staff from ALL franchises

### 2. Search and Find
```
See options to:
✅ Search by name/email
✅ Filter by role (Super Admin, Franchise Admin, Staff, Read Only)
✅ Filter by franchise
✅ See pagination
```

### 3. Edit Anyone
- Click three dots menu ⋮
- Click **Edit** (ALWAYS enabled for super admin)
- Edit any field:
  - ✅ Name, Email, Password
  - ✅ Role (can promote to franchise_admin or super_admin)
  - ✅ Franchise
  - ✅ All 20 permissions
  - ✅ Active/Inactive

### 4. Examples

**Example A: Promote staff to franchise admin**
1. Find staff member
2. Edit → Basic Information tab
3. Change Role to "Franchise Admin"
4. Change Franchise to their franchise
5. Go to Permissions tab
6. Enable: Vendors, Packages, Payroll, Reports, Staff, etc.
7. Save → They're now a franchise admin!

**Example B: Give read-only access**
1. Find user
2. Edit → Permissions tab
3. Uncheck everything except Dashboard
4. Uncheck Staff, Integrations (those are admin-only)
5. Save → They only see Dashboard

**Example C: Create custom role**
1. Find user
2. Edit → Permissions tab
3. Select specific permissions
4. Example: Only Bookings + Customers + Invoices
5. Save → Custom role created!

---

## Permission Categories

### Main Navigation (6 items)
Everyone should have at least Dashboard. Typical staff has 4-6:
- Dashboard (always)
- Bookings (for booking staff)
- Customers (for booking/sales staff)
- Inventory (for ops staff)
- Packages (for package managers)
- Vendors (for vendor managers)

### Business Operations (8 items)
Department-specific, checked by role:
- Quotes (sales staff)
- Invoices (accounting/sales)
- Laundry (laundry dept)
- Expenses (accounting/finance)
- Deliveries (ops/delivery)
- Product Archive (ops)
- Payroll (HR/accounting)
- Attendance (HR/management)

### Analytics & Reports (2 items)
Usually only managers:
- Reports (managers, super admin)
- Financials (finance team, managers)

### Administration (4 items)
**Only Super Admin and Franchise Admin should have these**:
- ⭐ Franchises (ONLY super admin)
- ⭐ Integrations (ONLY super admin)
- 🏢 Staff (can be given to managers by franchise admin)
- ⚙️ Settings (usually everyone)

---

## API Enforcement (Under the Hood)

The API already enforces franchise isolation:

```typescript
// When franchise admin tries to update staff:
if (!user.is_super_admin && targetFranchise !== user.franchise_id) {
  return "Unauthorized: different franchise"
}

// Only super admin can change to super_admin role:
if (!user.is_super_admin && newRole === 'super_admin') {
  return "Unauthorized to assign role super_admin"
}

// Only super admin sees/edits franchises:
if (!user.is_super_admin && permission === 'franchises') {
  return "Unauthorized"
}
```

**Result**: Even if someone manipulates the UI, API blocks unauthorized changes!

---

## FAQ for Franchise Admins

**Q: Why can't I edit staff from other franchises?**
A: Each franchise admin manages their own franchise only. Super admin can move staff between franchises.

**Q: Can I change someone's role to Franchise Admin?**
A: No. Only super admin can promote to Franchise Admin or Super Admin roles. You can customize permissions instead.

**Q: Can I give someone access to my franchise's reporting?**
A: Yes! Edit them → Permissions tab → Check "Reports" and "Financials"

**Q: My staff member asks for access to Vendors. How do I enable it?**
A: Edit them → Permissions tab → Check "Vendors" under Main Navigation → Save. They'll have access on next refresh.

**Q: Why is my Edit button disabled?**
A: Only if you're trying to edit yourself. Ask super admin or another franchise admin for help.

---

## FAQ for Super Admins

**Q: Can I give a franchise admin more control?**
A: Yes. Edit them → Permissions tab → Give them "Staff" permission so they can manage their staff.

**Q: How do I create a manager role?**
A: Edit staff → Role: Staff → Permissions tab → Give them Reports, Financials, Attendance, Staff → Save

**Q: Can I transfer a staff member between franchises?**
A: Yes. Edit them → Basic Information tab → Change Franchise → Save

**Q: What's the difference between Staff permissions and Staff role?**
A: **Staff role** = their job title (Staff, Franchise Admin, Super Admin)
**Staff permission** = can they access the Staff management page to edit others

---

## Security Model

### Authentication
- User logs in with email/password
- Session verified with Supabase Auth

### Authorization - Three Layers

1. **Role-Based Access Control (RBAC)**
   - Super Admin > Franchise Admin > Staff > Read Only
   - Different menu items visible by role

2. **Permission-Based Access Control (PBAC)**
   - 20 individual permissions
   - Super admin can customize per-user
   - API checks each permission for each request

3. **Franchise Isolation**
   - Franchise admins only see their franchise's data
   - Staff only see their franchise's data
   - Super admin sees all franchises

### Protection
✅ UI shows only what they can do
✅ API blocks unauthorized requests with 403 Forbidden
✅ Database enforces role/franchise checks
✅ Timestamps tracked for audit

---

## Workflow Examples

### Workflow 1: Onboarding New Franchise Admin

```
Super Admin:
1. Staff page → Add New → Create user
2. Role: Franchise Admin
3. Franchise: Their franchise
4. Permissions: Check all except Franchises & Integrations
5. Save

Franchise Admin login:
→ Can see their franchise's staff
→ Can edit staff permissions
→ Can customize each staff member's access
```

### Workflow 2: Promote Staff to Manager

```
Franchise Admin:
1. Staff page → Find staff member
2. Edit → Basic Information
3. (Cannot change role, ask super admin)
4. Edit → Permissions tab
5. Check: Reports, Financials, Attendance, Payroll
6. Save

OR

Super Admin:
1. Staff page → Find staff member
2. Edit → Basic Information → Role: "franchise_admin"
3. Edit → Permissions tab → Customize permissions
4. Save
```

### Workflow 3: Revoke Access

```
Franchise Admin:
1. Staff page → Find staff member
2. Edit → Permissions tab
3. Uncheck permissions they shouldn't have
4. Save
→ Next time they try, get 403 error
```

---

## Summary

| Aspect | Super Admin | Franchise Admin | Staff |
|--------|-------------|-----------------|-------|
| Can edit | Anyone | Own franchise staff | Nobody |
| Can manage permissions | Yes | Yes (own franchise) | No |
| Can see other franchises | Yes | No | No |
| Can promote roles | Yes | No | No |
| Can change permissions | Yes | Yes (own franchise) | No |
| Edit self | Yes | No | No |
| Staff page access | Yes | Yes | No |

---

**Status**: ✅ DEPLOYED
**Commit**: `47a9a47`
**Date**: 9 November 2025
**Build**: ✓ Zero errors

Now franchise owners can manage their own staff completely independently!
