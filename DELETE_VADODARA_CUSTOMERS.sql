-- ================================================================
-- DELETE ALL CUSTOMERS FROM VADODARA FRANCHISE
-- ================================================================
-- This script safely deletes all customers from the Vadodara franchise
-- and ALL their related data (orders, bookings, quotes, deliveries, returns)
-- ================================================================
-- Franchise: Vadodara Branch
-- Franchise ID: 1a518dde-85b7-44ef-8bc4-092f53ddfd99
-- ================================================================

-- ================================================================
-- STEP 1: COUNT ALL CUSTOMERS AND RELATED DATA
-- ================================================================
WITH franchise_data AS (
  SELECT id FROM franchises 
  WHERE id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
),

customer_ids AS (
  SELECT id FROM customers 
  WHERE franchise_id = (SELECT id FROM franchise_data)
)

SELECT 
  (SELECT COUNT(*) FROM customer_ids) as customer_count,
  (SELECT COUNT(*) FROM orders WHERE customer_id IN (SELECT id FROM customer_ids)) as order_count,
  (SELECT COUNT(*) FROM bookings WHERE customer_id IN (SELECT id FROM customer_ids)) as booking_count,
  (SELECT COUNT(*) FROM package_bookings WHERE customer_id IN (SELECT id FROM customer_ids)) as package_booking_count,
  (SELECT COUNT(*) FROM product_orders WHERE customer_id IN (SELECT id FROM customer_ids)) as product_order_count,
  (SELECT COUNT(*) FROM quotes WHERE customer_id IN (SELECT id FROM customer_ids)) as quote_count,
  (SELECT COUNT(*) FROM deliveries WHERE customer_id IN (SELECT id FROM customer_ids)) as delivery_count,
  (SELECT COUNT(*) FROM returns WHERE customer_id IN (SELECT id FROM customer_ids)) as return_count;

-- ================================================================
-- STEP 2: LIST ALL CUSTOMERS TO BE DELETED
-- ================================================================
SELECT 
  id,
  phone_number,
  name,
  email,
  city,
  created_at,
  is_active
FROM customers 
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY created_at DESC;

-- ================================================================
-- STEP 3: BACKUP - OPTIONAL (Create backup before deletion)
-- ================================================================
-- Uncomment below to create backups of customer data
/*
CREATE TABLE customers_backup_vadodara AS 
SELECT * FROM customers 
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

CREATE TABLE orders_backup_vadodara AS 
SELECT o.* FROM orders o
INNER JOIN customers c ON o.customer_id = c.id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

CREATE TABLE bookings_backup_vadodara AS 
SELECT b.* FROM bookings b
INNER JOIN customers c ON b.customer_id = c.id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';
*/

-- ================================================================
-- ⚠️  STEP 4: DELETE SCRIPT - RUN THESE IN ORDER
-- ================================================================

BEGIN;  -- Start transaction (ROLLBACK if something goes wrong)

-- Get customer IDs
WITH customer_ids AS (
  SELECT id FROM customers 
  WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
),

-- Get all order IDs
order_ids AS (
  SELECT id FROM orders 
  WHERE customer_id IN (SELECT id FROM customer_ids)
),

-- Get all booking IDs
booking_ids AS (
  SELECT id FROM bookings 
  WHERE customer_id IN (SELECT id FROM customer_ids)
),

-- Get all package booking IDs
pkg_booking_ids AS (
  SELECT id FROM package_bookings 
  WHERE customer_id IN (SELECT id FROM customer_ids)
),

-- Get all product order IDs
product_order_ids AS (
  SELECT id FROM product_orders 
  WHERE customer_id IN (SELECT id FROM customer_ids)
),

-- Get all quote IDs
quote_ids AS (
  SELECT id FROM quotes 
  WHERE customer_id IN (SELECT id FROM customer_ids)
),

-- Get all delivery IDs
delivery_ids AS (
  SELECT id FROM deliveries 
  WHERE customer_id IN (SELECT id FROM customer_ids)
),

-- Get all return IDs
return_ids AS (
  SELECT id FROM returns 
  WHERE customer_id IN (SELECT id FROM customer_ids)
)

-- DELETE CHILD RECORDS FIRST (to avoid FK constraint violations)

DELETE FROM delivery_handover_items 
WHERE delivery_id IN (SELECT id FROM delivery_ids);

DELETE FROM return_items 
WHERE return_id IN (SELECT id FROM return_ids);

DELETE FROM booking_items 
WHERE booking_id IN (SELECT id FROM booking_ids);

DELETE FROM package_booking_items 
WHERE package_booking_id IN (SELECT id FROM pkg_booking_ids);

DELETE FROM order_items 
WHERE order_id IN (SELECT id FROM order_ids);

DELETE FROM product_order_items 
WHERE product_order_id IN (SELECT id FROM product_order_ids);

DELETE FROM delivery_items 
WHERE delivery_id IN (SELECT id FROM delivery_ids);

DELETE FROM quote_items 
WHERE quote_id IN (SELECT id FROM quote_ids);

-- DELETE PARENT RECORDS

DELETE FROM deliveries 
WHERE customer_id IN (SELECT id FROM customer_ids);

DELETE FROM returns 
WHERE customer_id IN (SELECT id FROM customer_ids);

DELETE FROM bookings 
WHERE customer_id IN (SELECT id FROM customer_ids);

DELETE FROM package_bookings 
WHERE customer_id IN (SELECT id FROM customer_ids);

DELETE FROM orders 
WHERE customer_id IN (SELECT id FROM customer_ids);

DELETE FROM product_orders 
WHERE customer_id IN (SELECT id FROM customer_ids);

DELETE FROM quotes 
WHERE customer_id IN (SELECT id FROM customer_ids);

-- DELETE CUSTOMER RECORDS

DELETE FROM customers 
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

COMMIT;  -- Confirm all deletions

-- ================================================================
-- STEP 5: VERIFICATION - RUN AFTER DELETION
-- ================================================================

-- Check that all customers are deleted
SELECT COUNT(*) as remaining_customers 
FROM customers 
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

-- Check that all orders are deleted
SELECT COUNT(*) as remaining_orders 
FROM orders o
WHERE o.customer_id NOT IN (SELECT id FROM customers);

-- Check that all bookings are deleted
SELECT COUNT(*) as remaining_bookings 
FROM bookings b
WHERE b.customer_id NOT IN (SELECT id FROM customers);

-- Verify Vadodara franchise still exists (we're only deleting customers, not the franchise)
SELECT id, name, is_active 
FROM franchises 
WHERE id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

-- ================================================================
-- DELETION ORDER SUMMARY
-- ================================================================
-- 1. Delete delivery_handover_items
-- 2. Delete return_items
-- 3. Delete booking_items
-- 4. Delete package_booking_items
-- 5. Delete order_items
-- 6. Delete product_order_items
-- 7. Delete delivery_items
-- 8. Delete quote_items
-- 9. Delete deliveries
-- 10. Delete returns
-- 11. Delete bookings
-- 12. Delete package_bookings
-- 13. Delete orders
-- 14. Delete product_orders
-- 15. Delete quotes
-- 16. Delete all customers
--
-- This ensures no Foreign Key constraint violations occur
-- ================================================================
