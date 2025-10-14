-- =====================================================
-- VERIFY DATABASE SCHEMA FOR AUTO-INVOICE GENERATION
-- Run this to check actual column names before installing trigger
-- =====================================================

-- Check product_orders table structure
SELECT 
  'product_orders' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product_orders'
ORDER BY ordinal_position;

-- Check package_bookings table structure  
SELECT 
  'package_bookings' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'package_bookings'
ORDER BY ordinal_position;

-- Check product_order_items table structure
SELECT 
  'product_order_items' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'product_order_items'
ORDER BY ordinal_position;

-- Check package_booking_items table structure
SELECT 
  'package_booking_items' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'package_booking_items'
ORDER BY ordinal_position;

-- Check invoices table structure
SELECT 
  'invoices' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
ORDER BY ordinal_position;

-- Check invoice_items table structure
SELECT 
  'invoice_items' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoice_items'
ORDER BY ordinal_position;
