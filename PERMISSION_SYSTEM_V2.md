# New Permission System - Show All, Super Admin Controls

## What Changed

We completely redesigned the permission system to be **super admin controlled**:

### Before ❌
- Permissions hardcoded by role in code
- Sidebar filtered items based on permissions
- Users couldn't see what features existed
- Hard to customize per-user access

### After ✅
- **All menu items shown to everyone by default**
- **Super admin manages permissions per user in Staff page**
- **Permission enforcement at API level (not UI level)**
- Users see all features, but API blocks unauthorized access
- Full flexibility for per-user customization

---

## How It Works Now

### 1. Sidebar Shows Everything
```
All users now see:
✅ Dashboard
✅ Bookings
✅ Customers
✅ Inventory
✅ Packages          ← Now visible
✅ Vendors          ← Now visible
✅ Quotes
✅ Invoices
✅ Laundry
✅ Expenses
✅ Deliveries
✅ Product Archive
✅ Payroll
✅ Attendance
✅ Reports
✅ Financials
✅ Staff
✅ Franchises (for super admin)
✅ Integrations (for super admin)
✅ Settings
```

### 2. API Enforces Permissions
When a user clicks a menu item or accesses an endpoint, the **API checks permissions** before returning data.

Example API check:
```typescript
// GET /api/vendors
const auth = await authenticateRequest(request, { 
  requirePermission: 'vendors'  // ← API will check this
})

if (!auth.authorized) {
  return 403 Forbidden
}
```

### 3. Super Admin Manages Access
Super admin goes to **Staff** page and manages each user's permissions:

1. Click **Staff** menu
2. Find a user and click **Edit**
3. Go to **Permissions** tab
4. Check/uncheck what they can access
5. Save

**Result**: That user's API requests will be blocked if they don't have permission.

---

## User Scenarios

### Scenario 1: Franchise Admin
- **Sees**: All menu items
- **Can access**: Bookings, Customers, Inventory, Packages, Vendors, etc.
- **Cannot access**: Franchises, Integrations (API returns 403)
- **Super admin control**: Can customize which modules each franchise admin sees

### Scenario 2: Staff Member
- **Sees**: All menu items
- **Can access**: Bookings, Customers, Inventory (by default)
- **Cannot access**: Vendors, Payroll, Reports (API returns 403)
- **Super admin control**: Can give additional permissions to specific staff

### Scenario 3: Read Only User
- **Sees**: All menu items
- **Can access**: Dashboard only (by default)
- **Cannot access**: Everything else (API returns 403)
- **Super admin control**: Can enable specific read-only views

---

## Key Features

### ✅ All Items Shown
No more "Where's the Vendors menu?" - everything is visible upfront

### ✅ Super Admin Control
Go to **Staff** page and use the **Permissions** tab to control access

### ✅ API Enforcement
Even if someone inspects the code or manipulates localStorage, API won't let them access restricted endpoints

### ✅ No Self-Edit
Staff members **cannot edit their own permissions**:
- Edit button is **disabled** for own profile
- Shows error message if they try
- Only super admin can modify staff permissions

### ✅ Per-User Customization
Each user can have completely different permission set:
- Franchise Admin A → Has Vendors, Payroll
- Franchise Admin B → Only has Bookings, Inventory
- Staff Member 1 → Has Quotes
- Staff Member 2 → Has Deliveries

---

## How to Use

### For Super Admin - Managing Permissions

1. **Go to Staff page**
   - Click "Staff" in sidebar
   - Or go to `/staff`

2. **Find the user to manage**
   - Use search to find by name/email
   - Click the three dots menu
   - Click "Edit"

3. **Manage permissions**
   - Click "Permissions" tab
   - Check/uncheck modules they should access
   - Click "Update Staff Member"
   - User permissions updated immediately

4. **Users see changes on next login**
   - If already logged in, they'll see changes on page refresh
   - New menu items become accessible
   - API requests now allowed/blocked based on new permissions

### For Users - Accessing Features

1. **Check sidebar**
   - All menu items visible
   - Click on any module

2. **If access blocked**
   - You'll see a 403 Forbidden error
   - Ask super admin to enable that permission in Staff page
   - Or ask to update your role

3. **Settings always available**
   - Everyone can access Settings
   - Change password, manage profile
   - Allowed by default for all users

---

## Permission Categories

### Main Navigation
- Dashboard
- Bookings
- Customers
- Inventory
- Packages
- Vendors

### Business Operations
- Quotes
- Invoices
- Laundry
- Expenses
- Deliveries & Returns
- Product Archive
- Payroll
- Attendance

### Analytics & Reports
- Reports
- Financials

### Administration
- Franchises (super admin only)
- Staff (super admin only)
- Integrations (super admin only)
- Settings

---

## Default Permissions by Role

### Super Admin
All 20 permissions enabled by default

### Franchise Admin
Dashboard, Bookings, Customers, Inventory, Packages, Vendors, Quotes, Invoices, Laundry, Expenses, Deliveries, Product Archive, Payroll, Attendance, Reports, Financials, Staff, Settings
(Franchises & Integrations disabled)

### Staff
Dashboard, Bookings, Customers, Inventory, Quotes, Invoices, Settings
(All others disabled by default)

### Read Only
Dashboard, Settings
(Everything else disabled by default)

**Super admin can override any of these defaults!**

---

## Checking Your Permissions

### In Browser Console
```javascript
// Open DevTools Console, paste:
const user = JSON.parse(localStorage.getItem('safawala_user'));
console.table(user?.permissions);
```

### In Staff Page
- Go to Staff page
- Find your user
- Click Edit → Permissions tab
- See all your current permissions

### By Trying to Access
- Try accessing a module
- If sidebar item visible but API returns 403 → Permission denied
- Ask super admin to enable in Staff page

---

## API Permission Enforcement

Every API endpoint checks permissions. Examples:

```typescript
// /api/vendors → Checks 'vendors' permission
// /api/packages → Checks 'packages' permission
// /api/staff → Checks 'staff' permission
// /api/franchises → Checks 'franchises' permission
// /api/reports/export → Checks 'reports' permission
```

**If permission missing or false**: API returns `403 Forbidden` with error message

**If permission true**: API processes request normally

---

## Troubleshooting

### "I see the menu item but get 403 error"
- Permission not enabled in database
- Ask super admin to enable in Staff → Edit → Permissions

### "I can't edit my own profile"
- That's correct! Only super admin can manage staff permissions
- Ask super admin to edit your profile
- Staff members can only change own password in Settings

### "Menu item missing"
- **Old behavior** - Now fixed!
- All menu items should be visible
- Refresh browser (Cmd+Shift+R)
- Clear localStorage if needed: `localStorage.clear()`

### "Permissions changed but still blocked"
- API caches may take a moment to update
- Refresh page (Cmd+Shift+R)
- Or logout and login again

---

## Summary

| Feature | Before | After |
|---------|--------|-------|
| Menu visibility | Role-based filtering | Show all by default |
| Permission control | Code-based | Super admin controlled |
| API enforcement | Basic role check | Full permission check |
| Per-user customization | Not possible | Fully supported |
| Staff editing own perms | Possible (security issue) | Disabled ✅ |
| UI vs API enforcement | UI filters | API enforces |

---

**Status**: ✅ DEPLOYED
**Commit**: `c880802`
**Date**: 9 November 2025
**Impact**: All users now see all features, super admin has full control
