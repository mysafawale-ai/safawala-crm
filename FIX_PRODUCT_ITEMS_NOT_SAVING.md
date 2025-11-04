# Fix for Product Items Not Saving

## Problem
When you edit a booking and add products, only the amount changes but the products are not saved to the database.

## Root Cause
The `product_orders` and `package_bookings` tables are missing the `has_items` column that the API tries to update.

When you save items:
1. Items are deleted from the items table
2. Items are inserted back with new selections  
3. The `has_items` flag is updated (but this column doesn't exist!) ❌

This causes a 500 error on the backend, preventing the items from being properly saved.

## Solution

### Step 1: Add Missing Columns in Supabase

You need to run TWO SQL migrations in your Supabase SQL Editor:

**Migration 1: For product_orders table**

```sql
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS has_items BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_product_orders_has_items 
ON product_orders(has_items) WHERE has_items = TRUE;
```

**Migration 2: For package_bookings table**

```sql
ALTER TABLE package_bookings
ADD COLUMN IF NOT EXISTS has_items BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_package_bookings_has_items 
ON package_bookings(has_items) WHERE has_items = TRUE;
```

### Step 2: How to Run in Supabase

1. Go to **Supabase Dashboard** > Your Project
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the first SQL migration above
5. Click **Run**
6. Repeat steps 3-5 for the second migration

### Step 3: Verify Columns Were Added

Run this query to confirm:

```sql
-- Check product_orders
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name IN ('has_items', 'id', 'order_number')
ORDER BY column_name;

-- Check package_bookings  
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
AND column_name IN ('has_items', 'id', 'package_number')
ORDER BY column_name;
```

Both should show `has_items` as `boolean` with default `false`.

### Step 4: Test the Fix

1. Go to Bookings page
2. Click on a product booking (Rental or Sale)
3. Click "⏳ Selection Pending" badge
4. Select products and click "Finish Selection"
5. Products should now be saved ✅

## What Happens After Fix

**Before saving products:**
- Badge shows: "⏳ Selection Pending"
- Database: `has_items = FALSE`

**After saving products:**
- Badge shows: "📦 X Items"
- Database: `has_items = TRUE`
- Items stored in `product_order_items` or `package_booking_product_items`

## API Details

When you save items, the POST endpoint:
1. `/api/bookings/[id]/items` (POST)
2. **Deletes** old items from the items table
3. **Inserts** new selected items  
4. **Updates** `has_items` flag to TRUE
5. **Reserves** inventory (qty_available decreases)

If any step fails, the items don't save.

## Tables Involved

### For Product Orders (Rental/Sale):
- `product_orders` - Main booking record
- `product_order_items` - Individual items selected

### For Package Bookings:
- `package_bookings` - Main booking record
- `package_booking_product_items` - Products added to package
- `package_booking_items` - Legacy packages (old format)

## If You Still Have Issues

After running the migrations:
1. Reload the website (Ctrl+R or Cmd+R)
2. Try adding products again
3. Check browser console for error messages
4. Check Supabase logs for SQL errors

---

**Created:** November 4, 2025
**Related Files:** 
- `ADD_HAS_ITEMS_TO_PRODUCT_ORDERS.sql`
- `ADD_HAS_ITEMS_TO_PACKAGE_BOOKINGS.sql`
- `app/api/bookings/[id]/items/route.ts`
