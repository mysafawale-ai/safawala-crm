-- Check invoices for franchise: 1a518dde-85b7-44ef-8bc4-092f53ddfd99
-- Run this in Supabase SQL Editor

-- 1. Check if invoices table has franchise_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invoices' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what enum values exist for invoice_status
SELECT 
  enumlabel as status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'invoice_status'
ORDER BY e.enumsortorder;

-- 3. Count total invoices in system
SELECT COUNT(*) as total_invoices
FROM invoices;

-- 4. Check what enum values exist for invoice_status
SELECT 
  enumlabel as status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'invoice_status'
ORDER BY e.enumsortorder;

-- 5. Count invoices by franchise (if franchise_id column exists)
SELECT 
  franchise_id,
  COUNT(*) as invoice_count,
  SUM(total_amount) as total_revenue,
  COUNT(*) FILTER (WHERE status::text = 'paid') as paid_count,
  COUNT(*) FILTER (WHERE status::text = 'draft') as draft_count,
  COUNT(*) FILTER (WHERE status::text = 'sent') as sent_count,
  COUNT(*) FILTER (WHERE status::text = 'overdue') as overdue_count,
  COUNT(*) FILTER (WHERE status::text = 'cancelled') as cancelled_count
FROM invoices
GROUP BY franchise_id
ORDER BY invoice_count DESC;

-- 6. Check invoices for your specific franchise
SELECT 
  id,
  invoice_number,
  booking_id,
  customer_id,
  total_amount,
  paid_amount,
  balance_amount,
  status,
  due_date,
  created_at
FROM invoices
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY created_at DESC;

-- 7. Check if invoices are linked to bookings correctly
SELECT 
  i.invoice_number,
  i.total_amount,
  i.status,
  po.order_number as product_order_number,
  pb.package_number as package_booking_number,
  i.created_at
FROM invoices i
LEFT JOIN product_orders po ON i.booking_id = po.id AND po.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
LEFT JOIN package_bookings pb ON i.booking_id = pb.id AND pb.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
WHERE i.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY i.created_at DESC;

-- 8. Check for orphan invoices (invoices without valid booking_id)
SELECT 
  i.*
FROM invoices i
WHERE i.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
AND i.booking_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM product_orders po WHERE po.id = i.booking_id
)
AND NOT EXISTS (
  SELECT 1 FROM package_bookings pb WHERE pb.id = i.booking_id
);
