-- Remove unused columns from coupons table
-- These fields were removed from the UI to simplify coupon creation
-- Keeping only: code, discount_type, discount_value

ALTER TABLE coupons
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS min_order_value,
DROP COLUMN IF EXISTS max_discount,
DROP COLUMN IF EXISTS usage_limit,
DROP COLUMN IF EXISTS usage_count,
DROP COLUMN IF EXISTS per_user_limit,
DROP COLUMN IF EXISTS valid_from,
DROP COLUMN IF EXISTS valid_until,
DROP COLUMN IF EXISTS is_active;

-- Verify remaining columns
-- Should have:
-- id, code, discount_type, discount_value, franchise_id, created_at, updated_at
