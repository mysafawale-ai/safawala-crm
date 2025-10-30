-- Add has_items column to package_bookings table
-- This flag indicates if the package booking has selected products

ALTER TABLE package_bookings
ADD COLUMN has_items BOOLEAN DEFAULT FALSE;

-- Create index for fast queries
CREATE INDEX idx_package_bookings_has_items ON package_bookings(has_items);

-- Add comment for documentation
COMMENT ON COLUMN package_bookings.has_items IS 'Boolean flag indicating if this package booking has selected items/products';
