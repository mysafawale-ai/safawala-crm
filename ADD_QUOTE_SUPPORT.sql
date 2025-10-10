-- Add Quote Support to Product Orders and Package Bookings
-- This allows creating quotes (no inventory impact) vs orders (inventory impact)

-- Add is_quote field to product_orders
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS is_quote BOOLEAN DEFAULT FALSE;

-- Add is_quote field to package_bookings
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS is_quote BOOLEAN DEFAULT FALSE;

-- Add new status value for quotes
-- Existing statuses: pending_payment, confirmed, in_progress, completed, cancelled
-- New status: quote

-- Add comments
COMMENT ON COLUMN product_orders.is_quote IS 'True if this is a quote, false if confirmed order';
COMMENT ON COLUMN package_bookings.is_quote IS 'True if this is a quote, false if confirmed order';

-- Create index for faster quote queries
CREATE INDEX IF NOT EXISTS idx_product_orders_is_quote ON product_orders(is_quote);
CREATE INDEX IF NOT EXISTS idx_package_bookings_is_quote ON package_bookings(is_quote);

-- Examples:
-- Quote: is_quote = TRUE, status = 'quote', order_number starts with 'QT-'
-- Order: is_quote = FALSE, status = 'pending_payment', order_number starts with 'ORD-' or 'PKG-'
