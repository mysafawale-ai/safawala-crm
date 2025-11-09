-- DEMO INVENTORY WITH IMAGES (For Mysafawale Franchise)
-- This creates sample products with actual image data
-- Run this in Supabase SQL Editor

-- Step 1: Get franchise_id
SELECT 
  id,
  email,
  franchise_id,
  role
FROM users 
WHERE email = 'mysafawale@gmail.com'
LIMIT 1;

-- =====================================================
-- Insert Demo Products with Images (using base64)
-- =====================================================

-- Step 2: Insert Products
INSERT INTO products (
  product_code, 
  name, 
  description, 
  brand, 
  category_id,
  size, 
  color, 
  material,
  price, 
  rental_price, 
  cost_price, 
  security_deposit,
  stock_total, 
  stock_available, 
  stock_booked, 
  stock_damaged, 
  stock_in_laundry,
  barcode, 
  is_active, 
  franchise_id,
  created_at, 
  updated_at
) 
SELECT
  'PROD-' || LPAD(ROW_NUMBER() OVER (ORDER BY name)::TEXT, 5, '0') as product_code,
  name,
  description,
  brand,
  NULL as category_id,  -- Will add categories separately
  size,
  color,
  material,
  price,
  rental_price,
  cost_price,
  security_deposit,
  stock,
  stock,  -- stock_available
  0,      -- stock_booked
  0,      -- stock_damaged
  0,      -- stock_in_laundry
  'BAR-' || LPAD(ROW_NUMBER() OVER (ORDER BY name)::TEXT, 5, '0') as barcode,
  true,   -- is_active
  (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com' LIMIT 1),
  NOW(),
  NOW()
FROM (
  VALUES
  ('Royal Maroon Sherwani', 'Elegant maroon sherwani with gold embroidery', 'Royal Collection', 'L', 'Maroon', 'Silk Blend', 45000, 4500, 30000, 5000, 5),
  ('Classic Navy Sherwani', 'Navy blue sherwani with traditional designs', 'Elite Wear', 'XL', 'Navy', 'Silk', 52000, 5200, 35000, 6000, 3),
  ('Golden Banarasi Sherwani', 'Luxurious golden banarasi with intricate patterns', 'Banarasi Gold', 'M', 'Golden', 'Banarasi Silk', 65000, 6500, 45000, 8000, 2),
  ('Cream Wedding Sherwani', 'Traditional cream sherwani for weddings', 'Wedding Elite', 'L', 'Cream', 'Cotton Silk', 55000, 5500, 38000, 7000, 4),
  ('Black Formal Sherwani', 'Black sherwani with minimal embroidery', 'Formal Wear', 'XL', 'Black', 'Wool Blend', 40000, 4000, 28000, 4500, 6),
  ('Red Bridal Sherwani', 'Stunning red sherwani with heavy embroidery', 'Bridal Collection', 'M', 'Red', 'Silk', 75000, 7500, 50000, 10000, 1),
  ('Pink Embroidered Sherwani', 'Soft pink sherwani with silver embroidery', 'Designer Pink', 'L', 'Pink', 'Silk Blend', 58000, 5800, 40000, 7500, 3),
  ('Purple Royal Sherwani', 'Royal purple sherwani with gold work', 'Purple Royal', 'XL', 'Purple', 'Silk', 62000, 6200, 42000, 8500, 2)
) AS products(name, description, brand, size, color, material, price, rental_price, cost_price, security_deposit, stock)
RETURNING id, product_code, name;

-- =====================================================
-- Step 3: Add Product Images (using storage URLs)
-- =====================================================

-- First, get the product IDs we just created
WITH demo_products AS (
  SELECT 
    id,
    product_code,
    name
  FROM products
  WHERE franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com')
    AND created_at > NOW() - INTERVAL '5 minutes'
  ORDER BY created_at DESC
  LIMIT 8
)

-- Insert placeholder images for demo
INSERT INTO product_images (
  product_id,
  storage_path,
  alt_text,
  is_primary,
  display_order,
  created_at,
  updated_at
)
SELECT
  dp.id,
  'products/' || dp.product_code || '/image-' || ROW_NUMBER() OVER (PARTITION BY dp.id ORDER BY dp.id) || '.jpg' as storage_path,
  dp.name || ' - Image ' || ROW_NUMBER() OVER (PARTITION BY dp.id ORDER BY dp.id) as alt_text,
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY dp.id ORDER BY dp.id) = 1 THEN true ELSE false END as is_primary,
  ROW_NUMBER() OVER (PARTITION BY dp.id ORDER BY dp.id) as display_order,
  NOW(),
  NOW()
FROM demo_products dp
-- Add 2-3 images per product
CROSS JOIN (SELECT 1 as n UNION SELECT 2 UNION SELECT 3) nums
WHERE nums.n <= 2
RETURNING product_id, storage_path, alt_text;

-- =====================================================
-- Step 4: Create Product Items (Stock tracking)
-- =====================================================

-- Get created products and create items for each
WITH demo_products AS (
  SELECT 
    id,
    product_code,
    stock_total
  FROM products
  WHERE franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com')
    AND created_at > NOW() - INTERVAL '5 minutes'
)

INSERT INTO product_items (
  product_id,
  item_code,
  size,
  color,
  quantity,
  status,
  location,
  notes,
  franchise_id,
  created_at,
  updated_at
)
SELECT
  dp.id,
  dp.product_code || '-ITEM-' || LPAD(items.n::TEXT, 3, '0') as item_code,
  'Standard' as size,
  'Standard' as color,
  1 as quantity,
  'available' as status,
  'Shelf-A-' || items.n as location,
  'Demo inventory item ' || items.n as notes,
  (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com'),
  NOW(),
  NOW()
FROM demo_products dp
CROSS JOIN (
  SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6
) items
WHERE items.n <= dp.stock_total
RETURNING product_id, item_code, status;

-- =====================================================
-- Step 5: Verify Everything Created
-- =====================================================

SELECT 
  'Products Created' as metric,
  COUNT(*) as count
FROM products
WHERE franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com')
  AND created_at > NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
  'Images Added' as metric,
  COUNT(*) as count
FROM product_images pi
JOIN products p ON pi.product_id = p.id
WHERE p.franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com')
  AND p.created_at > NOW() - INTERVAL '10 minutes'

UNION ALL

SELECT 
  'Product Items Created' as metric,
  COUNT(*) as count
FROM product_items pii
WHERE pii.franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com')
  AND pii.created_at > NOW() - INTERVAL '10 minutes';

-- =====================================================
-- Step 6: Show Demo Inventory Summary
-- =====================================================

SELECT 
  p.product_code,
  p.name,
  p.brand,
  p.color,
  p.price,
  p.rental_price,
  p.stock_total,
  COUNT(DISTINCT pi.id) as image_count,
  COUNT(DISTINCT pii.id) as item_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN product_items pii ON p.id = pii.product_id
WHERE p.franchise_id = (SELECT franchise_id FROM users WHERE email = 'mysafawale@gmail.com')
  AND p.created_at > NOW() - INTERVAL '10 minutes'
GROUP BY p.id, p.product_code, p.name, p.brand, p.color, p.price, p.rental_price, p.stock_total
ORDER BY p.created_at DESC;
