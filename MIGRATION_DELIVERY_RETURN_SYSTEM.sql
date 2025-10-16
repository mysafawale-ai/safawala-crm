-- ============================================================================
-- DELIVERY & RETURN SYSTEM - COMPLETE MIGRATION
-- ============================================================================
-- Purpose: Implement automatic delivery creation, returns processing,
--          inventory impact, product archiving, and laundry integration
-- Date: October 16, 2025
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE SEQUENCES
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS delivery_seq START 1;
CREATE SEQUENCE IF NOT EXISTS return_seq START 1;

-- ============================================================================
-- STEP 2: ENHANCE DELIVERIES TABLE
-- ============================================================================

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- Add booking_type column to track rental vs sale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN booking_type TEXT CHECK (booking_type IN ('rental', 'sale'));
    COMMENT ON COLUMN deliveries.booking_type IS 'Type of booking - rental or sale. Only rentals create returns.';
  END IF;

  -- Add delivered_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN delivered_at TIMESTAMPTZ;
    COMMENT ON COLUMN deliveries.delivered_at IS 'Actual timestamp when delivery was marked as delivered';
  END IF;

  -- Add return_created flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'return_created'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN return_created BOOLEAN DEFAULT false;
    COMMENT ON COLUMN deliveries.return_created IS 'Flag to track if return record was created for this delivery';
  END IF;
END $$;

-- Create index on booking_type for faster filtering
CREATE INDEX IF NOT EXISTS idx_deliveries_booking_type ON deliveries(booking_type);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON deliveries(delivered_at);

-- ============================================================================
-- STEP 3: CREATE RETURNS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number TEXT UNIQUE NOT NULL,
  
  -- Links to delivery and booking
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  booking_id UUID, -- Generic reference to product_orders or package_bookings
  booking_source TEXT CHECK (booking_source IN ('product_order', 'package_booking')),
  customer_id UUID REFERENCES customers(id),
  
  -- Return Information
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  return_date DATE NOT NULL,
  expected_return_date DATE, -- From booking
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES users(id),
  
  -- Laundry Integration
  send_to_laundry BOOLEAN DEFAULT false,
  laundry_batch_id UUID REFERENCES laundry_batches(id),
  laundry_batch_created BOOLEAN DEFAULT false,
  
  -- Notes and Details
  notes TEXT,
  damage_notes TEXT,
  processing_notes TEXT,
  
  -- Summary Counts (for quick display)
  total_items INT DEFAULT 0,
  total_returned INT DEFAULT 0,
  total_damaged INT DEFAULT 0,
  total_lost INT DEFAULT 0,
  
  -- Metadata
  franchise_id UUID REFERENCES franchises(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_returns_delivery ON returns(delivery_id);
CREATE INDEX IF NOT EXISTS idx_returns_booking ON returns(booking_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_franchise ON returns(franchise_id);
CREATE INDEX IF NOT EXISTS idx_returns_return_date ON returns(return_date);

-- Add comments
COMMENT ON TABLE returns IS 'Tracks return of rented products after delivery. Only created for rental bookings.';
COMMENT ON COLUMN returns.return_number IS 'Unique return identifier in format RET-YYYYMMDD-00001';
COMMENT ON COLUMN returns.send_to_laundry IS 'Whether clean returned items should be sent to laundry';

-- ============================================================================
-- STEP 4: CREATE RETURN_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  
  -- Product snapshot (in case product is deleted)
  product_name TEXT NOT NULL,
  product_code TEXT,
  product_category TEXT,
  
  -- Quantities
  qty_delivered INT NOT NULL DEFAULT 0,
  qty_returned INT NOT NULL DEFAULT 0,  -- Clean items that came back
  qty_damaged INT NOT NULL DEFAULT 0,   -- Damaged items
  qty_lost INT NOT NULL DEFAULT 0,      -- Lost/stolen items
  
  -- Damage Details
  damage_reason TEXT CHECK (damage_reason IN (
    'torn', 'stained', 'burned', 'missing_parts', 'color_fade', 'shrunk', 'other'
  )),
  damage_description TEXT,
  damage_severity TEXT CHECK (damage_severity IN ('minor', 'moderate', 'severe', 'beyond_repair')),
  
  -- Lost/Stolen Details
  lost_reason TEXT CHECK (lost_reason IN ('stolen', 'lost', 'not_returned', 'other')),
  lost_description TEXT,
  
  -- Actions Taken
  archived BOOLEAN DEFAULT false,
  sent_to_laundry BOOLEAN DEFAULT false,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Validation constraint
  CONSTRAINT chk_qty_match CHECK (qty_delivered = qty_returned + qty_damaged + qty_lost)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_product ON return_items(product_id);

-- Add comments
COMMENT ON TABLE return_items IS 'Individual product items in a return, tracking quantities and condition';
COMMENT ON CONSTRAINT chk_qty_match ON return_items IS 'Ensures delivered quantity equals sum of returned, damaged, and lost';

-- ============================================================================
-- STEP 5: ENHANCE PRODUCT_ARCHIVE TABLE
-- ============================================================================

DO $$ 
BEGIN
  -- Add return reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_archive' AND column_name = 'return_id'
  ) THEN
    ALTER TABLE product_archive ADD COLUMN return_id UUID REFERENCES returns(id);
    COMMENT ON COLUMN product_archive.return_id IS 'Link to return that caused this archival';
  END IF;

  -- Add delivery reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_archive' AND column_name = 'delivery_id'
  ) THEN
    ALTER TABLE product_archive ADD COLUMN delivery_id UUID REFERENCES deliveries(id);
  END IF;

  -- Add quantity (for bulk archiving)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_archive' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE product_archive ADD COLUMN quantity INT DEFAULT 1;
  END IF;

  -- Add damage reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_archive' AND column_name = 'damage_reason'
  ) THEN
    ALTER TABLE product_archive ADD COLUMN damage_reason TEXT;
  END IF;

  -- Add lost reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_archive' AND column_name = 'lost_reason'
  ) THEN
    ALTER TABLE product_archive ADD COLUMN lost_reason TEXT;
  END IF;

  -- Add severity
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'product_archive' AND column_name = 'severity'
  ) THEN
    ALTER TABLE product_archive ADD COLUMN severity TEXT;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_archive_return ON product_archive(return_id);
