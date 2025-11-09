# Delete Options - Which One to Use?

## 🎯 Three Deletion Options

### Option 1: Delete ENTIRE Franchise (Nuclear)
**File:** `DELETE_VADODARA_FRANCHISE.sql`

**What gets deleted:**
- ✅ Franchise account
- ✅ All users in franchise (staff, admins)
- ✅ All products
- ✅ All bookings/orders
- ✅ All deliveries
- ✅ All returns
- ✅ All customer data
- ✅ All financial records

**Use when:**
- ❌ You want to completely remove the Vadodara franchise
- ❌ You're closing the Vadodara business location
- ❌ You want to wipe all historical data

**Recovery:**
- ⏸️ Can ROLLBACK during the session
- ❌ Cannot undo after session closes
- 🔄 Must restore from backup if needed

**Execution time:** 5-10 seconds  
**Rows deleted:** 200-500+  
**Difficulty:** ⚠️ DANGEROUS

---

### Option 2: Deactivate Customer User (Safe)
**File:** `DELETE_USER_ACCOUNT_ONLY.sql`

**What happens:**
- ✅ User account marked as `is_active = false`
- ✅ User cannot log in anymore
- ✅ Account kept in system (audit trail)
- ❌ Franchise, products, data NOT deleted

**Use when:**
- ✅ Customer no longer needs access
- ✅ You want to keep historical data
- ✅ You might reactivate them later
- ✅ You need audit trail

**Recovery:**
- ⏭️ Reactivate anytime: `UPDATE users SET is_active = true WHERE email = '...'`
- 🔄 Account data still exists

**Execution time:** 1 second  
**Rows modified:** 1  
**Difficulty:** ✅ SAFE

---

### Option 3: Delete User Account Only (Permanent)
**File:** `DELETE_USER_ACCOUNT_ONLY.sql` (second part)

**What gets deleted:**
- ✅ User account record
- ❌ Franchise, products, data NOT deleted
- ❌ Historical records (orders, audit logs) keep user_id reference

**Use when:**
- ✅ You want to delete the user but keep business data
- ✅ User will never access the system again
- ✅ Franchise/products should remain

**Recovery:**
- ❌ Cannot undo after session closes
- 🔄 Can restore from backup if needed

**Execution time:** 1 second  
**Rows deleted:** 1 user  
**Difficulty:** ⚠️ PERMANENT

---

## 📊 Comparison Table

| Aspect | Option 1: Full Delete | Option 2: Deactivate | Option 3: Delete User |
|--------|---|---|---|
| **Franchise** | ❌ Deleted | ✅ Stays | ✅ Stays |
| **Products** | ❌ Deleted | ✅ Stay | ✅ Stay |
| **Orders/Bookings** | ❌ Deleted | ✅ Stay | ✅ Stay |
| **User Account** | ❌ Deleted | ⏸️ Disabled | ❌ Deleted |
| **Audit Trail** | ❌ Deleted | ✅ Intact | ⚠️ Partial |
| **Can Login?** | No | No | No |
| **Can Reactivate?** | No (restore backup) | Yes (1 query) | No (restore backup) |
| **Recovery** | Hard (backup restore) | Easy (1 query) | Hard (backup restore) |
| **Reversible?** | During session only | Anytime | During session only |
| **Safety** | 🔴 DANGEROUS | 🟢 SAFE | 🟡 CAREFUL |

---

## 🤔 Which One Do You Want?

### "I want to DELETE the entire Vadodara franchise forever"
→ Use **Option 1: DELETE_VADODARA_FRANCHISE.sql**
```
Deletes everything including franchise, products, all data
⚠️ This is permanent!
```

### "I want to DISABLE the customer but keep the business data"
→ Use **Option 2: Deactivate (Part of DELETE_USER_ACCOUNT_ONLY.sql)**
```
Marks user as inactive - they can't log in
✅ Can be easily reversed anytime
```

### "I want to DELETE just the user account, keep franchise/products"
→ Use **Option 3: Delete User (Part of DELETE_USER_ACCOUNT_ONLY.sql)**
```
Removes just the user record
Franchise and all business data stays intact
```

---

## 📋 Quick Decision Guide

**Ask yourself:**

1️⃣ **Do you want to keep the Vadodara franchise?**
   - YES → Use Option 2 or 3 (keep franchise)
   - NO → Use Option 1 (delete everything)

2️⃣ **Do you want to keep products/bookings/orders?**
   - YES → Use Option 2 or 3
   - NO → Use Option 1

3️⃣ **Do you want to be able to undo this easily?**
   - YES → Use Option 2 (deactivate)
   - NO → Use Option 1 or 3

---

## 🚀 How to Execute

### Step 1: Choose Your Option
- Option 1 → Full delete (dangerous)
- Option 2 → Deactivate (safe)
- Option 3 → Delete user (permanent)

### Step 2: Open SQL File
```
Supabase Dashboard → SQL Editor → Copy/Paste the appropriate script
```

### Step 3: Run STEP 1 & STEP 2 First
```
See the what and how many records will be affected
Note down the numbers for verification later
```

### Step 4: Run the DELETE/UPDATE Script
```
Run the main deletion/deactivation part
Wait for success message
```

### Step 5: Run STEP 5 - Verification
```
Confirm that the action was successful
Should see: 0 rows, empty results, etc.
```

---

## ⚠️ Safety Tips

### Before Running Any Script:
- ✅ Test on a staging database first
- ✅ Take manual notes of what will be deleted
- ✅ Have backup ready
- ✅ Run STEP 1 & 2 first (just viewing, no deletion)

### After Running Script:
- ✅ Run STEP 5 verification immediately
- ✅ Keep SQL editor open (in case you need ROLLBACK)
- ✅ Close other SQL tabs to avoid accidents

### If You Make a Mistake:
- ⏸️ **Within 5 minutes:** Type `ROLLBACK;` in SQL editor
- 🔄 **After session closes:** Contact Supabase support for restore
- 📧 **Provide:** Timestamp of deletion + what was deleted

---

## 💡 Recommendation

For your case (vadodara@safawala.com):

**Most Common Scenario:** Customer needs to be removed but business data/products should stay
→ **Use Option 2: DEACTIVATE** (safest, reversible, keeps data)

**If you really want to delete franchise:**
→ **Use Option 1: FULL DELETE** (but keep backup just in case)

**If you need to delete just the user:**
→ **Use Option 3: DELETE USER** (one-time deletion)

---

## Files Reference

| File | Purpose | Risk |
|------|---------|------|
| DELETE_VADODARA_FRANCHISE.sql | Delete everything | 🔴 DANGEROUS |
| DELETE_USER_ACCOUNT_ONLY.sql | Deactivate OR delete just user | 🟢 SAFE |
| DELETE_VADODARA_FRANCHISE_QUICK.md | Step-by-step guide | Reference |
| DELETE_CUSTOMER_QUICK.md | This file | Reference |

---

**Which option do you want to use?** Let me know and I'll guide you through it! 🚀
