-- Add photo and notes columns to items tables for return processing
-- This allows each item to have its own notes and photo

ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_notes TEXT;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS return_photo_url TEXT;

ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_notes TEXT;
ALTER TABLE package_booking_product_items ADD COLUMN IF NOT EXISTS return_photo_url TEXT;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('product_order_items', 'package_booking_product_items')
AND column_name IN ('return_notes', 'return_photo_url')
ORDER BY table_name, column_name;
