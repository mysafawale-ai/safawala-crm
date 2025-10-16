-- ============================================================================
-- ADD SALES_CLOSED_BY_ID TO QUOTES AND LINK TO BOOKINGS
-- ============================================================================
-- Purpose: Track which sales staff member closed the quote/deal
-- Date: October 16, 2025
-- ============================================================================

-- Step 1: Add sales_closed_by_id column to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES staff(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_quotes_sales_closed_by ON quotes(sales_closed_by_id);

-- Add comment
COMMENT ON COLUMN quotes.sales_closed_by_id IS 'Staff member who closed this quote/deal';

-- Step 2: Add from_quote_id to product_orders and package_bookings
-- This creates the reverse relationship so we can fetch quote data from bookings
ALTER TABLE product_orders
ADD COLUMN IF NOT EXISTS from_quote_id UUID REFERENCES quotes(id);

ALTER TABLE package_bookings
ADD COLUMN IF NOT EXISTS from_quote_id UUID REFERENCES quotes(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_product_orders_from_quote ON product_orders(from_quote_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_from_quote ON package_bookings(from_quote_id);

-- Add comments
COMMENT ON COLUMN product_orders.from_quote_id IS 'Quote that was converted to create this order';
COMMENT ON COLUMN package_bookings.from_quote_id IS 'Quote that was converted to create this booking';

