-- Add missing columns to coupons table
-- These are the essential columns needed for the simplified coupon system

ALTER TABLE coupons
ADD COLUMN IF NOT EXISTS code VARCHAR(50) NOT NULL UNIQUE,
ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'flat', 'free_shipping')),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS franchise_id UUID NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_franchise_id ON coupons(franchise_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS coupons_update_timestamp ON coupons;
CREATE TRIGGER coupons_update_timestamp
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();
