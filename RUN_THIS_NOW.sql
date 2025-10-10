-- DELIVERIES TABLE MIGRATION - RUN THIS IN SUPABASE SQL EDITOR
-- This creates a clean deliveries table without problematic references

-- Step 1: Drop if exists (clean slate)
DROP TABLE IF EXISTS deliveries CASCADE;
DROP FUNCTION IF EXISTS update_deliveries_updated_at() CASCADE;
DROP FUNCTION IF EXISTS generate_delivery_number() CASCADE;

-- Step 2: Create the deliveries table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT NOT NULL UNIQUE,
  
  -- Customer & Booking
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
  
  -- Driver & Vehicle
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Add constraints
ALTER TABLE deliveries ADD CONSTRAINT chk_booking_source 
  CHECK (booking_source IN ('product_order', 'package_booking'));
  
ALTER TABLE deliveries ADD CONSTRAINT chk_delivery_type 
  CHECK (delivery_type IN ('standard', 'express', 'same_day', 'scheduled'));
  
ALTER TABLE deliveries ADD CONSTRAINT chk_status 
  CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled'));

-- Step 4: Create indexes
CREATE INDEX idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX idx_deliveries_booking_id ON deliveries(booking_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX idx_deliveries_franchise ON deliveries(franchise_id);
CREATE INDEX idx_deliveries_created_at ON deliveries(created_at DESC);

-- Step 5: Create trigger function for updated_at
CREATE FUNCTION update_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger
CREATE TRIGGER trigger_update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_deliveries_updated_at();

-- Step 7: Create delivery number generator
CREATE FUNCTION generate_delivery_number()
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

-- Step 8: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON deliveries TO authenticated;
GRANT EXECUTE ON FUNCTION generate_delivery_number() TO authenticated;

-- Step 9: Verify everything worked
SELECT 'SUCCESS! Deliveries table created.' as message;
SELECT generate_delivery_number() as first_number;
