-- Add has_items column to product_orders table
-- This tracks whether a product order has items selected
-- Used by the API to determine if product selection is pending

BEGIN;

-- Add has_items column to product_orders
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS has_items BOOLEAN DEFAULT FALSE;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_product_orders_has_items 
ON product_orders(has_items) WHERE has_items = TRUE;

-- Add comment
COMMENT ON COLUMN product_orders.has_items IS 'Flag indicating whether items have been selected for this order';

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name = 'has_items';

COMMIT;
