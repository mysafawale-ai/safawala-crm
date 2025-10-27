-- ================================================
-- ADD SAMPLE DELIVERIES DATA
-- ================================================
-- Creates demo delivery records for testing the Deliveries & Returns page
-- Links to existing customers and bookings from your database

-- First, let's get some real customer and booking IDs to link
-- Insert 5 sample deliveries with realistic Indian data

DO $$
DECLARE
  v_customer_id UUID;
  v_booking_id UUID;
  v_franchise_id UUID;
  v_staff_id UUID;
BEGIN
  -- Get first available customer, booking, franchise and staff for linking
  SELECT id INTO v_customer_id FROM customers LIMIT 1;
  SELECT id INTO v_booking_id FROM bookings LIMIT 1;
  SELECT id INTO v_franchise_id FROM franchises LIMIT 1;
  SELECT id INTO v_staff_id FROM staff LIMIT 1;

  -- Sample Delivery 1: Pending Delivery
  INSERT INTO deliveries (
    customer_id,
    booking_id,
    status,
    pickup_address,
    delivery_address,
    delivery_date,
    delivery_time,
    delivery_charge,
    fuel_cost,
    total_amount,
    special_instructions,
    driver_name,
    vehicle_number,
    assigned_staff_id,
    franchise_id,
    booking_source
  ) VALUES (
    v_customer_id,
    v_booking_id,
    'pending',
    'Safawala Warehouse, Plot 123, Industrial Area, Andheri East, Mumbai - 400069',
    'Flat 501, Sai Residency, Linking Road, Bandra West, Mumbai - 400050',
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    500.00,
    150.00,
    650.00,
    'Handle with care - contains glassware. Customer will be home after 10 AM.',
    'Rajesh Kumar',
    'MH-02-AB-1234',
    v_staff_id,
    v_franchise_id,
    'package_booking'
  );

  -- Sample Delivery 2: In Transit
  INSERT INTO deliveries (
    customer_id,
    booking_id,
    status,
    pickup_address,
    delivery_address,
    delivery_date,
    delivery_time,
    delivery_charge,
    fuel_cost,
    total_amount,
    special_instructions,
    driver_name,
    vehicle_number,
    assigned_staff_id,
    franchise_id,
    booking_source
  ) VALUES (
    v_customer_id,
    v_booking_id,
    'in_transit',
    'Safawala Warehouse, Plot 123, Industrial Area, Andheri East, Mumbai - 400069',
    'Villa 12, Palm Grove Society, Powai, Mumbai - 400076',
    CURRENT_DATE,
    '14:00:00',
    800.00,
    200.00,
    1000.00,
    'Wedding setup - priority delivery. Contact customer 30 mins before arrival.',
    'Suresh Patil',
    'MH-02-CD-5678',
    v_staff_id,
    v_franchise_id,
    'package_booking'
  );

  -- Sample Delivery 3: Delivered
  INSERT INTO deliveries (
    customer_id,
    booking_id,
    status,
    pickup_address,
    delivery_address,
    delivery_date,
    delivery_time,
    delivery_charge,
    fuel_cost,
    total_amount,
    special_instructions,
    driver_name,
    vehicle_number,
    assigned_staff_id,
    franchise_id,
    booking_source,
    proof_of_delivery
  ) VALUES (
    v_customer_id,
    v_booking_id,
    'delivered',
    'Safawala Warehouse, Plot 123, Industrial Area, Andheri East, Mumbai - 400069',
    'A-304, Mahavir Tower, Goregaon West, Mumbai - 400062',
    CURRENT_DATE - INTERVAL '1 day',
    '11:30:00',
    450.00,
    120.00,
    570.00,
    'Birthday party setup for evening event.',
    'Amit Sharma',
    'MH-02-EF-9012',
    v_staff_id,
    v_franchise_id,
    'package_booking',
    jsonb_build_object(
      'delivered_at', NOW() - INTERVAL '1 day',
      'signature', 'Received by Mr. Patel',
      'photo_url', '/uploads/delivery-proof-001.jpg'
    )
  );

  -- Sample Delivery 4: Pending Return
  INSERT INTO deliveries (
    customer_id,
    booking_id,
    status,
    pickup_address,
    delivery_address,
    delivery_date,
    delivery_time,
    delivery_charge,
    fuel_cost,
    total_amount,
    special_instructions,
    driver_name,
    vehicle_number,
    assigned_staff_id,
    franchise_id,
    booking_source,
    rescheduled_return_at
  ) VALUES (
    v_customer_id,
    v_booking_id,
    'pending_return',
    'B-201, Sunrise Apartments, Versova, Andheri West, Mumbai - 400061',
    'Safawala Warehouse, Plot 123, Industrial Area, Andheri East, Mumbai - 400069',
    CURRENT_DATE + INTERVAL '3 days',
    '15:00:00',
    500.00,
    150.00,
    650.00,
    'Return pickup - event finished. Customer requested afternoon slot.',
    'Vijay Deshmukh',
    'MH-02-GH-3456',
    v_staff_id,
    v_franchise_id,
    'package_booking',
    CURRENT_DATE + INTERVAL '3 days'
  );

  -- Sample Delivery 5: Completed (Returned)
  INSERT INTO deliveries (
    customer_id,
    booking_id,
    status,
    pickup_address,
    delivery_address,
    delivery_date,
    delivery_time,
    delivery_charge,
    fuel_cost,
    total_amount,
    special_instructions,
    driver_name,
    vehicle_number,
    assigned_staff_id,
    franchise_id,
    booking_source,
    proof_of_delivery,
    return_picked_at
  ) VALUES (
    v_customer_id,
    v_booking_id,
    'returned',
    'C-102, Green View, Malad West, Mumbai - 400064',
    'Safawala Warehouse, Plot 123, Industrial Area, Andheri East, Mumbai - 400069',
    CURRENT_DATE - INTERVAL '5 days',
    '16:30:00',
    450.00,
    120.00,
    570.00,
    'Corporate event - all items in good condition.',
    'Santosh Yadav',
    'MH-02-IJ-7890',
    v_staff_id,
    v_franchise_id,
    'package_booking',
    jsonb_build_object(
      'returned_at', NOW() - INTERVAL '1 day',
      'condition', 'All items returned in good condition',
      'checked_by', 'Warehouse Manager'
    ),
    NOW() - INTERVAL '1 day'
  );

  RAISE NOTICE '✅ Successfully added 5 sample deliveries';
  RAISE NOTICE '📦 Statuses: 1 pending, 1 in_transit, 1 delivered, 1 pending_return, 1 returned';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Error adding sample data: %', SQLERRM;
    RAISE NOTICE '💡 Make sure you have at least one customer, booking, franchise, and staff member in your database';
END $$;

-- Verify the data was inserted
SELECT 
  delivery_number,
  status,
  delivery_date,
  driver_name,
  delivery_charge,
  total_amount
FROM deliveries
ORDER BY created_at DESC
LIMIT 5;
