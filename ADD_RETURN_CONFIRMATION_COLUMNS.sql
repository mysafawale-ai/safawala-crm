-- Migration: Add return confirmation columns to returns table
-- This stores client confirmation details when processing returns

-- Add return confirmation columns
ALTER TABLE returns 
ADD COLUMN IF NOT EXISTS return_confirmation_name TEXT,
ADD COLUMN IF NOT EXISTS return_confirmation_phone TEXT,
ADD COLUMN IF NOT EXISTS return_photo_url TEXT;

-- Add return_items table if not exists (for saving item quantities before processing)
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  qty_delivered INTEGER NOT NULL DEFAULT 0,
  qty_returned INTEGER NOT NULL DEFAULT 0,
  qty_not_used INTEGER NOT NULL DEFAULT 0,
  qty_damaged INTEGER NOT NULL DEFAULT 0,
  qty_lost INTEGER NOT NULL DEFAULT 0,
  qty_to_laundry INTEGER NOT NULL DEFAULT 0,
  damage_reason TEXT,
  damage_description TEXT,
  damage_severity TEXT,
  lost_reason TEXT,
  lost_description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product_id ON return_items(product_id);

COMMENT ON COLUMN returns.return_confirmation_name IS 'Name of client during return handover';
COMMENT ON COLUMN returns.return_confirmation_phone IS 'Phone of client during return handover';
COMMENT ON COLUMN returns.return_photo_url IS 'Photo proof of return';

COMMENT ON TABLE return_items IS 'Stores individual product quantities and status during return processing';
