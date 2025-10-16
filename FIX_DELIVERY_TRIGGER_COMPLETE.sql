-- FIX DELIVERY TRIGGER - Handle Missing delivery_address Column
-- The trigger tries to access NEW.delivery_address but should fallback to venue_address

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
  
  -- Determine booking type and address based on table
  IF TG_TABLE_NAME = 'product_orders' THEN
    -- FIXED: Use booking_type instead of order_type
    booking_type_val := NEW.booking_type;
    
    -- FIXED: Check if delivery_address column exists, fallback to venue_address
    -- Use COALESCE to handle NULLs gracefully
    BEGIN
      delivery_address := COALESCE(
        NEW.delivery_address,  -- Try delivery_address first (if column exists)
        NEW.venue_address,      -- Then venue_address
        'To be confirmed'       -- Final fallback
      );
    EXCEPTION WHEN undefined_column THEN
      -- If delivery_address column doesn't exist yet, just use venue_address
      delivery_address := COALESCE(NEW.venue_address, 'To be confirmed');
    END;
    
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

-- Verify function was updated
SELECT 'Delivery trigger function updated successfully' as status;
