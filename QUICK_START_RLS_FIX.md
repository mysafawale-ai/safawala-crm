# 🚀 QUICK START - Super Admin RLS Fix

## ⚡ 3-Step Setup

### 1️⃣ Run RLS Policies (REQUIRED)
**Supabase Dashboard → SQL Editor → New Query**
```
Copy from: scripts/SUPER_ADMIN_COMPLETE_RLS_POLICIES.sql
Click RUN
```
✅ Expected: "RLS policies created successfully for super admin!"

### 2️⃣ Verify Your Role (REQUIRED)
**SQL Editor → New Query**
```sql
SELECT email, role FROM users WHERE id = auth.uid();
```
✅ Expected: role should be `super_admin`

❌ If not super_admin, run:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

### 3️⃣ Create Franchises (IF EMPTY)
**SQL Editor → New Query**
```
Copy from: scripts/create-sample-franchises.sql
Click RUN
```
✅ Expected: "Created 3 sample franchises!"

---

## ✅ Quick Verification

**SQL Editor → New Query**
```
Copy from: scripts/verify-super-admin-setup.sql
Click RUN
```

✅ Should show: **"ALL CHECKS PASSED"**

---

## 🧪 Test in Browser

1. **Refresh** your browser (Cmd+R)
2. **Open Console** (Cmd+Option+J)
3. **Go to** `/franchises` page
4. **Look for:** `[Franchises] ✅ Raw franchise data:`

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `SUPER_ADMIN_COMPLETE_RLS_POLICIES.sql` | Main RLS policies for ALL tables |
| `verify-super-admin-setup.sql` | Check if everything works |
| `create-sample-franchises.sql` | Create test franchises |
| `diagnose-franchises-issue.sql` | Debug franchise issues |
| `SUPER_ADMIN_RLS_SETUP_GUIDE.md` | Detailed step-by-step guide |
| `SUPER_ADMIN_RLS_SOLUTION.md` | Complete technical documentation |
| `lib/utils/franchise.ts` | Helper to get default franchise |

---

## 🎯 What Gets Fixed

✅ Franchises page shows data
✅ Profile photo loads automatically
✅ All customers visible
✅ All bookings accessible
✅ All products shown
✅ All invoices displayed
✅ All expenses accessible
✅ Settings work properly

---

## 🐛 Quick Troubleshooting

### Problem: "No franchises found"
```sql
-- Check if franchises exist
SELECT COUNT(*) FROM franchises;
```
If 0, run: `create-sample-franchises.sql`

### Problem: "Permission denied"
```sql
-- Check your role
SELECT role FROM users WHERE id = auth.uid();
```
Must be: `super_admin`

### Problem: No data on other pages
Run: `SUPER_ADMIN_COMPLETE_RLS_POLICIES.sql` again

---

## 📞 Need Help?

1. Run `verify-super-admin-setup.sql`
2. Share the output
3. Share browser console logs
4. I'll help fix it!

---

**Ready to deploy:** ✅ YES
**Estimated time:** 5 minutes
**Risk level:** 🟢 LOW (only affects RLS, no schema changes)
