-- Check what tables exist in the database
-- Run this in Supabase SQL Editor first to see what we have

SELECT 
  table_name,
  table_type
FROM 
  information_schema.tables
WHERE 
  table_schema = 'public'
ORDER BY 
  table_name;

-- Check if specific tables exist
SELECT 
  'customers' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') as exists
UNION ALL
SELECT 
  'product_orders',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_orders')
UNION ALL
SELECT 
  'package_bookings',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'package_bookings')
UNION ALL
SELECT 
  'staff',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff')
UNION ALL
SELECT 
  'franchises',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'franchises')
UNION ALL
SELECT 
  'users',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
UNION ALL
SELECT 
  'deliveries',
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'deliveries');
