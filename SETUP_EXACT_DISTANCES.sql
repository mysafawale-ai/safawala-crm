-- AUTO-FETCH DISTANCE SYSTEM
-- This table automatically stores distances as they are calculated
-- No need to pre-populate 19,000+ pincodes!

-- Step 1: Create table for auto-caching distances
CREATE TABLE IF NOT EXISTS pincode_distances_exact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_pincode varchar(6) NOT NULL,
  to_pincode varchar(6) NOT NULL,
  distance_km integer NOT NULL,
  method varchar(50) DEFAULT 'api',
  source varchar(100),
  verified boolean DEFAULT false,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(from_pincode, to_pincode)
);

-- Step 2: Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_pincode_distances_from ON pincode_distances_exact(from_pincode);
CREATE INDEX IF NOT EXISTS idx_pincode_distances_to ON pincode_distances_exact(to_pincode);
CREATE INDEX IF NOT EXISTS idx_pincode_distances_verified ON pincode_distances_exact(verified);
CREATE INDEX IF NOT EXISTS idx_pincode_distances_created ON pincode_distances_exact(created_at);

-- Step 3: Insert only your store location (base pincode)
INSERT INTO pincode_distances_exact (from_pincode, to_pincode, distance_km, method, source, verified) VALUES
  ('390001', '390001', 0, 'exact', 'Same location', true)
ON CONFLICT (from_pincode, to_pincode) DO NOTHING;

-- All other distances will be automatically fetched and cached when customers are selected!
-- The system will:
-- 1. Check this table first
-- 2. If not found, call distance API
-- 3. Cache the result here
-- 4. Reuse cached value for future bookings
