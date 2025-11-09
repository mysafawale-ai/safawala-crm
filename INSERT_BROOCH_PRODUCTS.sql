-- ================================================================
-- INSERT BROOCH PRODUCTS FOR VADODARA FRANCHISE
-- ================================================================
-- Franchise: Vadodara Branch (1a518dde-85b7-44ef-8bc4-092f53ddfd99)
-- Category: Brooch
-- Total Products: 11
-- Stock per product: 100 (Demo)
-- ================================================================

BEGIN;

-- Step 1: Ensure Brooch category exists for Vadodara franchise
WITH brooch_category AS (
  INSERT INTO categories (
    id,
    franchise_id,
    name,
    description,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    '1a518dde-85b7-44ef-8bc4-092f53ddfd99',
    'Brooch',
    'Premium brooch collection',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (name, franchise_id) DO UPDATE SET updated_at = NOW()
  RETURNING id as category_id
),

category_id_value AS (
  SELECT COALESCE(
    (SELECT id FROM categories WHERE name = 'Brooch' AND franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99' LIMIT 1),
    (SELECT category_id FROM brooch_category LIMIT 1)
  ) as cat_id
)

-- Step 2: Insert all 11 Brooch products
INSERT INTO products (
  id,
  franchise_id,
  category_id,
  name,
  sku,
  brand,
  color,
  material,
  description,
  rental_price,
  sale_price,
  cost_price,
  security_deposit,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  '1a518dde-85b7-44ef-8bc4-092f53ddfd99',
  (SELECT cat_id FROM category_id_value),
  product_data.name,
  product_data.sku,
  'Safawala',
  'Mixed',
  'Premium Metal',
  product_data.description,
  product_data.price,
  0,
  product_data.cost,
  0,
  true,
  NOW(),
  NOW()
FROM (
  VALUES
    ('Brooch Classic', 'BRCH-001', 'Elegant classic brooch', 550, 275),
    ('Brooch Radiant', 'BRCH-002', 'Radiant premium brooch', 950, 475),
    ('Brooch Royal', 'BRCH-003', 'Royal elegant brooch', 1050, 525),
    ('Brooch Elegant', 'BRCH-004', 'Elegantly crafted brooch', 1450, 725),
    ('Brooch Luxe', 'BRCH-005', 'Luxe premium collection', 1650, 825),
    ('Brooch Premium', 'BRCH-006', 'Premium quality brooch', 1850, 925),
    ('Brooch Exquisite', 'BRCH-007', 'Exquisite designer brooch', 2150, 1075),
    ('Brooch Divine', 'BRCH-008', 'Divine luxury brooch', 2550, 1275),
    ('Brooch Regal', 'BRCH-009', 'Regal royal collection', 3550, 1775),
    ('Brooch Majestic', 'BRCH-010', 'Majestic premium luxury', 4550, 2275),
    ('Brooch Crown', 'BRCH-011', 'Crown jewel collection', 6550, 3275)
) AS product_data(name, sku, description, price, cost);

-- Step 3: Add stock for each product (100 units per product)
INSERT INTO product_items (
  id,
  product_id,
  franchise_id,
  quantity,
  notes,
  is_active,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  '1a518dde-85b7-44ef-8bc4-092f53ddfd99',
  100,
  'Demo stock - Brooch collection',
  true,
  NOW(),
  NOW()
FROM products p
WHERE p.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
  AND p.category_id = (SELECT id FROM categories WHERE name = 'Brooch' AND franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99' LIMIT 1)
  AND p.name LIKE 'Brooch%'
  AND NOT EXISTS (
    SELECT 1 FROM product_items pi
    WHERE pi.product_id = p.id
  );

COMMIT;

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Check all Brooch products created
SELECT 
  p.name,
  p.sku,
  p.rental_price,
  p.cost_price,
  COALESCE(SUM(pi.quantity), 0) as total_stock,
  c.name as category,
  p.is_active
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
  AND c.name = 'Brooch'
GROUP BY p.id, p.name, p.sku, p.rental_price, p.cost_price, c.name, p.is_active
ORDER BY p.rental_price ASC;

-- Count total products
SELECT 
  COUNT(DISTINCT p.id) as total_brooch_products,
  COALESCE(SUM(pi.quantity), 0) as total_stock_units,
  COUNT(DISTINCT c.id) as categories
FROM products p
LEFT JOIN product_items pi ON p.id = pi.product_id
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
  AND c.name = 'Brooch';

-- ================================================================
