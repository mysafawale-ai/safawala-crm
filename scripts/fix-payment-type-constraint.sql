-- Fix payment_type constraint - make it nullable with default
-- This allows orders to be created without payment_type

-- Drop the check constraint first
ALTER TABLE product_orders DROP CONSTRAINT IF EXISTS product_orders_payment_type_check;

-- Make payment_type nullable with default 'full'
ALTER TABLE product_orders ALTER COLUMN payment_type DROP NOT NULL;
ALTER TABLE product_orders ALTER COLUMN payment_type SET DEFAULT 'full';

-- Do the same for package_bookings if it exists
ALTER TABLE package_bookings DROP CONSTRAINT IF EXISTS package_bookings_payment_type_check;
ALTER TABLE package_bookings ALTER COLUMN payment_type DROP NOT NULL;
ALTER TABLE package_bookings ALTER COLUMN payment_type SET DEFAULT 'full';

SELECT 'payment_type constraints removed successfully' as status;
