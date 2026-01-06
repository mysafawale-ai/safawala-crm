-- Migration: Add source tracking to product_archive
-- Purpose: Track whether items come from invoice creation or process-return
-- Date: 2025-01-07

-- Add source column to product_archive
ALTER TABLE product_archive
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_id UUID,
ADD COLUMN IF NOT EXISTS variant_id UUID,
ADD COLUMN IF NOT EXISTS variant_name TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS booking_id UUID,
ADD COLUMN IF NOT EXISTS created_by UUID;

-- Add index for source filtering
CREATE INDEX IF NOT EXISTS idx_product_archive_source ON product_archive(source);
CREATE INDEX IF NOT EXISTS idx_product_archive_source_id ON product_archive(source_id);

-- Add comment for documentation
COMMENT ON COLUMN product_archive.source IS 'Source of archiving: invoice, delivery_return, or manual';
COMMENT ON COLUMN product_archive.source_id IS 'ID of the source record (order_id or delivery_id)';
COMMENT ON COLUMN product_archive.quantity IS 'Number of units archived in this record';
