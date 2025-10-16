-- ⚠️ COMPREHENSIVE FIX - Add ALL Missing Columns to product_orders
-- This adds every field that app/create-product-order/page.tsx tries to insert
-- Run this ONCE to fix all column issues

BEGIN;

-- 1. Add security_deposit (for rental deposits)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;

-- 2. Add sales_closed_by_id (for tracking which staff closed the sale)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS sales_closed_by_id uuid REFERENCES users(id);

-- 3. Add is_quote (to differentiate quotes from actual orders)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS is_quote boolean DEFAULT false;

-- 4. Add discount_amount (manual discount in rupees)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0;

-- 5. Add coupon_code (coupon code applied)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS coupon_code text;

-- 6. Add coupon_discount (discount from coupon in rupees)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS coupon_discount numeric(12,2) DEFAULT 0;

-- 7. Add payment_method (cash/card/upi/etc)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS payment_method text;

-- 8. Add created_by (who created this order)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

-- 9. Add delivery_address (separate from venue_address - needed by trigger)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS delivery_address text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_orders_security_deposit 
ON product_orders(security_deposit) WHERE security_deposit > 0;

CREATE INDEX IF NOT EXISTS idx_product_orders_sales_closed_by 
ON product_orders(sales_closed_by_id) WHERE sales_closed_by_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_orders_is_quote 
ON product_orders(is_quote);

CREATE INDEX IF NOT EXISTS idx_product_orders_created_by 
ON product_orders(created_by);

CREATE INDEX IF NOT EXISTS idx_product_orders_coupon_code 
ON product_orders(coupon_code) WHERE coupon_code IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN product_orders.security_deposit IS 'Refundable security deposit amount for rental orders';
COMMENT ON COLUMN product_orders.sales_closed_by_id IS 'Staff member who closed this sale (for incentives)';
COMMENT ON COLUMN product_orders.is_quote IS 'True if this is a quote (not confirmed order yet)';
COMMENT ON COLUMN product_orders.discount_amount IS 'Manual discount amount in rupees';
COMMENT ON COLUMN product_orders.coupon_code IS 'Coupon code applied to this order';
COMMENT ON COLUMN product_orders.coupon_discount IS 'Discount amount from coupon in rupees';
COMMENT ON COLUMN product_orders.payment_method IS 'Payment method used (cash/card/upi/etc)';
COMMENT ON COLUMN product_orders.created_by IS 'User who created this order';
COMMENT ON COLUMN product_orders.delivery_address IS 'Delivery address (may differ from venue address)';

COMMIT;

-- Verification: Check all columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('security_deposit', 'sales_closed_by_id', 'is_quote', 
                            'discount_amount', 'coupon_code', 'coupon_discount', 
                            'payment_method', 'created_by', 'delivery_address') 
        THEN '✅ NEWLY ADDED'
        ELSE '📋 Existing'
    END as status
FROM information_schema.columns 
WHERE table_name = 'product_orders'
ORDER BY ordinal_position;

-- Summary of what was added
SELECT 
    '✅ ALL MISSING COLUMNS ADDED' as status,
    '9 columns added to product_orders table' as summary,
    'security_deposit, sales_closed_by_id, is_quote, discount_amount, coupon_code, coupon_discount, payment_method, created_by, delivery_address' as columns_added;
