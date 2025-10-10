-- Fix: Drop and recreate deliveries table without staff reference
-- Since staff table doesn't exist, we'll make it work without it

-- Drop existing table (this is safe since you just created it)
DROP TABLE IF EXISTS deliveries CASCADE;

-- Recreate without problematic references
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT NOT NULL UNIQUE,
  
  -- Customer & Booking link
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID,
  booking_source TEXT,
  
  -- Delivery details
  delivery_type TEXT NOT NULL DEFAULT 'standard',
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Addresses
  pickup_address TEXT,
  delivery_address TEXT NOT NULL,
  
  -- Dates
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  
  -- Driver & Vehicle (storing as text, not FK since staff table doesn't exist)
  driver_name TEXT,
  vehicle_number TEXT,
  assigned_staff_id UUID,
  
  -- Costs
  delivery_charge DECIMAL(10,2) DEFAULT 0,
  fuel_cost DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (COALESCE(delivery_charge, 0) + COALESCE(fuel_cost, 0)) STORED,
  
  -- Notes
  special_instructions TEXT,
  
  -- Metadata
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_booking_source CHECK (booking_source IN ('product_order', 'package_booking')),
  CONSTRAINT chk_delivery_type CHECK (delivery_type IN ('standard', 'express', 'same_day', 'scheduled')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_deliveries_booking_id ON deliveries(booking_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_franchise ON deliveries(franchise_id);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_deliveries_updated_at();

-- RPC function to generate delivery number
CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  delivery_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM deliveries
  WHERE delivery_number ~ '^DEL-[0-9]+$';
  
  delivery_num := 'DEL-' || LPAD(next_num::TEXT, 5, '0');
  RETURN delivery_num;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON deliveries TO authenticated;
GRANT EXECUTE ON FUNCTION generate_delivery_number() TO authenticated;

-- Verify it worked
SELECT 'Deliveries table created successfully!' as status;
SELECT generate_delivery_number() as first_delivery_number;
