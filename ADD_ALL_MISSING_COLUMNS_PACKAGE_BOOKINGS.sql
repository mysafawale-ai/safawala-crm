-- ⚠️ COMPREHENSIVE FIX - Add ALL Missing Columns to package_bookings
-- This adds every field that app/book-package/page.tsx tries to insert
-- Run this ONCE to fix all column issues

BEGIN;

-- 1. Add security_deposit (for rental deposits)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;

-- 2. Add sales_closed_by_id (for tracking which staff closed the sale)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS sales_closed_by_id uuid REFERENCES users(id);

-- 3. Add is_quote (to differentiate quotes from actual bookings)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS is_quote boolean DEFAULT false;

-- 4. Add discount_amount (manual discount in rupees)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0;

-- 5. Add coupon_code (coupon code applied)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS coupon_code text;

-- 6. Add coupon_discount (discount from coupon in rupees)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS coupon_discount numeric(12,2) DEFAULT 0;

-- 7. Add payment_method (cash/card/upi/etc)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS payment_method text;

-- 8. Add created_by (who created this booking)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES users(id);

-- 9. Add use_custom_pricing (flag for custom pricing)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS use_custom_pricing boolean DEFAULT false;

-- 10. Add custom_package_price (custom price override)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS custom_package_price numeric(12,2);

-- 11. Add custom_deposit (custom deposit override)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS custom_deposit numeric(12,2);

-- 12. Add groom/bride details (if not already added by ADD_MISSING_BOOKING_FIELDS.sql)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS event_participant text;

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS groom_whatsapp text;

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS groom_address text;

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS bride_whatsapp text;

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS bride_address text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_package_bookings_security_deposit 
ON package_bookings(security_deposit) WHERE security_deposit > 0;

CREATE INDEX IF NOT EXISTS idx_package_bookings_sales_closed_by 
ON package_bookings(sales_closed_by_id) WHERE sales_closed_by_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_package_bookings_is_quote 
ON package_bookings(is_quote);

CREATE INDEX IF NOT EXISTS idx_package_bookings_created_by 
ON package_bookings(created_by);

CREATE INDEX IF NOT EXISTS idx_package_bookings_coupon_code 
ON package_bookings(coupon_code) WHERE coupon_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_package_bookings_use_custom_pricing 
ON package_bookings(use_custom_pricing) WHERE use_custom_pricing = true;

-- Add helpful comments
COMMENT ON COLUMN package_bookings.security_deposit IS 'Refundable security deposit amount for package bookings';
COMMENT ON COLUMN package_bookings.sales_closed_by_id IS 'Staff member who closed this sale (for incentives)';
COMMENT ON COLUMN package_bookings.is_quote IS 'True if this is a quote (not confirmed booking yet)';
COMMENT ON COLUMN package_bookings.discount_amount IS 'Manual discount amount in rupees';
COMMENT ON COLUMN package_bookings.coupon_code IS 'Coupon code applied to this booking';
COMMENT ON COLUMN package_bookings.coupon_discount IS 'Discount amount from coupon in rupees';
COMMENT ON COLUMN package_bookings.payment_method IS 'Payment method used (cash/card/upi/etc)';
COMMENT ON COLUMN package_bookings.created_by IS 'User who created this booking';
COMMENT ON COLUMN package_bookings.use_custom_pricing IS 'Whether custom pricing is being used instead of standard rates';
COMMENT ON COLUMN package_bookings.custom_package_price IS 'Custom package price override (when use_custom_pricing is true)';
COMMENT ON COLUMN package_bookings.custom_deposit IS 'Custom deposit amount override (when use_custom_pricing is true)';
COMMENT ON COLUMN package_bookings.event_participant IS 'Who the event is for (groom/bride/both)';
COMMENT ON COLUMN package_bookings.groom_whatsapp IS 'Groom WhatsApp number';
COMMENT ON COLUMN package_bookings.groom_address IS 'Groom home address';
COMMENT ON COLUMN package_bookings.bride_whatsapp IS 'Bride WhatsApp number';
COMMENT ON COLUMN package_bookings.bride_address IS 'Bride home address';

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
                            'payment_method', 'created_by', 'use_custom_pricing',
                            'custom_package_price', 'custom_deposit', 'event_participant',
                            'groom_whatsapp', 'groom_address', 'bride_whatsapp', 'bride_address') 
        THEN '✅ NEWLY ADDED/VERIFIED'
        ELSE '📋 Existing'
    END as status
FROM information_schema.columns 
WHERE table_name = 'package_bookings'
ORDER BY ordinal_position;

-- Summary of what was added
SELECT 
    '✅ ALL MISSING COLUMNS ADDED TO PACKAGE_BOOKINGS' as status,
    '16 columns added/verified' as summary,
    'security_deposit, sales_closed_by_id, is_quote, discount_amount, coupon_code, coupon_discount, payment_method, created_by, use_custom_pricing, custom_package_price, custom_deposit, event_participant, groom_whatsapp, groom_address, bride_whatsapp, bride_address' as columns_added;