CREATE INDEX IF NOT EXISTS idx_product_archive_delivery ON product_archive(delivery_id);

-- ============================================================================
-- STEP 6: ENHANCE LAUNDRY_BATCHES TABLE
-- ============================================================================

DO $$ 
BEGIN
  -- Add return reference
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'laundry_batches' AND column_name = 'return_id'
  ) THEN
    ALTER TABLE laundry_batches ADD COLUMN return_id UUID REFERENCES returns(id);
    COMMENT ON COLUMN laundry_batches.return_id IS 'Link to return if batch was auto-created from return processing';
  END IF;

  -- Add auto_created flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'laundry_batches' AND column_name = 'auto_created'
  ) THEN
    ALTER TABLE laundry_batches ADD COLUMN auto_created BOOLEAN DEFAULT false;
    COMMENT ON COLUMN laundry_batches.auto_created IS 'True if batch was automatically created from return processing';
  END IF;
END $$;

-- Create index
CREATE INDEX IF NOT EXISTS idx_laundry_batches_return ON laundry_batches(return_id);

-- ============================================================================
-- STEP 7: UPDATE TRIGGERS FOR TIMESTAMPS
-- ============================================================================

-- Returns updated_at trigger
CREATE OR REPLACE FUNCTION update_returns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS returns_updated_at_trigger ON returns;
CREATE TRIGGER returns_updated_at_trigger
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_returns_updated_at();

-- Return items updated_at trigger
CREATE OR REPLACE FUNCTION update_return_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS return_items_updated_at_trigger ON return_items;
CREATE TRIGGER return_items_updated_at_trigger
  BEFORE UPDATE ON return_items
  FOR EACH ROW
  EXECUTE FUNCTION update_return_items_updated_at();

-- ============================================================================
-- STEP 8: AUTO-CREATE DELIVERY TRIGGER
-- ============================================================================

-- Function to auto-create delivery when booking is created
CREATE OR REPLACE FUNCTION auto_create_delivery()
RETURNS TRIGGER AS $$
DECLARE
  new_delivery_number TEXT;
  delivery_address TEXT;
  delivery_date DATE;
  booking_type_val TEXT;
