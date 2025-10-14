-- =====================================================
-- QA TEST SUITE FOR AUTO-INVOICE GENERATION
-- Run these tests after installing the trigger
-- =====================================================

-- TEST 1: Verify trigger is installed
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%auto_generate_invoice%';

-- Expected: 2 triggers (one for product_orders, one for package_bookings)

-- TEST 2: Check invoice number sequence
SELECT 
  invoice_number,
  franchise_id,
  created_at
FROM invoices
WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: Sequential numbers within each franchise

-- TEST 3: Verify invoice-booking linkage
SELECT 
  i.invoice_number,
  i.booking_id,
  i.status,
  i.total_amount,
  i.paid_amount,
  i.balance_amount,
  CASE 
    WHEN EXISTS (SELECT 1 FROM product_orders WHERE id = i.booking_id) THEN 'product_order'
    WHEN EXISTS (SELECT 1 FROM package_bookings WHERE id = i.booking_id) THEN 'package_booking'
    ELSE 'unknown'
  END as booking_type
FROM invoices i
WHERE i.created_at > NOW() - INTERVAL '1 day'
ORDER BY i.created_at DESC;

-- Expected: All recent invoices should have valid booking_id

-- TEST 4: Check invoice items count
SELECT 
  i.invoice_number,
  COUNT(ii.id) as item_count,
  SUM(ii.line_total) as items_total,
  i.total_amount as invoice_total
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.created_at > NOW() - INTERVAL '1 day'
GROUP BY i.id, i.invoice_number, i.total_amount
ORDER BY i.created_at DESC;

-- Expected: item_count > 0, items_total should be close to invoice_total

-- TEST 5: Verify franchise isolation
SELECT 
  franchise_id,
  COUNT(*) as invoice_count,
  STRING_AGG(DISTINCT SUBSTRING(invoice_number FROM 1 FOR 9), ', ') as number_prefixes
FROM invoices
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY franchise_id;

-- Expected: Each franchise should have independent invoice numbers

-- TEST 6: Check status logic
SELECT 
  invoice_number,
  total_amount,
  paid_amount,
  balance_amount,
  status,
  CASE 
    WHEN paid_amount >= total_amount THEN 'Should be PAID'
    WHEN paid_amount > 0 THEN 'Should be SENT'
    ELSE 'Should be DRAFT'
  END as expected_status,
  CASE 
    WHEN status::TEXT = CASE 
      WHEN paid_amount >= total_amount THEN 'paid'
      WHEN paid_amount > 0 THEN 'sent'
      ELSE 'draft'
    END THEN '✅ CORRECT'
    ELSE '❌ WRONG'
  END as status_check
FROM invoices
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Expected: All status_check should be ✅ CORRECT

-- TEST 7: Performance check - find duplicate invoice numbers
SELECT 
  invoice_number,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::TEXT, ', ') as invoice_ids
FROM invoices
GROUP BY invoice_number
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicates!)

-- TEST 8: Check orphaned invoices (invoice without booking)
SELECT 
  i.invoice_number,
  i.booking_id,
  i.created_at
FROM invoices i
WHERE i.booking_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_orders WHERE id = i.booking_id
    UNION ALL
    SELECT 1 FROM package_bookings WHERE id = i.booking_id
  )
  AND i.created_at > NOW() - INTERVAL '7 days';

-- Expected: 0 rows (all invoices should have valid bookings)

-- TEST 9: Check invoice items without products
SELECT 
  i.invoice_number,
  ii.description,
  ii.product_id,
  ii.quantity,
  ii.unit_price
FROM invoices i
JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE ii.product_id IS NULL
  AND i.created_at > NOW() - INTERVAL '1 day';

-- Expected: Few or 0 rows (most should have product_id)

-- TEST 10: Summary statistics
SELECT 
  COUNT(DISTINCT i.id) as total_invoices,
  COUNT(DISTINCT CASE WHEN i.created_at > NOW() - INTERVAL '1 day' THEN i.id END) as last_24h,
  COUNT(DISTINCT CASE WHEN i.status = 'draft' THEN i.id END) as draft_count,
  COUNT(DISTINCT CASE WHEN i.status = 'sent' THEN i.id END) as sent_count,
  COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as paid_count,
  ROUND(AVG(i.total_amount), 2) as avg_invoice_amount,
  SUM(i.balance_amount) as total_outstanding
FROM invoices i
WHERE i.created_at > NOW() - INTERVAL '30 days';

-- =====================================================
-- MANUAL TEST SCENARIOS
-- =====================================================

/*
SCENARIO 1: Create a product order and verify invoice
1. Create a product order with 2-3 items
2. Check if invoice was created automatically
3. Verify invoice number format (INV-2025-XXXX)
4. Verify all items are in invoice_items
5. Check status matches payment

SCENARIO 2: Create a package booking
1. Create a package booking
2. Check if invoice was created
3. Verify package items are in invoice

SCENARIO 3: Create quote (should NOT create invoice)
1. Create a product order with is_quote = true
2. Verify NO invoice was created

SCENARIO 4: Concurrent bookings
1. Create 2 bookings simultaneously
2. Check both got unique invoice numbers
3. No duplicates

SCENARIO 5: Partial payment
1. Create booking with 50% payment
2. Verify invoice status = 'sent'
3. Verify balance_amount is correct

SCENARIO 6: Full payment
1. Create booking with 100% payment
2. Verify invoice status = 'paid'
3. Verify balance_amount = 0

SCENARIO 7: Zero payment
1. Create booking with no payment
2. Verify invoice status = 'draft'
3. Verify balance_amount = total_amount
*/

-- =====================================================
-- CLEANUP (if needed for testing)
-- =====================================================

-- WARNING: This deletes test data! Only use in dev/test environment
-- DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE invoice_number LIKE 'INV-2025-TEST%');
-- DELETE FROM invoices WHERE invoice_number LIKE 'INV-2025-TEST%';
