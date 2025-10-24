# 🧪 QUICK TEST GUIDE: Permission-Based Dashboard

## ✅ WHAT WAS FIXED

### Problem 1: Dashboard shown when permission not given
**Solution:** User redirected to `/bookings` with error toast if `permissions.dashboard = false`

### Problem 2: Booking Calendar showing "no permission" error
**Solution:** Booking Calendar only renders if `permissions.bookings = true`  
**Result:** No more 403 errors! Component simply doesn't load.

---

## 🚀 HOW TO TEST

### Test 1: User WITHOUT dashboard permission
```sql
-- Update test user to disable dashboard
UPDATE users 
SET permissions = jsonb_set(
  permissions, 
  '{dashboard}', 
  'false'::jsonb
)
WHERE email = 'new@safawala.com';
```

**Expected:**
1. Clear localStorage: `localStorage.clear()` in console
2. Re-login as new@safawala.com
3. Try to access `/dashboard`
4. ✅ Should redirect to `/bookings` immediately
5. ✅ Should see toast: "You don't have permission to access the dashboard"

---

### Test 2: User WITH dashboard but WITHOUT bookings permission
```sql
-- Enable dashboard, disable bookings
UPDATE users 
SET permissions = jsonb_set(
  jsonb_set(permissions, '{dashboard}', 'true'::jsonb),
  '{bookings}', 
  'false'::jsonb
)
WHERE email = 'new@safawala.com';
```

**Expected:**
1. Clear localStorage: `localStorage.clear()`
2. Re-login as new@safawala.com
3. Go to `/dashboard`
4. ✅ Dashboard page loads successfully
5. ✅ Total Revenue card visible
6. ✅ Avg Booking Value card visible
7. ✅ Low Stock Alert card visible
8. ❌ Total Bookings card HIDDEN
9. ❌ Booking Calendar section NOT shown (no 403 error!)
10. ❌ Recent Activity section NOT shown
11. ❌ Quick Actions shows "No quick actions available"

**Console check:**
```javascript
// Should have NO 403 errors
// Should NOT see "BookingCalendar" component logs
```

---

### Test 3: User WITH dashboard AND bookings permission
```sql
-- Enable both
UPDATE users 
SET permissions = jsonb_set(
  jsonb_set(permissions, '{dashboard}', 'true'::jsonb),
  '{bookings}', 
  'true'::jsonb
)
WHERE email = 'new@safawala.com';
```

**Expected:**
1. Clear localStorage: `localStorage.clear()`
2. Re-login as new@safawala.com
3. Go to `/dashboard`
4. ✅ Dashboard page loads
5. ✅ ALL 4 stats cards visible (including Total Bookings)
6. ✅ Booking Calendar rendered with no errors
7. ✅ Recent Activity section shown
8. ✅ Quick Actions shows "Create Product Order" and "Book Package"

---

### Test 4: Selective permissions (dashboard + bookings + customers)
```sql
UPDATE users 
SET permissions = jsonb_build_object(
  'dashboard', true,
  'bookings', true,
  'customers', true,
  'inventory', false,
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
)
WHERE email = 'new@safawala.com';
```

**Expected Quick Actions:**
- ✅ Create Product Order
- ✅ Book Package
- ✅ Add New Customer
- ❌ Manage Inventory (hidden)

---

## 🔍 DEBUGGING COMMANDS

### Check user permissions in database
```sql
SELECT 
  email,
  permissions->>'dashboard' as dashboard_perm,
  permissions->>'bookings' as bookings_perm,
  permissions->>'customers' as customers_perm,
  permissions->>'inventory' as inventory_perm
FROM users 
WHERE email = 'new@safawala.com';
```

### Check permissions in browser
```javascript
// Open console on dashboard page
const user = JSON.parse(localStorage.getItem('safawala_user') || '{}');
console.log('All permissions:', user.permissions);
console.log('Dashboard:', user.permissions?.dashboard);
console.log('Bookings:', user.permissions?.bookings);
```

### Force refresh permissions
```javascript
// Clear and re-login
localStorage.clear();
sessionStorage.clear();
location.href = '/';
```

---

## ✅ SUCCESS CRITERIA

### ✓ No 403 Errors
- User without bookings permission should NOT see booking calendar
- Console should be clean (no API 403 errors)

### ✓ Proper Redirects  
- User without dashboard permission redirected to `/bookings`
- Toast error message shown

### ✓ Clean UI
- Users only see stats/sections they have permission for
- No empty/broken sections
- Quick Actions shows relevant buttons only

### ✓ Sidebar Matches Dashboard
- If user can see "Bookings" in sidebar, they should see booking features on dashboard
- If "Bookings" NOT in sidebar, dashboard should hide booking-related sections

---

## 🎯 EXPECTED RESULTS BY PERMISSION COMBO

| Permissions | Dashboard Access | Booking Calendar | Total Bookings Card | Quick Actions Count |
|-------------|-----------------|------------------|---------------------|---------------------|
| `dashboard: false` | ❌ Redirect | N/A | N/A | N/A |
| `dashboard: true, bookings: false` | ✅ Yes | ❌ Hidden | ❌ Hidden | 0-2 (depends on customers/inventory) |
| `dashboard: true, bookings: true` | ✅ Yes | ✅ Shown | ✅ Shown | 2-4 (depends on customers/inventory) |
| All 22 permissions `true` | ✅ Yes | ✅ Shown | ✅ Shown | 4 buttons |

---

## 📸 VISUAL VERIFICATION

### Dashboard WITHOUT bookings permission should look like:
```
┌─────────────────────────────────────────┐
│ Dashboard                               │
│ Welcome back, User!                     │
├──────────┬──────────┬──────────┬────────┤
│ Revenue  │ [EMPTY]  │ Avg Val  │ Stock  │
├──────────┴──────────┴──────────┴────────┤
│                                         │
│ [No Booking Calendar section]           │
│                                         │
│ [No Recent Activity section]            │
│                                         │
└─────────────────────────────────────────┘
```

### Dashboard WITH bookings permission should look like:
```
┌─────────────────────────────────────────┐
│ Dashboard                               │
│ Welcome back, User!                     │
├──────────┬──────────┬──────────┬────────┤
│ Revenue  │ Bookings │ Avg Val  │ Stock  │
├─────────────────────────────────────────┤
│     📅 Booking Calendar                 │
│  [Calendar with color-coded dates]      │
├─────────────────────────────────────────┤
│     Recent Activity                     │
│  [List of 5 recent bookings]            │
│  [View All Bookings button]             │
└─────────────────────────────────────────┘
```

---

## 🐛 IF STILL SEEING ERRORS

1. **Clear browser cache completely**
   - Chrome: Cmd+Shift+Delete → Check all boxes
   - Or: Settings → Privacy → Clear browsing data

2. **Check database permissions**
   ```sql
   SELECT * FROM users WHERE email = 'new@safawala.com';
   ```

3. **Force logout all sessions**
   ```sql
   DELETE FROM auth.sessions WHERE user_id = (
     SELECT id FROM users WHERE email = 'new@safawala.com'
   );
   ```

4. **Verify code changes deployed**
   ```bash
   cd /Applications/safawala-crm
   git log --oneline -1
   # Should show: "Fix: Permission-based dashboard rendering"
   ```
