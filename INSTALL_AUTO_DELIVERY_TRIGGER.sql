-- ============================================================================
-- INSTALL AUTO-DELIVERY TRIGGER SYSTEM
-- ============================================================================
-- Run this to enable automatic delivery creation when bookings are added
-- ============================================================================

-- STEP 1: Create delivery sequence if not exists
CREATE SEQUENCE IF NOT EXISTS delivery_seq START 1;

-- STEP 2: Create the auto-delivery function (FIXED VERSION)
CREATE OR REPLACE FUNCTION auto_create_delivery()
RETURNS TRIGGER 
SECURITY DEFINER  -- Bypasses RLS - runs with function owner's permissions
SET search_path = public
AS $$
DECLARE
  new_delivery_number TEXT;
  delivery_address TEXT;
  delivery_date DATE;
  booking_type_val TEXT;
BEGIN
  -- Generate delivery number
  new_delivery_number := 'DEL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('delivery_seq')::TEXT, 5, '0');
  
  -- Determine booking type and address based on table
  IF TG_TABLE_NAME = 'product_orders' THEN
    booking_type_val := NEW.booking_type;
    delivery_address := COALESCE(NEW.delivery_address, NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date::date, NEW.event_date::date, CURRENT_DATE + INTERVAL '1 day');
    
  ELSIF TG_TABLE_NAME = 'package_bookings' THEN
    booking_type_val := 'rental'; -- Packages are always rentals
    delivery_address := COALESCE(NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date::date, NEW.event_date::date, CURRENT_DATE + INTERVAL '1 day');
    
  ELSE
    -- Fallback for bookings table (legacy)
    booking_type_val := COALESCE(NEW.type, 'rental');
    delivery_address := COALESCE(NEW.delivery_address, NEW.venue_address, 'To be confirmed');
    delivery_date := COALESCE(NEW.delivery_date::date, NEW.event_date::date, CURRENT_DATE + INTERVAL '1 day');
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
    COALESCE(NEW.created_by, NEW.customer_id),
    NOW()
  );
  
  RAISE NOTICE '✅ Auto-created delivery % for booking %', new_delivery_number, NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the booking creation
    RAISE WARNING '⚠️ Failed to auto-create delivery: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Drop existing triggers if any
DROP TRIGGER IF EXISTS auto_create_delivery_product_orders ON product_orders;
DROP TRIGGER IF EXISTS auto_create_delivery_package_bookings ON package_bookings;
DROP TRIGGER IF EXISTS auto_create_delivery_bookings ON bookings;

-- STEP 4: Create triggers on all booking tables
CREATE TRIGGER auto_create_delivery_product_orders
  AFTER INSERT ON product_orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_delivery();

CREATE TRIGGER auto_create_delivery_package_bookings
  AFTER INSERT ON package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_delivery();

-- Also for legacy bookings table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
    EXECUTE 'CREATE TRIGGER auto_create_delivery_bookings
      AFTER INSERT ON bookings
      FOR EACH ROW
      EXECUTE FUNCTION auto_create_delivery()';
    RAISE NOTICE '✅ Created trigger on bookings table';
  END IF;
END $$;

-- STEP 5: Verify installation
SELECT 
  '✅ Function created' as status,
  proname as function_name,
  prosecdef as has_security_definer
FROM pg_proc 
WHERE proname = 'auto_create_delivery';

SELECT 
  '✅ Triggers created' as status,
  trigger_name,
  event_object_table as on_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%auto_create_delivery%'
ORDER BY event_object_table;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ AUTO-DELIVERY SYSTEM INSTALLED!';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Now when you create a booking:';
  RAISE NOTICE '1. A delivery record will auto-create';
  RAISE NOTICE '2. Status will be "pending"';
  RAISE NOTICE '3. Delivery number: DEL-YYYYMMDD-00001';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Test by creating a new booking!';
  RAISE NOTICE '====================================';
END $$;
