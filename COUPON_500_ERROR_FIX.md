# 🔥 URGENT FIX - Coupon Creation 500 Error

## Problem
**Error:** "Failed to create coupon" with 500 Internal Server Error  
**Root Cause:** The `franchise_id` column in the `coupons` table references `users(id)` instead of `franchises(id)`

## Quick Fix

### Step 1: Run this SQL in Supabase SQL Editor

```sql
-- Fix the franchise_id foreign key reference
-- Copy and paste this entire block into Supabase SQL Editor

-- Drop the wrong foreign key
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_franchise_id_fkey;

-- Drop the column
ALTER TABLE coupons DROP COLUMN IF EXISTS franchise_id CASCADE;

-- Add it back with correct reference
ALTER TABLE coupons ADD COLUMN franchise_id UUID;

-- Add foreign key to franchises table (correct!)
ALTER TABLE coupons 
ADD CONSTRAINT coupons_franchise_id_fkey 
FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_coupons_franchise ON coupons(franchise_id);
```

### Step 2: Verify the fix

Run this query to confirm the column is fixed:

```sql
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'coupons' 
AND column_name = 'franchise_id';
```

**Expected result:**
- column_name: `franchise_id`
- data_type: `uuid`
- is_nullable: `YES`

### Step 3: Check foreign key reference

```sql
SELECT
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='coupons'
AND kcu.column_name = 'franchise_id';
```

**Expected result:**
- foreign_table_name: `franchises` (not `users`!)
- foreign_column_name: `id`

### Step 4: Test coupon creation

1. Refresh your browser (hard refresh: Cmd+Shift+R)
2. Go to `/bookings`
3. Click "Manage Offers"
4. Fill in the coupon form:
   - Code: TEST10
   - Type: Percentage Discount
   - Percentage: 10
   - Min Order: 50
5. Click "Create Coupon"
6. Should see success! ✅

---

## Alternative: Fresh Install

If the above doesn't work, you may need to drop and recreate the tables:

```sql
-- ⚠️ WARNING: This deletes all existing coupons!
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
```

Then run the **corrected** `ADD_COUPON_SYSTEM.sql` file (which now has the right references).

---

## Files Updated

1. ✅ `ADD_COUPON_SYSTEM.sql` - Fixed to reference `franchises(id)`
2. ✅ `FIX_COUPON_TABLE.sql` - Quick fix script
3. ✅ `COUPON_500_ERROR_FIX.md` - This guide

---

## What Was Wrong?

**Original (wrong):**
```sql
franchise_id UUID REFERENCES users(id)
```

**Fixed (correct):**
```sql
franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE
```

The `franchise_id` should point to the `franchises` table, not `users`, because:
- A coupon belongs to a franchise (organization)
- `franchiseId` in the API comes from `user.franchise_id` which is a UUID from the `franchises` table
- When inserting, we were trying to insert a franchise UUID into a column that expected a user UUID

---

## Next Steps After Fix

1. ✅ Run the SQL fix in Supabase
2. ✅ Hard refresh browser
3. ✅ Test creating all 4 coupon types:
   - Percentage Discount
   - Flat Amount Discount
   - Buy X Get Y Free
   - Free Shipping
4. ✅ Verify coupons appear in "Existing Coupons" list
5. ✅ Test editing and deleting coupons

---

## Prevention

The corrected `ADD_COUPON_SYSTEM.sql` file is now ready for:
- New installations
- Other environments
- Documentation

All future setups will have the correct foreign key reference from the start.
