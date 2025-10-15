-- Add payment_method field to product_orders, package_bookings, and invoices tables
-- This field stores the payment method used by the customer

-- 1. Add to product_orders table
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash / Offline Payment';

-- Add check constraint for valid payment methods
ALTER TABLE product_orders 
DROP CONSTRAINT IF EXISTS product_orders_payment_method_check;

ALTER TABLE product_orders 
ADD CONSTRAINT product_orders_payment_method_check 
CHECK (payment_method IN (
  'UPI / QR Payment',
  'Bank Transfer',
  'Debit / Credit Card',
  'Cash / Offline Payment',
  'International Payment Method'
));

-- 2. Add to package_bookings table
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash / Offline Payment';

-- Add check constraint for valid payment methods
ALTER TABLE package_bookings 
DROP CONSTRAINT IF EXISTS package_bookings_payment_method_check;

ALTER TABLE package_bookings 
ADD CONSTRAINT package_bookings_payment_method_check 
CHECK (payment_method IN (
  'UPI / QR Payment',
  'Bank Transfer',
  'Debit / Credit Card',
  'Cash / Offline Payment',
  'International Payment Method'
));

-- 3. Add to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'Cash / Offline Payment';

-- Add check constraint for valid payment methods
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_payment_method_check;

ALTER TABLE invoices 
ADD CONSTRAINT invoices_payment_method_check 
CHECK (payment_method IN (
  'UPI / QR Payment',
  'Bank Transfer',
  'Debit / Credit Card',
  'Cash / Offline Payment',
  'International Payment Method'
));

-- Create index for faster filtering by payment method
CREATE INDEX IF NOT EXISTS idx_product_orders_payment_method ON product_orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_package_bookings_payment_method ON package_bookings(payment_method);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON invoices(payment_method);

-- Verify the changes
SELECT 
  'product_orders' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
  AND column_name = 'payment_method'
UNION ALL
SELECT 
  'package_bookings' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
  AND column_name = 'payment_method'
UNION ALL
SELECT 
  'invoices' as table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'invoices' 
  AND column_name = 'payment_method';
