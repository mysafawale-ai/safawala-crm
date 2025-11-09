# Delete Vadodara Customer - Complete Guide ✅

## 📋 Created Scripts

I've created **3 comprehensive deletion options** for you to choose from:

### 1️⃣ **DELETE_VADODARA_FRANCHISE.sql** (Nuclear Option)
**Deletes everything:**
- ❌ Entire franchise
- ❌ All users
- ❌ All products (28+)
- ❌ All orders/bookings/deliveries
- ❌ All customer data
- ❌ All images (from database)

**Use when:** You want to completely remove Vadodara business  
**Risk Level:** 🔴 DANGEROUS  
**Reversible:** Only via ROLLBACK (during same session)  

**Steps:**
1. Open SQL editor in Supabase
2. Run STEP 1 (shows what will be deleted)
3. Run STEP 2 (counts everything)
4. Review the numbers
5. Run STEP 4 (the actual deletion - wrapped in transaction)
6. Run STEP 5 (verification)

---

### 2️⃣ **DELETE_USER_ACCOUNT_ONLY.sql - Deactivate Option** (SAFE ✅)
**What happens:**
- ✅ User marked as `is_active = false`
- ✅ User cannot log in
- ✅ Account stays in system for audit trail
- ✅ Franchise stays intact
- ✅ All products/data stays intact

**Use when:** Customer access needs to be removed  
**Risk Level:** 🟢 SAFE  
**Reversible:** YES! Anytime with one query  

**Reactivate if needed:**
```sql
UPDATE users SET is_active = true 
WHERE email = 'vadodara@safawala.com';
```

---

### 3️⃣ **DELETE_USER_ACCOUNT_ONLY.sql - Delete User** (Permanent)
**What happens:**
- ❌ User account deleted (not just disabled)
- ✅ Franchise stays intact
- ✅ All products/data stays intact
- ⚠️ Historical records keep user_id reference

**Use when:** You want to permanently remove the account  
**Risk Level:** 🟡 CAREFUL  
**Reversible:** No (except via backup restore)  

---

## 🎯 Which One Should You Use?

### For Vadodara Customer:

**RECOMMENDED:** Option 2 - **Deactivate User** (SAFEST)
```sql
-- User can't log in anymore
-- But everything stays in database
-- Can be reversed anytime if you change your mind
-- Best for keeping audit trail
```

**IF YOU NEED FULL DELETION:** Option 1 - **Delete Everything**
```sql
-- Completely removes franchise
-- All products, orders, data gone
-- Keep backup just in case!
```

**IF YOU NEED USER-ONLY DELETION:** Option 3 - **Delete User Only**
```sql
-- Just the user account is removed
-- Franchise and all data stays
-- Permanent deletion
```

---

## 🚀 How to Use

### Quick Steps:

1. **Open Supabase Dashboard**
   - Go to SQL Editor

2. **Open the appropriate script:**
   - Option 2 (Recommended): `/DELETE_USER_ACCOUNT_ONLY.sql`
   - Option 1 (Full Delete): `/DELETE_VADODARA_FRANCHISE.sql`

3. **Copy the script**
   - Get the file content

4. **Paste into SQL Editor**

5. **Run STEP 1** (just viewing, no deletion)
   ```sql
   -- Shows what will be affected
   ```

6. **Run STEP 2** (count check, no deletion)
   ```sql
   -- Shows how many records
   ```

7. **Review the numbers**
   - Make sure this is what you want

8. **Run the main script** (STEP 3, 4, or the UPDATE)
   - This does the actual deletion/deactivation

9. **Run STEP 5** (verification)
   - Confirm it worked

---

## 📊 File Breakdown

| File | Purpose | Best For |
|------|---------|----------|
| `DELETE_VADODARA_FRANCHISE.sql` | Delete entire franchise | Complete removal |
| `DELETE_USER_ACCOUNT_ONLY.sql` | Deactivate or delete user | Removing access |
| `DELETE_VADODARA_FRANCHISE_QUICK.md` | Step-by-step guide | Learning |
| `DELETE_CUSTOMER_QUICK.md` | Comparison of options | Decision making |

---

## ⚠️ Important Notes

### Before Running:
- ✅ Double-check you have the right email
- ✅ Take a screenshot of counts before deleting
- ✅ Have a backup (Supabase auto-backups)
- ✅ Test on staging first if possible

### During/After Running:
- ✅ Keep SQL editor open (for ROLLBACK if needed)
- ✅ Run verification immediately after
- ✅ Wait ~30 seconds for UI to catch up
- ✅ Refresh the inventory/dashboard page

### If Something Goes Wrong:
- ⏸️ Type `ROLLBACK;` in same SQL session (works immediately)
- 🔄 Or contact Supabase support for full restore
- 📧 Provide exact timestamp of deletion

---

## ✨ Safety Features

All scripts include:
- ✅ **STEP 1:** View what will be deleted (no changes)
- ✅ **STEP 2:** Count records (no changes)
- ✅ **Transaction Wrapping:** `BEGIN ... COMMIT`
- ✅ **ROLLBACK Option:** Can undo during session
- ✅ **STEP 5:** Verification queries
- ✅ **Comments:** Explaining each part

---

## 📞 Need Help?

### "I'm not sure which option to use"
→ Use **Option 2: Deactivate** (safest, reversible)

### "I want to delete everything"
→ Use **Option 1: Full Delete** (includes everything)

### "I just want to remove login access"
→ Use **Option 2: Deactivate** (user can't log in)

### "I made a mistake"
→ Type `ROLLBACK;` in SQL editor immediately

### "I can't undo it"
→ Contact Supabase support for backup restore

---

## 🎉 Summary

✅ **3 safe deletion scripts created**  
✅ **All wrapped in transactions**  
✅ **Step-by-step guides included**  
✅ **Rollback option available**  
✅ **Comparison guide included**  
✅ **Committed to GitHub (Commit: da3439a)**  

**You can now safely delete the Vadodara customer whenever you're ready!** 🚀

---

## Files Created:
1. `DELETE_VADODARA_FRANCHISE.sql` - Full deletion with all data
2. `DELETE_USER_ACCOUNT_ONLY.sql` - Deactivate or delete just user
3. `DELETE_VADODARA_FRANCHISE_QUICK.md` - Quick reference
4. `DELETE_CUSTOMER_QUICK.md` - Option comparison guide

**Git Commit:** `da3439a` - feat: add comprehensive customer/franchise deletion scripts
