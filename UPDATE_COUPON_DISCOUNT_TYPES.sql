-- =====================================================
-- UPDATE COUPON SYSTEM - ADD BUY X GET Y DISCOUNT TYPE
-- =====================================================
-- Run this AFTER ADD_COUPON_SYSTEM.sql if you already ran that migration
-- This adds the new 'buy_x_get_y' discount type to existing system
-- Date: 2025-10-15
-- =====================================================

-- Update the CHECK constraint to include new discount type
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;

ALTER TABLE coupons 
ADD CONSTRAINT coupons_discount_type_check 
CHECK (discount_type IN ('percentage', 'flat', 'free_shipping', 'buy_x_get_y'));

-- Update the comment on max_discount column
COMMENT ON COLUMN coupons.max_discount IS 'For percentage: max discount cap amount. For buy_x_get_y: the Y (get) quantity';

-- Verification query
SELECT 
  constraint_name, 
  check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'coupons_discount_type_check';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
