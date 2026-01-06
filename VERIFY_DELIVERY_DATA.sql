-- VERIFY DELIVERY CONFIRMATION DATA IS SAVING
-- Run this in Supabase SQL Editor to check

-- 1. Check if columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'deliveries'
AND column_name IN (
  'delivery_confirmation_name',
  'delivery_confirmation_phone',
  'delivery_photo_url',
  'delivery_items_count',
  'delivery_items_confirmed',
  'delivery_notes',
  'delivered_at'
)
ORDER BY ordinal_position;

-- 2. Check deliveries with confirmation data (non-null)
SELECT 
  id,
  delivery_number,
  customer_name,
  status,
  delivery_confirmation_name,
  delivery_confirmation_phone,
  delivery_items_count,
  delivery_items_confirmed,
  delivery_notes,
  delivered_at,
  CASE WHEN delivery_confirmation_name IS NOT NULL THEN '✅ HAS DATA' ELSE '❌ EMPTY' END as data_status
FROM deliveries
WHERE status = 'delivered'
ORDER BY delivered_at DESC
LIMIT 10;

-- 3. Count deliveries with confirmation data
SELECT 
  COUNT(*) as total_delivered,
  COUNT(CASE WHEN delivery_confirmation_name IS NOT NULL THEN 1 END) as with_confirmation,
  COUNT(CASE WHEN delivery_confirmation_name IS NULL THEN 1 END) as without_confirmation
FROM deliveries
WHERE status = 'delivered';
