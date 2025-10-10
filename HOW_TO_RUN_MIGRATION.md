# Migration Instructions

## Error: relation "product_orders" does not exist

This error means the tables haven't been created yet. Here's what to do:

## ✅ Solution: Run the Main Migration

### Step 1: Run the main migration that creates the tables

**File to run:** `MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql`

This file has been **updated** to include all the new fields (event_participant, groom_whatsapp, groom_address, bride_whatsapp, bride_address) from the start.

### Step 2: Copy and paste in Supabase SQL Editor

1. Open the file: `MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql`
2. Copy the entire contents
3. Go to Supabase Dashboard → SQL Editor
4. Paste the SQL
5. Click **Run** (or press ⌘↵)

### What This Creates:

**Tables:**
- ✅ `product_orders` (with all 5 new fields included)
- ✅ `product_order_items`
- ✅ `package_bookings` (with all 5 new fields included)
- ✅ `package_booking_items`

**Plus:**
- Indexes for performance
- Triggers for `updated_at` timestamps
- Foreign key constraints

### ⚠️ About ADD_MISSING_BOOKING_FIELDS.sql

You **do NOT need** to run `ADD_MISSING_BOOKING_FIELDS.sql` if you run the updated main migration.

This file is only needed if:
- You already ran the OLD version of the migration (without the new fields)
- You need to ADD columns to existing tables

## Verify Migration Success

After running the migration, verify with:

```sql
-- Check product_orders columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
ORDER BY ordinal_position;

-- Check package_bookings columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
ORDER BY ordinal_position;
```

You should see the new columns:
- ✅ event_participant
- ✅ groom_whatsapp
- ✅ groom_address
- ✅ bride_whatsapp
- ✅ bride_address

## Test the Forms

After successful migration:

1. Navigate to `/create-product-order` in your app
2. Fill out the form including the new fields
3. Submit and verify data saves correctly
4. Navigate to `/book-package`
5. Repeat testing

## Troubleshooting

### If you get foreign key errors:
Make sure these tables exist first:
- `customers`
- `franchises`
- `products`
- `package_sets`
- `package_variants`

### If you already ran the old migration:
Run `ADD_MISSING_BOOKING_FIELDS.sql` to add the missing columns to existing tables.

---

**Quick Summary:**
1. ✅ Run `MIGRATION_SPLIT_PRODUCT_AND_PACKAGE_BOOKINGS.sql` in Supabase SQL Editor
2. ✅ Verify columns were created
3. ✅ Test both forms
4. 🎉 Done!
