-- Create new table: package_booking_product_items
-- Purpose: Store individual products selected for package bookings
-- This is separate from package_booking_items which handles package-level items

CREATE TABLE package_booking_product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_booking_id UUID NOT NULL REFERENCES package_bookings(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for fast queries
CREATE INDEX idx_package_booking_product_items_booking_id ON package_booking_product_items(package_booking_id);
CREATE INDEX idx_package_booking_product_items_product_id ON package_booking_product_items(product_id);
CREATE INDEX idx_package_booking_product_items_created_at ON package_booking_product_items(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE package_booking_product_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view items from their franchise bookings
CREATE POLICY "view_package_booking_product_items"
ON package_booking_product_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    WHERE pb.id = package_booking_product_items.package_booking_id
    AND pb.franchise_id = (SELECT franchise_id FROM auth.users WHERE id = auth.uid())
  )
);

-- Policy: Users can insert items to their franchise bookings
CREATE POLICY "insert_package_booking_product_items"
ON package_booking_product_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    WHERE pb.id = package_booking_product_items.package_booking_id
    AND pb.franchise_id = (SELECT franchise_id FROM auth.users WHERE id = auth.uid())
  )
);

-- Policy: Users can update items in their franchise bookings
CREATE POLICY "update_package_booking_product_items"
ON package_booking_product_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    WHERE pb.id = package_booking_product_items.package_booking_id
    AND pb.franchise_id = (SELECT franchise_id FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    WHERE pb.id = package_booking_product_items.package_booking_id
    AND pb.franchise_id = (SELECT franchise_id FROM auth.users WHERE id = auth.uid())
  )
);

-- Policy: Users can delete items from their franchise bookings
CREATE POLICY "delete_package_booking_product_items"
ON package_booking_product_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    WHERE pb.id = package_booking_product_items.package_booking_id
    AND pb.franchise_id = (SELECT franchise_id FROM auth.users WHERE id = auth.uid())
  )
);

-- Add comments for documentation
COMMENT ON TABLE package_booking_product_items IS 'Stores individual products selected for package bookings. Each package booking can have multiple products.';
COMMENT ON COLUMN package_booking_product_items.package_booking_id IS 'Reference to the package booking this product is added to';
COMMENT ON COLUMN package_booking_product_items.product_id IS 'Reference to the product from inventory';
COMMENT ON COLUMN package_booking_product_items.quantity IS 'Quantity of this product for this booking';
COMMENT ON COLUMN package_booking_product_items.unit_price IS 'Unit price of product at time of booking';
COMMENT ON COLUMN package_booking_product_items.total_price IS 'Total price (quantity × unit_price)';
