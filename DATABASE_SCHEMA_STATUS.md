# Database Schema Status for Payment, Discount & Coupon Fields

## 📊 Current Status

### ✅ **EXISTING** Database Migrations

Based on the SQL migration files in your repository, the following migrations already exist:

#### 1. **Payment Method Field** (`ADD_PAYMENT_METHOD_FIELD.sql`)
- ✅ Adds `payment_method` to `product_orders`
- ✅ Adds `payment_method` to `package_bookings`
- ✅ Adds `payment_method` to `invoices`
- ✅ Includes CHECK constraints for valid payment methods:
  - UPI / QR Payment
  - Bank Transfer
  - Debit / Credit Card
  - Cash / Offline Payment
  - International Payment Method
- ✅ Default value: `'Cash / Offline Payment'`

#### 2. **Coupon System** (`ADD_COUPON_SYSTEM.sql`)
- ✅ Creates `coupons` table with full coupon management
- ✅ Creates `coupon_usage` tracking table
- ✅ Adds `coupon_code` (VARCHAR 50) to `product_orders`
- ✅ Adds `coupon_discount` (DECIMAL 10,2) to `product_orders`
- ✅ Adds `coupon_code` (VARCHAR 50) to `package_bookings`
- ✅ Adds `coupon_discount` (DECIMAL 10,2) to `package_bookings`
- ✅ Includes CHECK constraints (coupon_discount >= 0)
- ✅ Creates indexes for performance
- ✅ Includes triggers for updated_at timestamps

### ⚠️ **MISSING** Database Field

#### ❌ **Discount Amount Field**
- ❌ `discount_amount` is **NOT** explicitly added to `product_orders` in migration files
- ❌ `discount_amount` is **NOT** explicitly added to `package_bookings` in migration files
- ⚠️ Note: Some older schema files show `discount_amount` in `bookings` table, but not in the split tables

## 🔧 Required Action

### **NEW Migration Created:** `ADD_DISCOUNT_FIELDS_TO_ORDERS.sql`

This migration adds the missing `discount_amount` field to:
- `product_orders` table
- `package_bookings` table  
- `bookings` table (if using unified table)

**Field specification:**
```sql
discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0)
```

## 📋 Complete Field Summary

### For **PRODUCT_ORDERS** Table:

| Field | Type | Source Migration | Status |
|-------|------|-----------------|--------|
| `payment_method` | TEXT | ADD_PAYMENT_METHOD_FIELD.sql | ✅ Exists |
| `discount_amount` | DECIMAL(12,2) | ADD_DISCOUNT_FIELDS_TO_ORDERS.sql | ⚠️ **Need to Run** |
| `coupon_code` | VARCHAR(50) | ADD_COUPON_SYSTEM.sql | ✅ Exists |
| `coupon_discount` | DECIMAL(10,2) | ADD_COUPON_SYSTEM.sql | ✅ Exists |

### For **PACKAGE_BOOKINGS** Table:

| Field | Type | Source Migration | Status |
|-------|------|-----------------|--------|
| `payment_method` | TEXT | ADD_PAYMENT_METHOD_FIELD.sql | ✅ Exists |
| `discount_amount` | DECIMAL(12,2) | ADD_DISCOUNT_FIELDS_TO_ORDERS.sql | ⚠️ **Need to Run** |
| `coupon_code` | VARCHAR(50) | ADD_COUPON_SYSTEM.sql | ✅ Exists |
| `coupon_discount` | DECIMAL(10,2) | ADD_COUPON_SYSTEM.sql | ✅ Exists |

### For **BOOKINGS** Table (Unified - if used):

| Field | Type | Source Migration | Status |
|-------|------|-----------------|--------|
| `payment_method` | TEXT | ADD_PAYMENT_METHOD_FIELD.sql | ✅ Exists |
| `discount_amount` | DECIMAL(12,2) | Various older schemas + NEW | ✅/⚠️ Might exist, NEW adds it safely |
| `coupon_code` | VARCHAR(50) | ADD_COUPON_SYSTEM.sql | ⚠️ Not in coupon migration |
| `coupon_discount` | DECIMAL(10,2) | ADD_COUPON_SYSTEM.sql | ⚠️ Not in coupon migration |

## 🚀 Migration Order (If Running Fresh)

1. **First:** Run `ADD_PAYMENT_METHOD_FIELD.sql` - Adds payment method to all tables
2. **Second:** Run `ADD_COUPON_SYSTEM.sql` - Creates coupon system and adds coupon fields
3. **Third:** Run `ADD_DISCOUNT_FIELDS_TO_ORDERS.sql` - Adds discount_amount field

## ⚡ Quick Check Query

Run this in Supabase SQL Editor to verify current state:

```sql
-- Check product_orders columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name IN ('discount_amount', 'payment_method', 'coupon_code', 'coupon_discount')
ORDER BY column_name;

-- Check package_bookings columns
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
AND column_name IN ('discount_amount', 'payment_method', 'coupon_code', 'coupon_discount')
ORDER BY column_name;

-- Check bookings columns (if table exists)
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('discount_amount', 'payment_method', 'coupon_code', 'coupon_discount')
ORDER BY column_name;
```

## 📝 Code vs Database Status

### Frontend Code (✅ Ready)
- Product Order Page: Uses all 4 fields
- Package Booking Form: Uses all 4 fields
- Package Booking Handler: Saves all 4 fields

### Database Schema (⚠️ Partial)
- ✅ `payment_method` - Ready via ADD_PAYMENT_METHOD_FIELD.sql
- ⚠️ `discount_amount` - **NEEDS** ADD_DISCOUNT_FIELDS_TO_ORDERS.sql
- ✅ `coupon_code` - Ready via ADD_COUPON_SYSTEM.sql
- ✅ `coupon_discount` - Ready via ADD_COUPON_SYSTEM.sql

## 🎯 Action Items

1. **Verify Existing Fields:**
   - Run the quick check query above in Supabase
   - Confirm which fields already exist

2. **Run Missing Migration:**
   - If `discount_amount` is missing, run `ADD_DISCOUNT_FIELDS_TO_ORDERS.sql`
   - This is safe to run (uses `IF NOT EXISTS`)

3. **Test Complete Flow:**
   - Create a product order with all fields
   - Create a package booking with all fields
   - Verify data saves correctly

4. **Update Documentation:**
   - Confirm all migrations are tracked
   - Update schema documentation if needed

## 🔒 Safety Notes

- All migrations use `ADD COLUMN IF NOT EXISTS` - safe to re-run
- All migrations include CHECK constraints for data validation
- All migrations include indexes for performance
- All migrations have default values to prevent NULL issues

---

**Created:** October 15, 2025  
**Status:** ⚠️ Action Required - Run ADD_DISCOUNT_FIELDS_TO_ORDERS.sql
