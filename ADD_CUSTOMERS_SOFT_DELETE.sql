-- BULLETPROOF CUSTOMER SOFT DELETE MIGRATION
-- Add simple active/inactive flag to customers table (much safer than timestamps)

-- Step 1: Add the column with default TRUE
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Step 2: Update any NULL values to TRUE (for safety)
UPDATE customers 
  SET is_active = TRUE 
  WHERE is_active IS NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_customers_is_active 
  ON customers (is_active) 
  WHERE is_active = true;

-- Step 4: Verify the migration worked
SELECT 
  COUNT(*) as total_customers,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_customers,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_customers,
  COUNT(CASE WHEN is_active IS NULL THEN 1 END) as null_values
FROM customers;
