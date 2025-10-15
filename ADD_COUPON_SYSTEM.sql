-- =====================================================
-- COUPON CODE SYSTEM - DATABASE MIGRATION
-- =====================================================
-- This migration adds comprehensive coupon code support
-- Created: 2025-10-15
-- =====================================================

-- =====================================================
-- 1. CREATE COUPONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'flat', 'free_shipping', 'buy_x_get_y')),
    discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value >= 0),
    min_order_value DECIMAL(10, 2) DEFAULT 0,
    max_discount DECIMAL(10, 2), -- For percentage discounts, cap the max discount amount OR for buy_x_get_y, the Y (get) quantity
    usage_limit INTEGER, -- NULL means unlimited
    usage_count INTEGER DEFAULT 0 NOT NULL,
    per_user_limit INTEGER, -- How many times a single customer can use this coupon
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    franchise_id UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_discount_value CHECK (
        (discount_type = 'percentage' AND discount_value <= 100) OR
        (discount_type IN ('flat', 'free_shipping'))
    ),
    CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- =====================================================
-- 2. CREATE COUPON USAGE TRACKING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    order_id UUID, -- Can reference either product_orders or package_bookings
    order_type VARCHAR(20) CHECK (order_type IN ('product_order', 'package_booking')),
    discount_applied DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    franchise_id UUID REFERENCES users(id),
    
    -- Indexes for fast lookups
    CONSTRAINT fk_order_type CHECK (
        (order_type = 'product_order' OR order_type = 'package_booking')
    )
);

-- =====================================================
-- 3. ADD COUPON FIELDS TO PRODUCT_ORDERS
-- =====================================================
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0);

-- =====================================================
-- 4. ADD COUPON FIELDS TO PACKAGE_BOOKINGS
-- =====================================================
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10, 2) DEFAULT 0 CHECK (coupon_discount >= 0);

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Coupons table indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_franchise ON coupons(franchise_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- Coupon usage indexes
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_customer ON coupon_usage(customer_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order ON coupon_usage(order_id, order_type);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_franchise ON coupon_usage(franchise_id);

-- Product orders coupon index
CREATE INDEX IF NOT EXISTS idx_product_orders_coupon ON product_orders(coupon_code);

-- Package bookings coupon index
CREATE INDEX IF NOT EXISTS idx_package_bookings_coupon ON package_bookings(coupon_code);

-- =====================================================
-- 6. CREATE UPDATED_AT TRIGGER FOR COUPONS
-- =====================================================
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coupons_timestamp
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

-- =====================================================
-- 7. INSERT SAMPLE COUPONS (OPTIONAL - FOR TESTING)
-- =====================================================
-- Uncomment below to add sample coupons

-- INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_discount, usage_limit, valid_until, is_active)
-- VALUES 
--     ('WELCOME10', 'Welcome offer - 10% off', 'percentage', 10, 0, 500, NULL, NOW() + INTERVAL '30 days', true),
--     ('FLAT500', 'Flat ₹500 discount', 'flat', 500, 2000, NULL, 100, NOW() + INTERVAL '15 days', true),
--     ('FREESHIP', 'Free shipping on orders', 'free_shipping', 0, 1000, NULL, NULL, NOW() + INTERVAL '60 days', true),
--     ('MEGA20', 'Mega sale - 20% off', 'percentage', 20, 5000, 2000, 50, NOW() + INTERVAL '7 days', true),
--     ('VIP1000', 'VIP customer discount', 'flat', 1000, 10000, NULL, NULL, NOW() + INTERVAL '90 days', true);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on coupons table
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Enable RLS on coupon_usage table
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view active coupons in their franchise
CREATE POLICY coupons_select_policy ON coupons
    FOR SELECT
    USING (
        is_active = true AND
        (franchise_id IS NULL OR franchise_id = auth.uid())
    );

-- Policy: Only authenticated users can insert coupons
CREATE POLICY coupons_insert_policy ON coupons
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own coupons
CREATE POLICY coupons_update_policy ON coupons
    FOR UPDATE
    USING (created_by = auth.uid() OR franchise_id = auth.uid());

-- Policy: Users can delete their own coupons
CREATE POLICY coupons_delete_policy ON coupons
    FOR DELETE
    USING (created_by = auth.uid() OR franchise_id = auth.uid());

-- Policy: Users can view coupon usage in their franchise
CREATE POLICY coupon_usage_select_policy ON coupon_usage
    FOR SELECT
    USING (franchise_id IS NULL OR franchise_id = auth.uid());

-- Policy: Authenticated users can insert coupon usage
CREATE POLICY coupon_usage_insert_policy ON coupon_usage
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================

-- Check if tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name IN ('coupons', 'coupon_usage');

-- Check if columns were added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name IN ('product_orders', 'package_bookings') 
-- AND column_name IN ('coupon_code', 'coupon_discount');

-- Check indexes
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('coupons', 'coupon_usage', 'product_orders', 'package_bookings')
-- AND indexname LIKE '%coupon%';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this migration in Supabase SQL Editor
-- 2. Verify tables and columns were created
-- 3. Test coupon creation and validation APIs
-- 4. Update frontend to use coupon system
-- =====================================================
