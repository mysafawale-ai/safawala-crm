-- Add missing modification columns for direct sales in product_orders
-- File: ADD_MODIFICATIONS_TO_PRODUCT_ORDERS.sql
-- Purpose: Support modification tracking for direct sale orders
-- Status: Ready for deployment

BEGIN;

-- 1. Add has_modifications column
-- Indicates whether this direct sale order requires modifications
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS has_modifications BOOLEAN DEFAULT FALSE;

-- 2. Add modifications_details column
-- Stores description of modifications needed (e.g., color change, size adjustment)
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS modifications_details TEXT;

-- 3. Add modification_date column
-- Deadline/scheduled date for completing modifications
ALTER TABLE product_orders 
ADD COLUMN IF NOT EXISTS modification_date TIMESTAMPTZ;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_product_orders_has_modifications 
ON product_orders(has_modifications) 
WHERE has_modifications = TRUE;

CREATE INDEX IF NOT EXISTS idx_product_orders_modification_date 
ON product_orders(modification_date) 
WHERE modification_date IS NOT NULL;

-- Add helpful comments for documentation
COMMENT ON COLUMN product_orders.has_modifications IS 'Flag indicating if this direct sale order requires modifications (only for booking_type = "sale")';
COMMENT ON COLUMN product_orders.modifications_details IS 'Description of modifications needed (e.g., color change, size adjustment, special embroidery, custom stitching)';
COMMENT ON COLUMN product_orders.modification_date IS 'Deadline or scheduled date for completing the modifications for this direct sale order';

-- Verification Query: Check all 3 columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('has_modifications', 'modifications_details', 'modification_date')
        THEN '✅ NEWLY ADDED'
        ELSE '📋 Existing'
    END as status
FROM information_schema.columns 
WHERE table_name = 'product_orders' 
AND column_name IN ('has_modifications', 'modifications_details', 'modification_date')
ORDER BY ordinal_position;

-- Summary of changes
SELECT 
    '✅ MODIFICATION COLUMNS ADDED' as status,
    '3 columns added to product_orders table' as summary,
    'has_modifications (BOOLEAN), modifications_details (TEXT), modification_date (TIMESTAMPTZ)' as columns_added,
    now() as timestamp;

COMMIT;
