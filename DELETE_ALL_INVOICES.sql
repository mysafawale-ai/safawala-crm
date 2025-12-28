-- ===================================================================
-- 🗑️ DELETE ALL INVOICES SCRIPT
-- ===================================================================
-- This script deletes all invoices (product_orders where is_quote=false)
-- and their associated items from product_order_items.
-- 
-- ⚠️ WARNING: This is a DESTRUCTIVE operation. 
-- Run in Supabase SQL Editor ONLY after backing up your data:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- Step 1: Count invoices before deletion (for verification)
SELECT 
  COUNT(*) AS total_invoices,
  COUNT(DISTINCT customer_id) AS unique_customers,
  SUM(total_amount) AS total_revenue
FROM product_orders
WHERE is_quote = false;

-- Step 2: Get list of invoice IDs to be deleted (for reference)
SELECT id, order_number, customer_id, total_amount, created_at
FROM product_orders
WHERE is_quote = false
ORDER BY created_at DESC;

-- ===================================================================
-- 🔴 DESTRUCTIVE OPERATION - UNCOMMENT TO EXECUTE
-- ===================================================================

-- Step 3a: Delete all product_order_items associated with invoices
-- DELETE FROM product_order_items
-- WHERE product_order_id IN (
--   SELECT id FROM product_orders WHERE is_quote = false
-- );

-- Step 3b: Delete all invoices (product_orders where is_quote=false)
-- DELETE FROM product_orders
-- WHERE is_quote = false;

-- ===================================================================
-- 📊 VERIFICATION QUERIES (Run after deletion to confirm)
-- ===================================================================

-- Count invoices after deletion
SELECT 
  COUNT(*) AS remaining_invoices,
  COUNT(DISTINCT customer_id) AS remaining_customers,
  SUM(total_amount) AS remaining_revenue
FROM product_orders
WHERE is_quote = false;

-- Count orphaned items (should be 0 after deletion)
SELECT COUNT(*) AS orphaned_items
FROM product_order_items
WHERE product_order_id NOT IN (SELECT id FROM product_orders);

-- List remaining quotes (should still exist)
SELECT COUNT(*) AS remaining_quotes
FROM product_orders
WHERE is_quote = true;

-- ✅ Done
