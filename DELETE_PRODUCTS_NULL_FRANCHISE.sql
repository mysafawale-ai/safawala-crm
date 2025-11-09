-- REMOVE PRODUCTS WITH NULL FRANCHISE_ID
-- This script safely deletes orphaned products

-- Step 1: Count how many products have NULL franchise_id
SELECT 
  COUNT(*) as products_to_delete,
  COUNT(*) FILTER (WHERE franchise_id IS NOT NULL) as products_with_franchise
FROM products;

-- Step 2: See what products will be deleted
SELECT 
  id,
  product_code,
  name,
  brand,
  created_at,
  franchise_id
FROM products
WHERE franchise_id IS NULL
ORDER BY created_at DESC;

-- Step 3: Delete all product images for orphaned products
DELETE FROM product_images
WHERE product_id IN (
  SELECT id FROM products WHERE franchise_id IS NULL
);

-- Step 4: Delete all product items for orphaned products
DELETE FROM product_items
WHERE product_id IN (
  SELECT id FROM products WHERE franchise_id IS NULL
);

-- Step 5: Delete the orphaned products
DELETE FROM products
WHERE franchise_id IS NULL;

-- Step 6: Verify deletion
SELECT 
  COUNT(*) as remaining_orphaned_products
FROM products
WHERE franchise_id IS NULL;

-- Step 7: Show final summary
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT franchise_id) as total_franchises
FROM products
WHERE franchise_id IS NOT NULL;
