-- ADD QTY_NOT_USED TO RETURN_ITEMS TABLE
-- This migration adds support for tracking items that were delivered but never used (extra items)
-- These items skip laundry and go directly back to available inventory

-- Add qty_not_used column
ALTER TABLE return_items 
ADD COLUMN IF NOT EXISTS qty_not_used INT NOT NULL DEFAULT 0;

-- Drop old constraint
ALTER TABLE return_items 
DROP CONSTRAINT IF EXISTS chk_qty_match;

-- Add updated constraint that includes qty_not_used
ALTER TABLE return_items
ADD CONSTRAINT chk_qty_match CHECK (
  qty_delivered = qty_returned + qty_not_used + qty_damaged + qty_lost
);

-- Add comment explaining the fields
COMMENT ON COLUMN return_items.qty_returned IS 'Items that were used and need laundry';
COMMENT ON COLUMN return_items.qty_not_used IS 'Extra items that were never used - skip laundry, go directly to available';
COMMENT ON COLUMN return_items.qty_damaged IS 'Items returned with damage';
COMMENT ON COLUMN return_items.qty_lost IS 'Items that were stolen or lost';

-- Update existing records to set qty_not_used to 0 (already default)
-- No data migration needed since we're adding a new category
