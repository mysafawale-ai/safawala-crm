-- Check if product_categories table has franchise_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'product_categories';

-- If franchise_id doesn't exist, add it
ALTER TABLE product_categories 
ADD COLUMN IF NOT EXISTS franchise_id UUID REFERENCES franchises(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_categories_franchise_id 
ON product_categories(franchise_id);

-- Update existing categories to assign them to franchises
-- Option 1: Assign all existing categories to all franchises (duplicate them)
-- Option 2: Assign all existing categories to a default franchise
-- Option 3: Keep existing categories as "global" (franchise_id = NULL) for super_admin

-- For now, we'll keep existing categories as global (accessible by all)
-- New categories created by franchises will have their franchise_id set

-- Verify
SELECT 
  id, 
  name, 
  franchise_id,
  (SELECT name FROM franchises WHERE id = product_categories.franchise_id) as franchise_name
FROM product_categories
LIMIT 10;
