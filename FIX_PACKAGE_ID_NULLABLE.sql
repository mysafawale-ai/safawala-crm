-- Fix: Make package_id nullable in package_booking_items
-- Purpose: Allow storing product items without requiring a package_id
-- This enables mixed bookings with both products and packages

-- Make package_id nullable (allow NULL values)
ALTER TABLE package_booking_items
ALTER COLUMN package_id DROP NOT NULL;

-- Add a check constraint to ensure at least one of package_id or product_id is present
ALTER TABLE package_booking_items
ADD CONSTRAINT check_item_type CHECK (
  (package_id IS NOT NULL AND product_id IS NULL) OR
  (package_id IS NULL AND product_id IS NOT NULL) OR
  (package_id IS NOT NULL AND product_id IS NOT NULL)
);
