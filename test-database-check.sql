-- Quick database check queries
-- Run these in Supabase SQL Editor to verify test data

-- 1. Check if all required columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'package_bookings'
AND column_name IN (
  'custom_amount', 'distance_km', 'distance_amount', 
  'security_deposit', 'groom_whatsapp', 'bride_whatsapp'
)
ORDER BY column_name;

-- 2. Check package_booking_items columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'package_booking_items'
AND column_name IN ('security_deposit', 'distance_addon', 'reserved_products')
ORDER BY column_name;

-- 3. Check if storage bucket exists
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'product-images';

-- 4. Check storage policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
AND policyname LIKE '%product%'
ORDER BY policyname;

-- 5. Check recent package bookings (if any)
SELECT 
  id, 
  package_number, 
  is_quote, 
  customer_id,
  event_date,
  total_amount,
  distance_km,
  created_at
FROM package_bookings
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check recent products (including custom ones)
SELECT 
  id,
  name,
  category_id,
  image_url,
  stock_available,
  created_at
FROM products
ORDER BY created_at DESC
LIMIT 10;
