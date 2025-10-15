-- Migration: Product Archive Table
-- Purpose: Store records of lost, damaged, stolen, or discontinued products
-- Date: 2025-10-15

-- Create product_archive table
CREATE TABLE IF NOT EXISTS product_archive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT,
  barcode TEXT,
  category TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('lost', 'damaged', 'stolen', 'worn_out', 'discontinued', 'sold', 'other')),
  notes TEXT,
  original_rental_price NUMERIC(10, 2),
  original_sale_price NUMERIC(10, 2),
  image_url TEXT,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived_by UUID REFERENCES auth.users(id),
  franchise_id UUID REFERENCES franchises(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_archive_product_id ON product_archive(product_id);
CREATE INDEX IF NOT EXISTS idx_product_archive_reason ON product_archive(reason);
CREATE INDEX IF NOT EXISTS idx_product_archive_archived_at ON product_archive(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_archive_franchise_id ON product_archive(franchise_id);

-- Enable Row Level Security
ALTER TABLE product_archive ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_archive

-- Super admin can see all archived products
CREATE POLICY "Super admins can view all archived products"
  ON product_archive
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Franchise admins and staff can see their franchise's archived products
CREATE POLICY "Franchise users can view their archived products"
  ON product_archive
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.franchise_id = product_archive.franchise_id
      AND users.role IN ('franchise_admin', 'staff')
    )
  );

-- Super admin can archive any product
CREATE POLICY "Super admins can archive products"
  ON product_archive
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Franchise admins and staff can archive their products
CREATE POLICY "Franchise admins and staff can archive their products"
  ON product_archive
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.franchise_id = product_archive.franchise_id
      AND users.role IN ('franchise_admin', 'staff')
    )
  );

-- Super admin can delete (restore) any archived product
CREATE POLICY "Super admins can delete archived products"
  ON product_archive
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );

-- Franchise admins and staff can delete (restore) their archived products
CREATE POLICY "Franchise admins and staff can delete their archived products"
  ON product_archive
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.franchise_id = product_archive.franchise_id
      AND users.role IN ('franchise_admin', 'staff')
    )
  );

-- Create function to auto-set franchise_id from user
CREATE OR REPLACE FUNCTION set_archive_franchise_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.franchise_id IS NULL THEN
    NEW.franchise_id := (
      SELECT franchise_id 
      FROM users 
      WHERE id = auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set franchise_id
DROP TRIGGER IF EXISTS set_archive_franchise_id_trigger ON product_archive;
CREATE TRIGGER set_archive_franchise_id_trigger
  BEFORE INSERT ON product_archive
  FOR EACH ROW
  EXECUTE FUNCTION set_archive_franchise_id();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_product_archive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_archive_updated_at_trigger ON product_archive;
CREATE TRIGGER update_product_archive_updated_at_trigger
  BEFORE UPDATE ON product_archive
  FOR EACH ROW
  EXECUTE FUNCTION update_product_archive_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON product_archive TO authenticated;

COMMENT ON TABLE product_archive IS 'Archive for lost, damaged, stolen, or discontinued products';
COMMENT ON COLUMN product_archive.reason IS 'Reason for archiving: lost, damaged, stolen, worn_out, discontinued, sold, other';
COMMENT ON COLUMN product_archive.notes IS 'Additional details about why the product was archived';
COMMENT ON COLUMN product_archive.archived_by IS 'User ID who archived the product';
