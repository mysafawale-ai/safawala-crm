-- Migration: Add missing timestamp columns to deliveries table
-- Run this in Supabase SQL Editor

-- Add started_at column (for when delivery goes to in_transit)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Add delivered_at column (for when delivery is marked delivered)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Add cancelled_at column (for when delivery is cancelled)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add delivery confirmation columns
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_confirmation_name TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_confirmation_phone TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_items_count INTEGER;

-- Add return confirmation columns
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_confirmation_name TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_confirmation_phone TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_photo_url TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_notes TEXT;

-- Create indexes for timestamp columns
CREATE INDEX IF NOT EXISTS idx_deliveries_started_at ON deliveries(started_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON deliveries(delivered_at);
CREATE INDEX IF NOT EXISTS idx_deliveries_cancelled_at ON deliveries(cancelled_at);

-- Comments
COMMENT ON COLUMN deliveries.started_at IS 'Timestamp when delivery status changed to in_transit';
COMMENT ON COLUMN deliveries.delivered_at IS 'Timestamp when delivery was marked as delivered';
COMMENT ON COLUMN deliveries.cancelled_at IS 'Timestamp when delivery was cancelled';
COMMENT ON COLUMN deliveries.delivery_confirmation_name IS 'Name of client who received the delivery';
COMMENT ON COLUMN deliveries.delivery_confirmation_phone IS 'Phone number of client who received delivery';
COMMENT ON COLUMN deliveries.delivery_photo_url IS 'URL of handover photo';
COMMENT ON COLUMN deliveries.delivery_notes IS 'Notes added during delivery confirmation';
COMMENT ON COLUMN deliveries.delivery_items_count IS 'Number of items delivered';
