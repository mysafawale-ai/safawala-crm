-- =====================================================
-- OFFERS SYSTEM - COMPLETE REWRITE MIGRATION
-- =====================================================
-- Migration from complex coupon system to simplified offers system
-- Created: 2025-11-18
-- =====================================================

-- =====================================================
-- PHASE 1: DROP OLD COMPLEX TABLES
-- =====================================================

-- Drop coupon_usage first (has foreign key to coupons)
DROP TABLE IF EXISTS coupon_usage CASCADE;

-- Drop coupons table
DROP TABLE IF EXISTS coupons CASCADE;

-- =====================================================
-- PHASE 2: CREATE NEW SIMPLIFIED TABLES
-- =====================================================

-- Single table for offers (no complex tracking)
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    is_active BOOLEAN DEFAULT true,
    franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique code per franchise
    UNIQUE(code, franchise_id)
);

-- Simple tracking (actually works)
CREATE TABLE offer_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('product', 'package')),
    order_id UUID NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    franchise_id UUID NOT NULL REFERENCES franchises(id)
);

-- =====================================================
-- PHASE 3: ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Offers table indexes
CREATE INDEX idx_offers_franchise_id ON offers(franchise_id);
CREATE INDEX idx_offers_code ON offers(code);
CREATE INDEX idx_offers_active ON offers(is_active);

-- Offer redemptions table indexes
CREATE INDEX idx_offer_redemptions_offer_id ON offer_redemptions(offer_id);
CREATE INDEX idx_offer_redemptions_customer_id ON offer_redemptions(customer_id);
CREATE INDEX idx_offer_redemptions_franchise_id ON offer_redemptions(franchise_id);
CREATE INDEX idx_offer_redemptions_order ON offer_redemptions(order_type, order_id);

-- =====================================================
-- PHASE 4: ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE offers IS 'Simplified offers table replacing complex coupons system';
COMMENT ON TABLE offer_redemptions IS 'Simple redemption tracking that actually works';
COMMENT ON COLUMN offers.code IS 'Unique offer code per franchise (3-20 alphanumeric chars)';
COMMENT ON COLUMN offers.name IS 'Human-readable offer name for admin interface';
COMMENT ON COLUMN offers.discount_type IS 'Either percent or fixed discount type';
COMMENT ON COLUMN offers.discount_value IS 'Discount amount (> 0, percentage or fixed amount)';
COMMENT ON COLUMN offer_redemptions.order_type IS 'Either product or package order type';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Next steps:
-- 1. Run this SQL in Supabase
-- 2. Update API routes to use new tables
-- 3. Update UI components
-- 4. Update order pages to use new endpoints
-- =====================================================