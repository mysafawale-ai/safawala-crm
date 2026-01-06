-- Add returned_at column to deliveries table if it doesn't exist
-- Run this in Supabase SQL Editor

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_confirmation_name TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_confirmation_phone TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_notes TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_photo_url TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS return_processed_by UUID;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'deliveries' 
AND column_name IN ('returned_at', 'return_confirmation_name', 'return_confirmation_phone', 'return_notes', 'return_photo_url', 'return_processed_by');
