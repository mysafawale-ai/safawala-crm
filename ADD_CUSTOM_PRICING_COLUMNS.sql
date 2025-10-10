-- Add custom pricing support to package_bookings table

ALTER TABLE package_bookings
ADD COLUMN IF NOT EXISTS use_custom_pricing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_package_price numeric(10,2),
ADD COLUMN IF NOT EXISTS custom_deposit numeric(10,2);

-- Add comments
COMMENT ON COLUMN package_bookings.use_custom_pricing IS 'True if custom pricing was used instead of calculated pricing';
COMMENT ON COLUMN package_bookings.custom_package_price IS 'Custom package price (before GST) when use_custom_pricing is true';
COMMENT ON COLUMN package_bookings.custom_deposit IS 'Custom deposit amount when use_custom_pricing is true';

-- Create index for filtering bookings with custom pricing
CREATE INDEX IF NOT EXISTS idx_package_bookings_custom_pricing ON package_bookings(use_custom_pricing) WHERE use_custom_pricing = true;
