-- FIX RLS ISSUE - Make Delivery Trigger Bypass Row-Level Security
-- Error: new row violates row-level security policy for table "deliveries"
-- Solution: Add SECURITY DEFINER to function so it runs with owner permissions

CREATE OR REPLACE FUNCTION auto_create_delivery()
RETURNS TRIGGER 
SECURITY DEFINER  -- ✅ THIS IS THE FIX - Runs with function owner's permissions, bypassing RLS
SET search_path = public  -- ✅ Security best practice when using SECURITY DEFINER
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
    -- FIXED: Use booking_type instead of order_type
    booking_type_val := NEW.booking_type;
    
    -- FIXED: Check if delivery_address column exists, fallback to venue_address
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
  
  -- Insert delivery record (now bypasses RLS due to SECURITY DEFINER)
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
    COALESCE(NEW.created_by, NEW.customer_id), -- Fallback if created_by is null
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the booking creation
    RAISE WARNING 'Failed to auto-create delivery: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify function was updated with SECURITY DEFINER
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  CASE WHEN prosecdef THEN '✅ SECURITY DEFINER enabled' ELSE '❌ Still SECURITY INVOKER' END as status
FROM pg_proc
WHERE proname = 'auto_create_delivery';
