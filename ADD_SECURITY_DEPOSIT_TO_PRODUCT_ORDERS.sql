-- ⚠️ CRITICAL MISSING COLUMN - Add security_deposit to product_orders
-- This column is REQUIRED by the create-product-order page (line 556)
-- Error: "Could not find the 'security_deposit' column of 'product_orders' in the schema cache"

-- Add security_deposit column to product_orders table
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;

-- Add index for performance (if querying by deposit)
CREATE INDEX IF NOT EXISTS idx_product_orders_security_deposit 
ON product_orders(security_deposit) 
WHERE security_deposit > 0;

-- Add comment for documentation
COMMENT ON COLUMN product_orders.security_deposit IS 'Refundable security deposit amount for rental orders (order-level aggregate)';

-- Verify the column was added successfully
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
  AND column_name = 'security_deposit';

-- Show a sample of the data structure
SELECT 
  order_number,
  booking_type,
  total_amount,
  security_deposit,
  created_at
FROM product_orders
ORDER BY created_at DESC
LIMIT 5;
