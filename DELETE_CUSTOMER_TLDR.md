# Quick Reference - Delete Vadodara Customer

## TL;DR - Just Tell Me What To Do!

### Option A: SAFE (Recommended) ✅
**Deactivate the user (they can't log in, but data stays)**
```
File: DELETE_USER_ACCOUNT_ONLY.sql
Steps: Run STEP 1 → Run the UPDATE query → Run STEP 5
Time: 1 minute
Can undo: YES (anytime)
```

### Option B: FULL DELETE (Nuclear)
**Delete everything including franchise and all data**
```
File: DELETE_VADODARA_FRANCHISE.sql  
Steps: Run STEP 1 → Run STEP 2 → Run STEP 4 → Run STEP 5
Time: 5 minutes
Can undo: NO (backup restore only)
```

### Option C: DELETE USER ONLY
**Delete just the user account, keep franchise/products**
```
File: DELETE_USER_ACCOUNT_ONLY.sql (second part)
Steps: Run STEP 1 → Run DELETE query → Run STEP 5
Time: 1 minute
Can undo: NO (backup restore only)
```

---

## 🎯 Which Should I Pick?

| Scenario | Pick |
|----------|------|
| "I want to remove their access" | **Option A** ✅ |
| "I want to completely remove them" | **Option B** |
| "I want to delete just the account" | **Option C** |
| "I want to keep products/orders" | **Option A or C** |
| "I want to delete everything" | **Option B** |
| "I'm not sure" | **Option A** (safest) ✅ |

---

## 📝 Simple Steps

### For Option A (RECOMMENDED):

1. Go to Supabase → SQL Editor
2. Copy this:
```sql
-- STEP 1: Check
SELECT id, email, name FROM users WHERE email = 'vadodara@safawala.com';

-- STEP 2: Update (Deactivate)
BEGIN;
UPDATE users SET is_active = false, updated_at = NOW()
WHERE email = 'vadodara@safawala.com';
COMMIT;

-- STEP 3: Verify
SELECT * FROM users WHERE email = 'vadodara@safawala.com';
```

3. Paste into SQL Editor
4. Run it
5. Done! ✅

**Result:** User can't log in anymore, but everything else stays intact

---

### For Option B (FULL DELETE):

1. Go to Supabase → SQL Editor
2. Open file: `DELETE_VADODARA_FRANCHISE.sql`
3. Run STEP 1 (just looking)
4. Run STEP 2 (count check)
5. Run STEP 4 (actual deletion)
6. Run STEP 5 (verify)
7. Done! ✅

**Result:** Everything deleted (franchise, users, products, orders, etc.)

---

## 🔄 Can I Undo It?

| Option | During Session | After Session |
|--------|---|---|
| **A (Deactivate)** | YES (ROLLBACK) | YES (1 query) |
| **B (Full Delete)** | YES (ROLLBACK) | NO (restore backup) |
| **C (Delete User)** | YES (ROLLBACK) | NO (restore backup) |

---

## ⚡ Emergency Undo

**If you just deleted and realized you made a mistake:**

Type this **immediately** in the same SQL editor:
```sql
ROLLBACK;
```

If that doesn't work, everything is probably already deleted. Contact Supabase support.

---

## 📊 What Gets Deleted

### Option A (Deactivate):
- ❌ Nothing deleted
- ⏸️ User disabled (is_active = false)

### Option B (Full Delete):
- ❌ Franchise
- ❌ 3+ Users
- ❌ 28+ Products
- ❌ 15+ Bookings
- ❌ 8+ Orders
- ❌ 12+ Deliveries
- ❌ All images
- ❌ All customer data

### Option C (Delete User):
- ❌ Just the user account
- ✅ Everything else stays

---

## 🎯 Final Answer

**For most cases:** Use **Option A - Deactivate** 
- ✅ Safest
- ✅ Reversible
- ✅ Quick
- ✅ No data loss

Let me know which one you want and I'll help you execute it! 🚀
