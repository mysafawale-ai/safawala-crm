-- Add missing fields to package_bookings table that exist in product_orders

-- Add venue_name (venue_address already exists)
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS venue_name text;

-- Add discount_amount
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0;

-- Add payment_method
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS payment_method text;

-- Add coupon_code
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS coupon_code text;

-- Add coupon_discount
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS coupon_discount numeric(12,2) DEFAULT 0;

-- Add is_quote flag to differentiate quotes from confirmed bookings
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS is_quote boolean DEFAULT false;

-- Add distance_amount for distance-based pricing
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS distance_amount numeric(12,2) DEFAULT 0;

-- Add distance_km to track distance
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS distance_km numeric(10,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN package_bookings.venue_name IS 'Name of the venue';
COMMENT ON COLUMN package_bookings.discount_amount IS 'Manual discount amount applied';
COMMENT ON COLUMN package_bookings.payment_method IS 'Payment method used (Cash, UPI, Card, etc.)';
COMMENT ON COLUMN package_bookings.coupon_code IS 'Coupon code applied';
COMMENT ON COLUMN package_bookings.coupon_discount IS 'Discount amount from coupon';
COMMENT ON COLUMN package_bookings.is_quote IS 'True if this is a quote, false if confirmed booking';
COMMENT ON COLUMN package_bookings.distance_amount IS 'Additional charges based on delivery distance';
COMMENT ON COLUMN package_bookings.distance_km IS 'Distance in kilometers for delivery';

-- Verify all columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
  AND column_name IN (
    'venue_name', 'discount_amount', 'payment_method', 
    'coupon_code', 'coupon_discount', 'is_quote',
    'distance_amount', 'distance_km', 'security_deposit'
  )
ORDER BY column_name;
