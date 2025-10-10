-- DISTANCE PRICING SETUP
-- Configure how much extra to charge based on distance

-- Option 1: Global Distance Pricing Tiers (Simple - applies to all packages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS distance_pricing_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_distance integer NOT NULL,
  max_distance integer,
  price_multiplier numeric(10,2),
  extra_price numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamp DEFAULT now()
);

-- Insert example global pricing tiers
INSERT INTO distance_pricing_tiers (min_distance, max_distance, price_multiplier, extra_price, is_active) VALUES
  (0, 50, 1.0, 0, true),           -- 0-50 km: No extra charge
  (51, 200, 1.1, null, true),      -- 51-200 km: 10% extra
  (201, 500, 1.2, null, true),     -- 201-500 km: 20% extra
  (501, 1000, 1.3, null, true),    -- 501-1000 km: 30% extra
  (1001, null, 1.5, null, true)    -- 1000+ km: 50% extra
ON CONFLICT DO NOTHING;

-- Examples of how this works:
-- Distance 597 km with base price ₹1,307:
--   → Matches tier: 501-1000 km
--   → Multiplier: 1.3x
--   → Distance charge: ₹1,307 × 0.3 = ₹392.10
--   → Final price: ₹1,307 + ₹392.10 = ₹1,699.10


-- Option 2: Per-Variant Distance Pricing (Advanced - specific rules per package)
-- ==============================================================================

-- This table already exists, add specific rules for variants:
-- INSERT INTO distance_pricing (variant_id, min_km, max_km, base_price_addition, price_multiplier) VALUES
--   ('<variant_id>', 0, 50, 0, null),      -- 0-50 km: No extra
--   ('<variant_id>', 51, 200, 500, null),  -- 51-200 km: +₹500 flat
--   ('<variant_id>', 201, 500, 1500, null), -- 201-500 km: +₹1,500 flat
--   ('<variant_id>', 501, null, null, 1.3); -- 501+ km: 1.3x multiplier


-- RECOMMENDED: Start with Global Pricing Tiers (Option 1)
-- They're simpler and apply to all packages automatically!

COMMENT ON TABLE distance_pricing_tiers IS 'Global distance-based pricing rules that apply to all packages';
