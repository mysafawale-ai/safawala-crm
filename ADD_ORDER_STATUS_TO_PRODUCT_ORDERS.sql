-- Add order_status column to product_orders table
-- This column tracks whether an order is a 'quote' or 'confirmed' order

BEGIN;

-- Add order_status column to product_orders
ALTER TABLE product_orders
ADD COLUMN IF NOT EXISTS order_status VARCHAR(50) DEFAULT 'quote';

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_product_orders_order_status 
ON product_orders(order_status);

-- Add comment
COMMENT ON COLUMN product_orders.order_status IS 'Order status: quote (pending confirmation) or confirmed (items added and ready)';

-- Verify column was added
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'product_orders' 
    AND column_name = 'order_status'
) AS column_exists;

COMMIT;
