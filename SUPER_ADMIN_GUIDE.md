# Super Admin Permission Management Guide

## Quick Start

You can now fully control what each user can access!

---

## Step-by-Step: Give a User New Permission

### 1. Go to Staff Page
- Click **Staff** in sidebar
- Or type `/staff` in URL

### 2. Find the User
- Use search box to find by name or email
- Or scroll through the list

### 3. Click Edit
- Click the three dots menu ⋮
- Click **Edit**

### 4. Go to Permissions Tab
- Dialog opens with user's info
- Click **Permissions** tab (not Basic Information)

### 5. Check Permissions
In the Permissions tab, you'll see 4 categories:

**Main Navigation**
- ☐ Dashboard
- ☐ Bookings
- ☐ Customers
- ☐ Inventory
- ☐ Packages ← Click to enable Packages
- ☐ Vendors ← Click to enable Vendors

**Business Operations**
- ☐ Quotes
- ☐ Invoices
- ☐ Laundry
- ☐ Expenses
- ☐ Deliveries & Returns
- ☐ Product Archive
- ☐ Payroll
- ☐ Attendance

**Analytics & Reports**
- ☐ Reports
- ☐ Financials

**Administration** (only you see these)
- ☐ Staff
- ☐ Integrations
- ☐ Settings

### 6. Save Changes
- Click **Update Staff Member** button
- Toast shows "Staff member updated successfully!"

### 7. User Sees Changes
- **If logged in**: Refresh page, new permissions active
- **If logged out**: Permissions active on next login

---

## Common Tasks

### Give Franchise Admin Full Access
1. Go to Staff
2. Find franchise admin
3. Edit → Permissions tab
4. Check all items except:
   - ❌ Franchises (only super admin)
   - ❌ Integrations (only super admin)
5. Save

### Give Staff Limited Access
1. Go to Staff
2. Find staff member
3. Edit → Permissions tab
4. Check only:
   - ✅ Dashboard
   - ✅ Bookings
   - ✅ Customers
   - ✅ Inventory
   - ✅ Settings (always checked)
5. Save

### Enable Just Vendors for Someone
1. Go to Staff
2. Find user
3. Edit → Permissions tab
4. Under "Main Navigation", check only:
   - ✅ Vendors
5. Save
(They'll need other permissions too to be productive - at minimum Dashboard + Bookings)

### Add Reporting Permissions
1. Go to Staff
2. Find user
3. Edit → Permissions tab
4. Under "Analytics & Reports", check:
   - ✅ Reports
   - ✅ Financials
5. Save

### Restrict Someone's Access
1. Go to Staff
2. Find user
3. Edit → Permissions tab
4. Uncheck modules they shouldn't access
5. Save
(They'll still see menu items but get 403 error when trying to access)

---

## What Users See

### Before Changes
**Sidebar**: Vendors & Packages might be hidden
**API**: Blocked

### After You Check "Vendors"
**Sidebar**: User can now see "Vendors" menu item ✅
**API**: User can now access `/api/vendors` ✅

### If You Uncheck "Reports"
**Sidebar**: User still sees "Reports" menu item
**API**: User gets 403 Forbidden when trying to access `/api/reports`

---

## Key Points

✅ **Show All**: Users see all menu items by default
✅ **You Control**: Check/uncheck in Permissions tab to enable/disable
✅ **API Enforces**: Even if user manually changes localStorage, API blocks them
✅ **Instant**: Changes take effect on page refresh (or next login)
✅ **No Self-Edit**: Staff can't edit their own permissions (Edit button disabled)
✅ **Safe**: All permission checks at API level

---

## Permission Categories Explained

### Main Navigation
Features most users access daily:
- Bookings, Customers, Inventory, Packages, Vendors

### Business Operations
Secondary features, department-specific:
- Quotes, Invoices, Laundry, Expenses, Deliveries, Payroll, Attendance

### Analytics & Reports
Data analysis and reporting:
- Reports, Financials
(Usually for managers/admins)

### Administration
System management (only visible to you):
- Franchises, Staff, Integrations
(Non-super-admin users never see these)

---

## Troubleshooting

### User Says "I Don't Have Permission"
1. Go to Staff
2. Find the user
3. Edit → Permissions tab
4. Check the checkbox for that feature
5. Save
6. User refreshes page → Access granted

### User Changed Settings But I Don't See Them
1. Some settings cache on the client
2. Ask user to:
   - Refresh page (Cmd+Shift+R)
   - Or logout/login
3. Settings should sync

### Can't Edit a User
- Only super admin can edit users
- Ask another super admin if you don't have access
- Check that your user has "Staff" permission

### User Says All Menu Items Hidden
- Shouldn't happen with new system
- Ask them to refresh (Cmd+Shift+R)
- Check localStorage: `localStorage.clear()`
- Have them logout/login

---

## Default Permission Sets

Use these as templates:

### Template: Franchise Admin
- ✅ All Main Navigation
- ✅ All Business Operations  
- ✅ All Analytics & Reports
- ✅ Staff + Settings
- ❌ Franchises, Integrations

### Template: Accounting Staff
- ✅ Dashboard
- ✅ Customers
- ✅ Inventory (read only)
- ✅ Quotes
- ✅ Invoices
- ✅ Expenses
- ✅ Payroll
- ✅ Reports
- ✅ Financials
- ✅ Settings

### Template: Booking Staff
- ✅ Dashboard
- ✅ Bookings
- ✅ Customers
- ✅ Inventory
- ✅ Quotes
- ✅ Deliveries
- ✅ Settings

### Template: Manager
- ✅ Everything except:
- ❌ Franchises
- ❌ Integrations
- ❌ Staff (if you don't want them managing other staff)

---

## API Permission Checks

Under the hood, the system checks:

| Endpoint | Checks | Role |
|----------|--------|------|
| `/api/vendors` | `vendors` permission | Any |
| `/api/packages` | `packages` permission | Any |
| `/api/bookings` | `bookings` permission | Any |
| `/api/staff` | `staff` permission | Admin only |
| `/api/franchises` | `franchises` permission | Super admin only |
| `/api/reports/export` | `reports` permission | Any |
| `/api/settings/*` | `settings` permission | Any |

If permission missing → **403 Forbidden**
If permission enabled → **200 OK** (request proceeds)

---

## Best Practices

1. **Give Default Roles First**
   - New staff? Start with Staff defaults
   - New franchise admin? Start with Franchise Admin defaults

2. **Customize Only When Needed**
   - Don't overcomplicate permissions
   - Give broad access by role, restrict exceptions

3. **Review Quarterly**
   - Check Staff → see all permissions
   - Remove access from inactive staff
   - Add permissions for promoted staff

4. **Test Changes**
   - After editing permissions
   - Ask user to refresh page
   - Verify they can now access feature

5. **Document Changes**
   - Use Staff notes field to track why someone has certain access
   - Helps future super admins understand setup

---

**Questions?** Check `/help` or contact development team.

**Last Updated**: 9 November 2025
**Version**: 2.0 (All-items visible, super-admin controlled)
