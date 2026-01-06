-- Add notes and photo columns to return processing tables
-- These columns store the per-return notes and photo captured during return processing

ALTER TABLE laundry_items
ADD COLUMN IF NOT EXISTS return_photo_url TEXT;

ALTER TABLE product_archive
ADD COLUMN IF NOT EXISTS return_photo_url TEXT;

ALTER TABLE order_lost_damaged_items
ADD COLUMN IF NOT EXISTS return_photo_url TEXT;
