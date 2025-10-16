-- ========================================
-- PACKAGE QUOTES SMOKE TEST
-- ========================================
-- Tests the fixed query and verifies all data loads correctly

-- 1. Verify package_variants has inclusions field
SELECT 
  id,
  variant_name,
  inclusions,
  CASE 
    WHEN inclusions IS NULL THEN '❌ NULL'
    WHEN jsonb_array_length(inclusions::jsonb) = 0 THEN '⚠️ EMPTY ARRAY'
    ELSE '✅ HAS DATA: ' || jsonb_array_length(inclusions::jsonb)::text || ' items'
  END as status
FROM package_variants
LIMIT 5;

-- 2. Check package bookings with is_quote=true for franchise 95168a3d
SELECT 
  pb.id,
  pb.status,
  pb.total_amount,
  c.name as customer_name,
  COUNT(pbi.id) as item_count
FROM package_bookings pb
LEFT JOIN customers c ON pb.customer_id = c.id
LEFT JOIN package_booking_items pbi ON pb.id = pbi.booking_id
WHERE pb.is_quote = true
  AND pb.franchise_id = '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
GROUP BY pb.id, pb.status, pb.total_amount, c.name
ORDER BY pb.created_at DESC;

-- 3. Test the actual query structure (simplified version)
SELECT 
  pb.id as booking_id,
  pb.status,
  c.name as customer_name,
  pbi.id as item_id,
  ps.name as package_name,
  pv.name as variant_name,
  pv.inclusions
FROM package_bookings pb
LEFT JOIN customers c ON pb.customer_id = c.id
LEFT JOIN package_booking_items pbi ON pb.id = pbi.booking_id
LEFT JOIN package_sets ps ON pbi.package_id = ps.id
LEFT JOIN package_variants pv ON pbi.variant_id = pv.id
WHERE pb.is_quote = true
  AND pb.franchise_id = '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
ORDER BY pb.created_at DESC
LIMIT 10;

-- 4. Verify no variant_inclusions table exists (should return error)
-- SELECT * FROM variant_inclusions LIMIT 1;
-- Expected: relation "variant_inclusions" does not exist

-- 5. Count total quotes for franchise
SELECT 
  'Product Quotes' as type,
  COUNT(*) as count
FROM product_orders
WHERE is_quote = true
  AND franchise_id = '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
UNION ALL
SELECT 
  'Package Quotes' as type,
  COUNT(*) as count
FROM package_bookings
WHERE is_quote = true
  AND franchise_id = '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050';

-- 6. Check status breakdown
SELECT 
  status,
  COUNT(*) as count,
  ROUND(AVG(total_amount), 2) as avg_amount
FROM (
  SELECT status, total_amount FROM product_orders WHERE is_quote = true AND franchise_id = '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
  UNION ALL
  SELECT status, total_amount FROM package_bookings WHERE is_quote = true AND franchise_id = '95168a3d-a6a5-4f9b-bbe2-7b88c7cef050'
) quotes
GROUP BY status
ORDER BY count DESC;