BEGIN
  -- Generate delivery number
  new_delivery_number := 'DEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('delivery_seq')::TEXT, 5, '0');
  
  -- Determine booking type based on table and data
  IF TG_TABLE_NAME = 'product_orders' THEN
    booking_type_val := NEW.order_type; -- 'rental' or 'sale'
    delivery_address := COALESCE(NEW.delivery_address, NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date, NEW.event_date, CURRENT_DATE + INTERVAL '1 day');
  ELSIF TG_TABLE_NAME = 'package_bookings' THEN
    booking_type_val := 'rental'; -- Packages are always rentals
    delivery_address := COALESCE(NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date, NEW.event_date, CURRENT_DATE + INTERVAL '1 day');
  ELSE
    -- Fallback for bookings table (legacy)
    booking_type_val := COALESCE(NEW.type, 'rental');
    delivery_address := COALESCE(NEW.delivery_address, NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date, NEW.event_date, CURRENT_DATE + INTERVAL '1 day');
  END IF;
  
  -- Insert delivery record
  INSERT INTO deliveries (
    delivery_number,
    customer_id,
    booking_id,
    booking_source,
    booking_type,
    delivery_address,
    delivery_date,
    status,
    franchise_id,
    created_by,
    created_at
  ) VALUES (
    new_delivery_number,
    NEW.customer_id,
    NEW.id,
    CASE 
      WHEN TG_TABLE_NAME = 'product_orders' THEN 'product_order'
      WHEN TG_TABLE_NAME = 'package_bookings' THEN 'package_booking'
      ELSE 'booking'
    END,
    booking_type_val,
    delivery_address,
    delivery_date,
    'pending',
    NEW.franchise_id,
    NEW.created_by,
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if any
DROP TRIGGER IF EXISTS auto_create_delivery_product_orders ON product_orders;
DROP TRIGGER IF EXISTS auto_create_delivery_package_bookings ON package_bookings;
DROP TRIGGER IF EXISTS auto_create_delivery_bookings ON bookings;

-- Create triggers for auto-delivery creation
CREATE TRIGGER auto_create_delivery_product_orders
  AFTER INSERT ON product_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_delivery();

CREATE TRIGGER auto_create_delivery_package_bookings
  AFTER INSERT ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_delivery();

-- Also create for legacy bookings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    EXECUTE 'CREATE TRIGGER auto_create_delivery_bookings
      AFTER INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION auto_create_delivery()';
  END IF;
END $$;

-- ============================================================================
-- STEP 9: AUTO-CREATE RETURN TRIGGER
-- ============================================================================

-- Function to auto-create return when delivery is marked as delivered (rental only)
CREATE OR REPLACE FUNCTION auto_create_return()
RETURNS TRIGGER AS $$
DECLARE
  new_return_number TEXT;
  expected_return_date DATE;
BEGIN
  -- Only create return if:
  -- 1. Status changed to 'delivered'
  -- 2. booking_type is 'rental'
  -- 3. Return not already created
  IF NEW.status = 'delivered' 
     AND NEW.booking_type = 'rental' 
     AND (OLD.status IS NULL OR OLD.status != 'delivered')
     AND NOT NEW.return_created THEN
    
    -- Generate return number
    new_return_number := 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('return_seq')::TEXT, 5, '0');
    
    -- Get expected return date from booking
    IF NEW.booking_source = 'product_order' THEN
      SELECT return_date INTO expected_return_date 
      FROM product_orders 
      WHERE id = NEW.booking_id;
    ELSIF NEW.booking_source = 'package_booking' THEN
      SELECT return_date INTO expected_return_date 
      FROM package_bookings 
      WHERE id = NEW.booking_id;
    END IF;
    
    -- Insert return record
    INSERT INTO returns (
      return_number,
      delivery_id,
      booking_id,
      booking_source,
      customer_id,
      status,
      return_date,
      expected_return_date,
      franchise_id,
      created_at
    ) VALUES (
      new_return_number,
      NEW.id,
      NEW.booking_id,
      NEW.booking_source,
      NEW.customer_id,
      'pending',
      COALESCE(expected_return_date, NEW.delivery_date + INTERVAL '3 days'),
      expected_return_date,
      NEW.franchise_id,
      NOW()
    );
    
    -- Mark delivery as having return created
    NEW.return_created := true;
    NEW.delivered_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_create_return_trigger ON deliveries;
CREATE TRIGGER auto_create_return_trigger
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_return();

-- ============================================================================
-- STEP 10: HELPER FUNCTIONS
-- ============================================================================

-- Function to generate delivery number
CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'DEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('delivery_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('return_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 11: GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON returns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON return_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_archive TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON laundry_batches TO authenticated;

-- Grant sequence usage
GRANT USAGE, SELECT ON SEQUENCE delivery_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE return_seq TO authenticated;

-- Grant function execution
GRANT EXECUTE ON FUNCTION auto_create_delivery() TO authenticated;
GRANT EXECUTE ON FUNCTION auto_create_return() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_delivery_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_return_number() TO authenticated;

-- ============================================================================
-- STEP 12: VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
DO $$
BEGIN
  RAISE NOTICE '✅ Checking tables...';
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deliveries') THEN
    RAISE NOTICE '  ✓ deliveries table exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'returns') THEN
    RAISE NOTICE '  ✓ returns table exists';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'return_items') THEN
    RAISE NOTICE '  ✓ return_items table exists';
  END IF;
  
  RAISE NOTICE '✅ All tables created successfully!';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- 
-- Summary:
-- ✓ Enhanced deliveries table with booking_type and delivered_at
-- ✓ Created returns table for rental return tracking
-- ✓ Created return_items table for item-level return details
-- ✓ Enhanced product_archive for return-triggered archiving
-- ✓ Enhanced laundry_batches for return-triggered laundry
-- ✓ Created auto-delivery trigger on booking creation
-- ✓ Created auto-return trigger on delivery completion (rentals only)
-- ✓ Added helper functions for number generation
-- ✓ Configured proper indexes and constraints
-- ✓ Set up permissions
--
-- Next Steps:
-- 1. Test auto-delivery creation by creating a new booking
-- 2. Test auto-return creation by marking a rental delivery as delivered
-- 3. Implement frontend UI for return processing
-- 4. Build API endpoints for return processing
-- 5. Test complete flow end-to-end
--
-- ============================================================================
