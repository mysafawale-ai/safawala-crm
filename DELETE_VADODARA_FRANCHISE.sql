-- ================================================================
-- DELETE VADODARA FRANCHISE AND ALL RELATED DATA
-- ================================================================
-- This script safely deletes the vadodara@safawala.com franchise
-- and ALL related data in the correct order to avoid FK constraints
-- ================================================================

-- STEP 1: IDENTIFY THE FRANCHISE
-- ================================================================
SELECT 
  u.id as user_id,
  u.email,
  u.franchise_id,
  u.role,
  f.name as franchise_name,
  f.is_active
FROM users u
LEFT JOIN franchises f ON u.franchise_id = f.id
WHERE u.email = 'vadodara@safawala.com'
LIMIT 5;

-- ================================================================
-- STEP 2: COUNT WHAT WILL BE DELETED
-- ================================================================
-- Store the franchise_id for use below
-- Replace 'FRANCHISE_ID_HERE' with the actual franchise_id from STEP 1

WITH franchise_data AS (
  SELECT id FROM franchises 
  WHERE id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1)
)
SELECT 
  (SELECT COUNT(*) FROM users WHERE franchise_id = (SELECT id FROM franchise_data)) as user_count,
  (SELECT COUNT(*) FROM products WHERE franchise_id = (SELECT id FROM franchise_data)) as product_count,
  (SELECT COUNT(*) FROM product_images WHERE product_id IN (SELECT id FROM products WHERE franchise_id = (SELECT id FROM franchise_data))) as image_count,
  (SELECT COUNT(*) FROM product_items WHERE product_id IN (SELECT id FROM products WHERE franchise_id = (SELECT id FROM franchise_data))) as item_count,
  (SELECT COUNT(*) FROM bookings WHERE franchise_id = (SELECT id FROM franchise_data)) as booking_count,
  (SELECT COUNT(*) FROM package_bookings WHERE franchise_id = (SELECT id FROM franchise_data)) as package_booking_count,
  (SELECT COUNT(*) FROM orders WHERE franchise_id = (SELECT id FROM franchise_data)) as order_count,
  (SELECT COUNT(*) FROM deliveries WHERE franchise_id = (SELECT id FROM franchise_data)) as delivery_count,
  (SELECT COUNT(*) FROM returns WHERE franchise_id = (SELECT id FROM franchise_data)) as return_count,
  (SELECT COUNT(*) FROM quotes WHERE franchise_id = (SELECT id FROM franchise_data)) as quote_count,
  (SELECT COUNT(*) FROM categories WHERE franchise_id = (SELECT id FROM franchise_data)) as category_count,
  (SELECT COUNT(*) FROM vendors WHERE franchise_id = (SELECT id FROM franchise_data)) as vendor_count,
  (SELECT COUNT(*) FROM coupons WHERE franchise_id = (SELECT id FROM franchise_data)) as coupon_count;

-- ================================================================
-- STEP 3: BACKUP PLAN (OPTIONAL - Create a view of what will be deleted)
-- ================================================================
-- Run this to see all users in the franchise
SELECT id, email, name, role, created_at FROM users 
WHERE franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1);

-- ================================================================
-- ⚠️  STEP 4: DELETE SCRIPT - RUN THESE IN ORDER
-- ================================================================

BEGIN;  -- Start transaction (ROLLBACK if something goes wrong)

-- Get franchise ID
WITH franchise_data AS (
  SELECT id as franchise_id FROM franchises 
  WHERE id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1)
),

-- Get all product IDs for this franchise (for cascading deletes)
product_ids AS (
  SELECT id FROM products 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
),

-- Get all booking IDs for this franchise
booking_ids AS (
  SELECT id FROM bookings 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
),

-- Get all package booking IDs for this franchise
pkg_booking_ids AS (
  SELECT id FROM package_bookings 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
),

-- Get all order IDs for this franchise
order_ids AS (
  SELECT id FROM orders 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
),

-- Get all delivery IDs for this franchise
delivery_ids AS (
  SELECT id FROM deliveries 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
),

-- Get all return IDs for this franchise
return_ids AS (
  SELECT id FROM returns 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
)

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

DELETE FROM delivery_items 
WHERE delivery_id IN (SELECT id FROM delivery_ids);

DELETE FROM quote_items 
WHERE quote_id IN (SELECT id FROM (
  SELECT id FROM quotes 
  WHERE franchise_id = (SELECT franchise_id FROM franchise_data)
) AS q);

DELETE FROM product_images 
WHERE product_id IN (SELECT id FROM product_ids);

DELETE FROM product_items 
WHERE product_id IN (SELECT id FROM product_ids);

DELETE FROM products 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM bookings 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM package_bookings 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM orders 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM deliveries 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM returns 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM quotes 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM coupons 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM vendors 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM categories 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM expense_categories 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM expenses 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

DELETE FROM audit_logs 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

-- Delete all users in this franchise
DELETE FROM users 
WHERE franchise_id = (SELECT franchise_id FROM franchise_data);

-- Finally delete the franchise itself
DELETE FROM franchises 
WHERE id = (SELECT franchise_id FROM franchise_data);

COMMIT;  -- Confirm all deletions

-- ================================================================
-- STEP 5: VERIFICATION - RUN AFTER DELETION
-- ================================================================
-- Check that franchise and users are gone
SELECT COUNT(*) as remaining_franchises 
FROM franchises 
WHERE id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1);

SELECT COUNT(*) as remaining_users_with_email 
FROM users 
WHERE email LIKE '%vadodara%';

SELECT COUNT(*) as remaining_products 
FROM products 
WHERE franchise_id = (SELECT franchise_id FROM users WHERE email = 'vadodara@safawala.com' LIMIT 1);

-- ================================================================
-- ROLLBACK PLAN (If deletion was a mistake)
-- ================================================================
-- If you made a mistake and want to undo, run:
-- ROLLBACK;
-- This only works if you're in the same transaction session

-- ================================================================
-- SUMMARY OF DELETION ORDER
-- ================================================================
-- 1. Delete all child records (delivery_handover_items, return_items, etc.)
-- 2. Delete parent records (deliveries, returns, bookings, etc.)
-- 3. Delete products and related data (product_images, product_items)
-- 4. Delete all users in the franchise
-- 5. Delete the franchise itself
--
-- This ensures no Foreign Key constraint violations occur
-- ================================================================
