-- Fix payment_type and payment_method constraints
-- This allows orders to be created properly

-- ========== PRODUCT_ORDERS ==========
-- Drop payment_type constraint and make nullable with default
ALTER TABLE product_orders DROP CONSTRAINT IF EXISTS product_orders_payment_type_check;
ALTER TABLE product_orders ALTER COLUMN payment_type DROP NOT NULL;
ALTER TABLE product_orders ALTER COLUMN payment_type SET DEFAULT 'full';

-- Drop payment_method constraint and set default
ALTER TABLE product_orders DROP CONSTRAINT IF EXISTS product_orders_payment_method_check;
ALTER TABLE product_orders ALTER COLUMN payment_method DROP NOT NULL;
ALTER TABLE product_orders ALTER COLUMN payment_method SET DEFAULT 'Cash / Offline Payment';

-- ========== PACKAGE_BOOKINGS ==========
-- Drop payment_type constraint and make nullable with default
ALTER TABLE package_bookings DROP CONSTRAINT IF EXISTS package_bookings_payment_type_check;
ALTER TABLE package_bookings ALTER COLUMN payment_type DROP NOT NULL;
ALTER TABLE package_bookings ALTER COLUMN payment_type SET DEFAULT 'full';

-- Drop payment_method constraint and set default  
ALTER TABLE package_bookings DROP CONSTRAINT IF EXISTS package_bookings_payment_method_check;
ALTER TABLE package_bookings ALTER COLUMN payment_method DROP NOT NULL;
ALTER TABLE package_bookings ALTER COLUMN payment_method SET DEFAULT 'Cash / Offline Payment';

SELECT 'payment_type and payment_method constraints fixed!' as status;
