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
-- 5. VERIFICATION QUERIES
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

-- =====================================================
-- NOTES:
-- =====================================================
-- - payment_method field should already exist (ADD_PAYMENT_METHOD_FIELD.sql)
-- - coupon_code and coupon_discount should already exist (ADD_COUPON_SYSTEM.sql)
-- - This migration only adds the discount_amount field
-- - All three tables (product_orders, package_bookings, bookings) are covered
-- - Partial indexes created only for rows with discounts > 0 for efficiency
-- =====================================================
