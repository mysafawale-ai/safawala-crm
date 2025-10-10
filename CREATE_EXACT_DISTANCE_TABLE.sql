-- Create table to store exact pincode distances
-- This allows you to manually enter or import accurate distances

CREATE TABLE IF NOT EXISTS pincode_distances_exact (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_pincode varchar(6) NOT NULL,
  to_pincode varchar(6) NOT NULL,
  distance_km integer NOT NULL,
  method varchar(50) DEFAULT 'manual',
  source varchar(100),
  verified boolean DEFAULT false,
  notes text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(from_pincode, to_pincode)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pincode_distances_from ON pincode_distances_exact(from_pincode);
CREATE INDEX IF NOT EXISTS idx_pincode_distances_to ON pincode_distances_exact(to_pincode);
CREATE INDEX IF NOT EXISTS idx_pincode_distances_verified ON pincode_distances_exact(verified);

-- Insert exact distances from your store (390001) to common locations
-- Source: Google Maps driving distance

INSERT INTO pincode_distances_exact (from_pincode, to_pincode, distance_km, method, source, verified) VALUES
  ('390001', '390001', 0, 'exact', 'Same location', true),
  ('390001', '380001', 110, 'google_maps', 'Vadodara to Ahmedabad', true),
  ('390001', '380009', 115, 'google_maps', 'Vadodara to Ahmedabad', true),
  ('390001', '395001', 130, 'google_maps', 'Vadodara to Surat', true),
  ('390001', '360001', 225, 'google_maps', 'Vadodara to Rajkot', true),
  ('390001', '400001', 430, 'google_maps', 'Vadodara to Mumbai South', true),
  ('390001', '400051', 440, 'google_maps', 'Vadodara to Mumbai Bandra', true),
  ('390001', '400070', 445, 'google_maps', 'Vadodara to Mumbai Andheri', true),
  ('390001', '410001', 597, 'google_maps', 'Vadodara to Panvel', true),
  ('390001', '411001', 560, 'google_maps', 'Vadodara to Pune', true),
  ('390001', '440001', 720, 'google_maps', 'Vadodara to Nagpur', true),
  ('390001', '302001', 640, 'google_maps', 'Vadodara to Jaipur', true),
  ('390001', '303001', 650, 'google_maps', 'Vadodara to Jaipur area', true),
  ('390001', '313001', 235, 'google_maps', 'Vadodara to Udaipur', true),
  ('390001', '452001', 305, 'google_maps', 'Vadodara to Indore', true),
  ('390001', '462001', 640, 'google_maps', 'Vadodara to Bhopal', true),
  ('390001', '110001', 950, 'google_maps', 'Vadodara to Delhi', true),
  ('390001', '121001', 965, 'google_maps', 'Vadodara to Faridabad', true),
  ('390001', '122001', 970, 'google_maps', 'Vadodara to Gurgaon', true),
  ('390001', '201001', 980, 'google_maps', 'Vadodara to Ghaziabad', true),
  ('390001', '560001', 1100, 'google_maps', 'Vadodara to Bangalore', true),
  ('390001', '580001', 830, 'google_maps', 'Vadodara to Hubli', true),
  ('390001', '500001', 1050, 'google_maps', 'Vadodara to Hyderabad', true),
  ('390001', '600001', 1580, 'google_maps', 'Vadodara to Chennai', true),
  ('390001', '700001', 1970, 'google_maps', 'Vadodara to Kolkata', true)
ON CONFLICT (from_pincode, to_pincode) DO UPDATE SET
  distance_km = EXCLUDED.distance_km,
  method = EXCLUDED.method,
  source = EXCLUDED.source,
  verified = EXCLUDED.verified,
  updated_at = now();
  ('390001', '395001', 130, 'google_maps', 'Vadodara to Surat', true),
  ('390001', '360001', 225, 'google_maps', 'Vadodara to Rajkot', true),
  
  -- Maharashtra
  ('390001', '400001', 430, 'google_maps', 'Vadodara to Mumbai (South)', true),
  ('390001', '400051', 440, 'google_maps', 'Vadodara to Mumbai (Bandra)', true),
  ('390001', '400070', 445, 'google_maps', 'Vadodara to Mumbai (Andheri)', true),
  ('390001', '410001', 597, 'google_maps', 'Vadodara to Panvel/Raigad', true),
  ('390001', '411001', 560, 'google_maps', 'Vadodara to Pune', true),
  ('390001', '440001', 720, 'google_maps', 'Vadodara to Nagpur', true),
  
  -- Rajasthan
  ('390001', '302001', 640, 'google_maps', 'Vadodara to Jaipur', true),
  ('390001', '303001', 650, 'google_maps', 'Vadodara to Jaipur area', true),
  ('390001', '313001', 235, 'google_maps', 'Vadodara to Udaipur', true),
  
  -- Madhya Pradesh
  ('390001', '452001', 305, 'google_maps', 'Vadodara to Indore', true),
  ('390001', '462001', 640, 'google_maps', 'Vadodara to Bhopal', true),
  
  -- Delhi/NCR
  ('390001', '110001', 950, 'google_maps', 'Vadodara to Delhi', true),
  ('390001', '121001', 965, 'google_maps', 'Vadodara to Faridabad', true),
  ('390001', '122001', 970, 'google_maps', 'Vadodara to Gurgaon', true),
  ('390001', '201001', 980, 'google_maps', 'Vadodara to Ghaziabad', true),
  
  -- Karnataka
  ('390001', '560001', 1100, 'google_maps', 'Vadodara to Bangalore', true),
  ('390001', '580001', 830, 'google_maps', 'Vadodara to Hubli', true),
  
  -- Telangana
  ('390001', '500001', 1050, 'google_maps', 'Vadodara to Hyderabad', true),
  
  -- Tamil Nadu
  ('390001', '600001', 1580, 'google_maps', 'Vadodara to Chennai', true),

-- Create reverse entries (to -> from should have same distance)
INSERT INTO pincode_distances_exact (from_pincode, to_pincode, distance_km, method, source, verified)
SELECT to_pincode, from_pincode, distance_km, method, source, verified
FROM pincode_distances_exact
WHERE from_pincode = '390001' AND to_pincode != '390001'
ON CONFLICT (from_pincode, to_pincode) DO UPDATE SET
  distance_km = EXCLUDED.distance_km,
  method = EXCLUDED.method,
  source = EXCLUDED.source,
  verified = EXCLUDED.verified,
  updated_at = now();

