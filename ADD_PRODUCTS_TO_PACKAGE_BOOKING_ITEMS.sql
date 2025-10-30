-- Migration: Add product columns to package_booking_items table
-- Purpose: Allow storing individual products within package bookings
-- Date: 2025-10-29

-- Add product_id column (nullable, can store products selected within a package)
ALTER TABLE package_booking_items
ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

-- Add quantity column for products
ALTER TABLE package_booking_items
ADD COLUMN product_quantity INTEGER DEFAULT 1;

-- Add unit_price column for products
ALTER TABLE package_booking_items
ADD COLUMN product_unit_price DECIMAL(12, 2) DEFAULT 0;

-- Add total_price column for products
ALTER TABLE package_booking_items
ADD COLUMN product_total_price DECIMAL(12, 2) DEFAULT 0;

-- Create index on product_id for faster queries
CREATE INDEX idx_package_booking_items_product_id ON package_booking_items(product_id);

-- Create index on booking_id for faster queries
CREATE INDEX idx_package_booking_items_booking_id ON package_booking_items(booking_id);

-- Add comment to clarify column usage
COMMENT ON COLUMN package_booking_items.product_id IS 'Individual product added to the package booking. Can coexist with package_id for mixed bookings.';
COMMENT ON COLUMN package_booking_items.product_quantity IS 'Quantity of the specific product in this package booking item.';
COMMENT ON COLUMN package_booking_items.product_unit_price IS 'Unit price of the product at time of booking.';
COMMENT ON COLUMN package_booking_items.product_total_price IS 'Total price for this product item (quantity × unit_price).';
