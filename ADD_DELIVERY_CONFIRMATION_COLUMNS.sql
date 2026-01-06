-- Migration: Add delivery confirmation columns to deliveries table
-- This stores client confirmation details when marking delivery as complete

-- Add delivery confirmation columns
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS delivery_confirmation_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_confirmation_phone TEXT,
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
ADD COLUMN IF NOT EXISTS delivery_items_count INTEGER;

-- Add return confirmation columns (for when return is completed)
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS return_confirmation_name TEXT,
ADD COLUMN IF NOT EXISTS return_confirmation_phone TEXT,
ADD COLUMN IF NOT EXISTS return_photo_url TEXT,
ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON deliveries(delivered_at);

COMMENT ON COLUMN deliveries.delivery_confirmation_name IS 'Name of client who received the delivery';
COMMENT ON COLUMN deliveries.delivery_confirmation_phone IS 'Phone of client who received the delivery';
COMMENT ON COLUMN deliveries.delivery_photo_url IS 'Photo proof of delivery';
COMMENT ON COLUMN deliveries.delivery_notes IS 'Notes during delivery handover';
COMMENT ON COLUMN deliveries.delivery_items_count IS 'Count of items delivered';
COMMENT ON COLUMN deliveries.return_confirmation_name IS 'Name of client during return';
COMMENT ON COLUMN deliveries.return_confirmation_phone IS 'Phone of client during return';
COMMENT ON COLUMN deliveries.return_photo_url IS 'Photo proof of return';
COMMENT ON COLUMN deliveries.return_notes IS 'Notes during return handover';
