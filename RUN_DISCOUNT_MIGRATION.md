# 🚀 Run This Migration in Supabase SQL Editor

## Instructions:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below
5. Click **Run** or press `Cmd/Ctrl + Enter`

---

## SQL Migration (Copy Everything Below)

```sql
-- =====================================================
-- ADD DISCOUNT & PAYMENT FIELDS TO ORDERS
-- =====================================================
-- This migration adds discount_amount field to product_orders and package_bookings
-- Note: payment_method and coupon fields are already added via other migrations
-- Created: 2025-10-15
-- =====================================================

-- =====================================================
-- 1. ADD DISCOUNT_AMOUNT TO PRODUCT_ORDERS
-- =====================================================
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0);

COMMENT ON COLUMN product_orders.discount_amount IS 'Manual discount amount applied to the order';

-- =====================================================
-- 2. ADD DISCOUNT_AMOUNT TO PACKAGE_BOOKINGS
-- =====================================================
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0);

COMMENT ON COLUMN package_bookings.discount_amount IS 'Manual discount amount applied to the booking';

-- =====================================================
-- 3. ADD DISCOUNT_AMOUNT TO BOOKINGS (if using unified table)
-- =====================================================
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0);

COMMENT ON COLUMN bookings.discount_amount IS 'Manual discount amount applied to the booking';

-- =====================================================
-- 4. CREATE INDEXES FOR DISCOUNT QUERIES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_orders_discount ON product_orders(discount_amount) 
WHERE discount_amount > 0;

CREATE INDEX IF NOT EXISTS idx_package_bookings_discount ON package_bookings(discount_amount) 
WHERE discount_amount > 0;

CREATE INDEX IF NOT EXISTS idx_bookings_discount ON bookings(discount_amount) 
WHERE discount_amount > 0;

-- =====================================================
-- 5. VERIFICATION QUERIES - Run these after migration
-- =====================================================

-- Check if discount_amount was added to product_orders
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name IN ('discount_amount', 'payment_method', 'coupon_code', 'coupon_discount')
ORDER BY column_name;

-- Check if discount_amount was added to package_bookings
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
AND column_name IN ('discount_amount', 'payment_method', 'coupon_code', 'coupon_discount')
ORDER BY column_name;

-- Check if discount_amount was added to bookings
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('discount_amount', 'payment_method', 'coupon_code', 'coupon_discount')
ORDER BY column_name;
```

---

## Expected Results:

After running the migration, the verification queries should show:

### For `product_orders`:
| column_name | data_type | column_default | is_nullable |
|------------|-----------|----------------|-------------|
| coupon_code | character varying | NULL | YES |
| coupon_discount | numeric | 0 | YES |
| discount_amount | numeric | 0 | YES |
| payment_method | text | 'Cash / Offline Payment' | YES |

### For `package_bookings`:
| column_name | data_type | column_default | is_nullable |
|------------|-----------|----------------|-------------|
| coupon_code | character varying | NULL | YES |
| coupon_discount | numeric | 0 | YES |
| discount_amount | numeric | 0 | YES |
| payment_method | text | 'Cash / Offline Payment' | YES |

---

## ✅ Success Indicators:

- All `ALTER TABLE` statements execute without errors
- All `CREATE INDEX` statements complete successfully
- Verification queries return 4 columns for each table
- No error messages in the Supabase SQL Editor

---

## 🔒 Safety Notes:

- Uses `IF NOT EXISTS` - safe to run multiple times
- Has default values - won't affect existing records
- Has CHECK constraints - prevents invalid data
- Creates partial indexes - only indexes rows with discounts

---

**Status:** Ready to run in Supabase SQL Editor
**Date:** October 15, 2025
