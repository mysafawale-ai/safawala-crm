-- Add sales_closed_by_id column to package_bookings and product_orders tables
-- This tracks which staff member closed the sale for incentive tracking

-- Add column to package_bookings
ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES users(id);

-- Add comment
COMMENT ON COLUMN package_bookings.sales_closed_by_id IS 'User/Staff member who closed this sale';

-- Add column to product_orders
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES users(id);

-- Add comment
COMMENT ON COLUMN product_orders.sales_closed_by_id IS 'User/Staff member who closed this sale';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_package_bookings_sales_closed_by 
ON package_bookings(sales_closed_by_id);

CREATE INDEX IF NOT EXISTS idx_product_orders_sales_closed_by 
ON product_orders(sales_closed_by_id);

-- Verification queries
SELECT 
    'package_bookings' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
AND column_name = 'sales_closed_by_id';

SELECT 
    'product_orders' as table_name,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name = 'sales_closed_by_id';
