-- Check if auto-delivery triggers exist and are active

-- 1. Check if the function exists
SELECT 
  proname as function_name,
  prosecdef as is_security_definer,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'auto_create_delivery';

-- 2. Check if triggers exist on tables
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%auto_create_delivery%'
ORDER BY event_object_table;

-- 3. Check if delivery sequence exists
SELECT 
  sequence_name,
  start_value,
  increment
FROM information_schema.sequences
WHERE sequence_name = 'delivery_seq';

-- 4. Test: Get recent bookings and check if they have deliveries
SELECT 
  'package_bookings' as source,
  pb.id,
  pb.package_number,
  pb.created_at,
  pb.delivery_date,
  EXISTS(
    SELECT 1 FROM deliveries d 
    WHERE d.booking_id = pb.id 
    AND d.booking_source = 'package_booking'
  ) as has_delivery
FROM package_bookings pb
ORDER BY pb.created_at DESC
LIMIT 5;

-- 5. Also check product_orders
SELECT 
  'product_orders' as source,
  po.id,
  po.order_number,
  po.created_at,
  po.delivery_date,
  EXISTS(
    SELECT 1 FROM deliveries d 
    WHERE d.booking_id = po.id 
    AND d.booking_source = 'product_order'
  ) as has_delivery
FROM product_orders po
ORDER BY po.created_at DESC
LIMIT 5;
