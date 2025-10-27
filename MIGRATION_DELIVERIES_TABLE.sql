-- Migration: Create deliveries table for order fulfillment tracking
-- This table stores delivery schedules linked to bookings (product_orders or package_bookings)

CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_number TEXT NOT NULL UNIQUE,
  
  -- Customer & Booking link
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  booking_id UUID,  -- References either product_orders.id or package_bookings.id
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
  franchise_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT chk_booking_source CHECK (booking_source IN ('product_order', 'package_booking')),
  CONSTRAINT chk_delivery_type CHECK (delivery_type IN ('standard', 'express', 'same_day', 'scheduled')),
  CONSTRAINT chk_status CHECK (status IN ('pending', 'in_transit', 'delivered', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_booking_id ON deliveries(booking_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivery_date ON deliveries(delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_franchise ON deliveries(franchise_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_staff ON deliveries(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);

-- Optional: Add foreign key constraints if referenced tables exist
-- Uncomment these if you have staff, franchises, and users tables:
-- ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_staff 
--   FOREIGN KEY (assigned_staff_id) REFERENCES staff(id) ON DELETE SET NULL;
-- ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_franchise 
--   FOREIGN KEY (franchise_id) REFERENCES franchises(id) ON DELETE CASCADE;
-- ALTER TABLE deliveries ADD CONSTRAINT fk_deliveries_user 
--   FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_deliveries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_deliveries_updated_at ON deliveries;

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
  -- Get the next sequence number
  SELECT COALESCE(MAX(CAST(SUBSTRING(delivery_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM deliveries
  WHERE delivery_number ~ '^DEL-[0-9]+$';
  
  -- Format as DEL-XXXXX (5 digits)
  delivery_num := 'DEL-' || LPAD(next_num::TEXT, 5, '0');
  
  RETURN delivery_num;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON deliveries TO authenticated;
GRANT EXECUTE ON FUNCTION generate_delivery_number() TO authenticated;
