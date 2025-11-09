# Delete Vadodara Franchise - Step by Step

## ⚠️ WARNING: This will permanently delete the entire Vadodara franchise!

---

## What Gets Deleted

✅ **Franchise** - vadodara@safawala.com franchise account  
✅ **Users** - All staff/admin users in this franchise  
✅ **Products** - All 25+ products  
✅ **Bookings** - All customer bookings and package bookings  
✅ **Orders** - All product orders  
✅ **Deliveries** - All delivery records  
✅ **Returns** - All return records  
✅ **Quotes** - All quotes  
✅ **Categories** - All custom categories  
✅ **Vendors** - All vendor records  
✅ **Coupons** - All coupons/discounts  
✅ **Images** - All product images in database (NOT in storage yet)  

---

## How to Delete

### Option 1: Safe Deletion (RECOMMENDED)

**Step 1: Check what will be deleted**
```sql
-- Run in Supabase SQL Editor:
-- See DELETE_VADODARA_FRANCHISE.sql, STEP 1 and STEP 2
-- This shows franchise_id and counts of everything that will be deleted
```

**Step 2: Review the numbers**
```
Users: 3
Products: 28
Bookings: 15
Orders: 8
Deliveries: 12
Returns: 5
Quotes: 2
(These are examples - your numbers will vary)
```

**Step 3: Run the deletion**
```sql
-- Copy the entire script from DELETE_VADODARA_FRANCHISE.sql
-- Paste into Supabase SQL Editor
-- Execute (everything is wrapped in BEGIN/COMMIT transaction)
```

**Step 4: Verify it's gone**
```sql
-- Check that the franchise is deleted:
SELECT * FROM franchises 
WHERE name LIKE '%vadodara%' OR id = 'xxx';

-- Result should be: EMPTY (0 rows)
```

---

### Option 2: Manual Deletion (If you prefer step-by-step)

**Get the franchise_id first:**
```sql
SELECT id, name FROM franchises 
WHERE name LIKE '%vadodara%';

-- Result: 'abc-123-def-456' (save this)
```

**Then delete in this order:**
```sql
-- 1. Delete child records
DELETE FROM delivery_handover_items WHERE delivery_id IN (
  SELECT id FROM deliveries WHERE franchise_id = 'abc-123-def-456'
);

-- 2. Delete middle records  
DELETE FROM bookings WHERE franchise_id = 'abc-123-def-456';
DELETE FROM package_bookings WHERE franchise_id = 'abc-123-def-456';
DELETE FROM orders WHERE franchise_id = 'abc-123-def-456';
DELETE FROM deliveries WHERE franchise_id = 'abc-123-def-456';
DELETE FROM returns WHERE franchise_id = 'abc-123-def-456';

-- 3. Delete products
DELETE FROM product_items WHERE product_id IN (
  SELECT id FROM products WHERE franchise_id = 'abc-123-def-456'
);
DELETE FROM product_images WHERE product_id IN (
  SELECT id FROM products WHERE franchise_id = 'abc-123-def-456'
);
DELETE FROM products WHERE franchise_id = 'abc-123-def-456';

-- 4. Delete users
DELETE FROM users WHERE franchise_id = 'abc-123-def-456';

-- 5. Delete franchise
DELETE FROM franchises WHERE id = 'abc-123-def-456';
```

---

## If You Make a Mistake

### Undo Deletion (During the session)
```sql
-- If you realize you made a mistake IMMEDIATELY:
ROLLBACK;

-- This ONLY works if you run it in the same SQL session
-- Once you close the editor, ROLLBACK won't work
```

### Restore from Backup
If deletion was already committed:
1. Contact Supabase support
2. Request database restore from backup
3. Specify the timestamp before deletion

---

## What About Product Images in Storage?

The SQL script only deletes the database records (`product_images` table).

**Product images in Supabase Storage will still exist:**
- Location: Storage bucket `product-images`
- Files: `inventory/[timestamp]-[product_code].jpg`

**To delete images from storage, you need to:**

Option A: Delete via Supabase Dashboard
```
1. Supabase Console
2. Storage → product-images bucket
3. Filter by vadodara products
4. Delete the folder
```

Option B: Delete via API (requires manual API calls)

---

## Complete Deletion Checklist

- [ ] Got the SQL script (`DELETE_VADODARA_FRANCHISE.sql`)
- [ ] Reviewed STEP 1 (identify franchise)
- [ ] Reviewed STEP 2 (count what will be deleted)
- [ ] Made a note of the counts (for verification)
- [ ] Ran the DELETE script in Supabase SQL Editor
- [ ] Verified in STEP 5 (0 remaining franchises)
- [ ] ✅ **DELETION COMPLETE**

---

## Quick Reference

### Files:
- **DELETE_VADODARA_FRANCHISE.sql** - Full script with safe transaction
- **DELETE_VADODARA_FRANCHISE_QUICK.md** - This file
- **DELETE_CUSTOMER_QUICK.md** - Generic customer delete instructions

### Database Impact:
- **Rows deleted:** 200-500+ (depending on historical data)
- **Tables affected:** 30+
- **Transaction:** SAFE (wrapped in BEGIN/COMMIT)
- **Rollback:** Only available during same session

### Time to Execute:
- Deletion: ~5-10 seconds
- Verification: ~2 seconds

---

## ⚠️ Final Warning

**This action:**
- ✅ CAN be undone during the session (ROLLBACK)
- ❌ CANNOT be easily undone after session closes
- ❌ Will delete ALL data including orders and deliveries
- ✅ Will NOT delete images in storage (separate step)

**Double-check before running!** 

---

**Ready?** Use the script in `DELETE_VADODARA_FRANCHISE.sql` 🚀
