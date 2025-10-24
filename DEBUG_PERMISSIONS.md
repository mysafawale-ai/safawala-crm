# 🔍 DEBUGGING GUIDE: Permission Checkboxes Not Matching Sidebar

## ✅ STEPS TO FIX PERMISSION ISSUES

### Step 1: Clear Browser Cache & LocalStorage
```bash
# Open Browser Console (F12) and run:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Step 2: Check User Permissions in Database
Run this SQL in Supabase:
```sql
-- Check current user permissions
SELECT 
  email,
  role,
  permissions,
  jsonb_object_keys(permissions) as permission_keys
FROM users 
WHERE email = 'new@safawala.com';

-- Count permissions
SELECT 
  email,
  role,
  (SELECT COUNT(*) FROM jsonb_each(permissions) WHERE value::text = 'true') as enabled,
  (SELECT COUNT(*) FROM jsonb_each(permissions) WHERE value::text = 'false') as disabled
FROM users
WHERE email = 'new@safawala.com';
```

### Step 3: Run Migration to Update to 22 Permissions
```sql
-- If users still have 15 old permissions, run:
-- (See: scripts/MIGRATE_TO_22_PERMISSIONS.sql)

-- Quick fix: Update specific user
UPDATE users 
SET permissions = jsonb_build_object(
  'dashboard', true,
  'bookings', true,
  'customers', true,
  'inventory', true,
  'packages', false,
  'vendors', false,
  'quotes', false,
  'invoices', false,
  'laundry', false,
  'expenses', false,
  'deliveries', false,
  'productArchive', false,
  'payroll', false,
  'attendance', false,
  'reports', false,
  'financials', false,
  'franchises', false,
  'staff', false,
  'integrations', false,
  'settings', false
),
updated_at = NOW()
WHERE email = 'new@safawala.com';
```

### Step 4: Verify Sidebar Permission Mapping
```bash
# Check sidebar navigation items match permissions
cd /Applications/safawala-crm
grep -A 5 "permission:" components/layout/app-sidebar.tsx | grep -E "(title:|permission:)"
```

Expected output:
```
title: "Dashboard"      → permission: "dashboard"
title: "Bookings"       → permission: "bookings"
title: "Customers"      → permission: "customers"
title: "Inventory"      → permission: "inventory"
title: "Packages"       → permission: "packages"
title: "Vendors"        → permission: "vendors"
title: "Quotes"         → permission: "quotes"
title: "Invoices"       → permission: "invoices"
title: "Laundry"        → permission: "laundry"
title: "Expenses"       → permission: "expenses"
title: "Deliveries & Returns" → permission: "deliveries"
title: "Product Archive" → permission: "productArchive"
title: "Payroll"        → permission: "payroll"
title: "Attendance"     → permission: "attendance"
title: "Reports"        → permission: "reports"
title: "Financials"     → permission: "financials"
title: "Franchises"     → permission: "franchises" (super_admin only)
title: "Staff"          → permission: "staff"
title: "Integrations"   → permission: "integrations" (super_admin only)
title: "Settings"       → permission: "settings"
```

### Step 5: Test Permission Dialog
1. Login as super_admin (e.g., surat@safawala.com)
2. Go to `/staff`
3. Click "Add Staff Member"
4. Check "Permissions" tab
5. Verify you see 4 categories:
   - **Main Navigation**: 6 permissions
   - **Business Operations**: 8 permissions
   - **Analytics & Reports**: 2 permissions
   - **Administration**: 4 permissions (only super_admin), 2 permissions (others)

### Step 6: Test as Franchise Admin
1. Login as franchise_admin
2. Go to `/staff`
3. Click "Add Staff Member"
4. Check "Permissions" tab
5. Verify Administration section shows only:
   - ✅ Staff
   - ✅ Settings
   - ❌ Franchises (hidden)
   - ❌ Integrations (hidden)

### Step 7: Test Sidebar Filtering
```javascript
// Open browser console on staff page and run:
const user = JSON.parse(localStorage.getItem('safawala_user') || '{}');
console.log('User permissions:', user.permissions);

// Count enabled permissions
const enabled = Object.entries(user.permissions || {}).filter(([k,v]) => v === true);
console.log('Enabled permissions:', enabled.map(([k]) => k));
console.log('Total enabled:', enabled.length);
```

### Step 8: Verify Sidebar Shows Correct Items
For user with only `dashboard`, `bookings`, `customers`, `inventory` enabled:

**Expected sidebar items:**
```
Main:
  ✅ Dashboard
  ✅ Bookings
  ✅ Customers
  ✅ Inventory
  ❌ Packages (not shown)
  ❌ Vendors (not shown)

Business:
  ❌ All hidden (no permissions)

Analytics:
  ❌ All hidden (no permissions)

Admin:
  ❌ All hidden (no permissions)
```

## 🐛 COMMON ISSUES & FIXES

### Issue 1: Sidebar shows all items despite limited permissions
**Cause**: Old permissions in localStorage  
**Fix**: Clear localStorage and refresh

### Issue 2: Permission dialog shows all 22 for non-super-admin
**Cause**: `getVisibleCategories()` not being called correctly  
**Fix**: Already fixed - franchises & integrations hidden from non-super-admins

### Issue 3: Checkboxes don't match sidebar
**Cause**: Database has old 15 permissions, UI expects 22  
**Fix**: Run migration SQL script

### Issue 4: Staff can see Franchises/Integrations
**Cause**: Database permissions have these set to true  
**Fix**: Update database to set `franchises=false` and `integrations=false`

## 📊 QUICK VERIFICATION CHECKLIST

- [ ] User has 22 permission keys in database (not 15)
- [ ] LocalStorage cleared after permission changes
- [ ] Super admin sees 22 checkboxes (4 in Administration)
- [ ] Franchise admin sees 20 checkboxes (2 in Administration)
- [ ] Staff with limited permissions only sees matching sidebar items
- [ ] Franchises & Integrations hidden from non-super-admins

## 🚀 DEPLOYMENT STEPS

1. **Update all existing users:**
   ```sql
   -- Run full migration
   \i scripts/MIGRATE_TO_22_PERMISSIONS.sql
   ```

2. **Force all users to re-login:**
   ```sql
   -- Clear all sessions (optional)
   UPDATE users SET updated_at = NOW();
   ```

3. **Test with each role:**
   - Super Admin → Should see all 22 permissions
   - Franchise Admin → Should see 20 permissions
   - Staff → Should see 20 permissions
   - Readonly → Should see 20 permissions

4. **Verify sidebar filtering:**
   - Each user should only see items they have permission for
   - No items with permission=false should appear

## 📝 NOTES

- **Permission system is now 100% DB-driven** - No role-based overrides
- **Franchises & Integrations are super_admin exclusive**
- **Each sidebar item = 1 specific permission**
- **Staff dialog shows only relevant permissions per role**
