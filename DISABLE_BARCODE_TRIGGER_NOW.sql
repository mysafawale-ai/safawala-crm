-- =====================================================
-- DISABLE THE STOCK DOUBLING TRIGGER
-- =====================================================

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products'
AND trigger_name LIKE '%barcode%';

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_barcodes ON products;

-- Drop the trigger function too
DROP FUNCTION IF EXISTS trigger_auto_generate_items();

-- Verify triggers are gone
SELECT 
  COUNT(*) as remaining_barcode_triggers
FROM information_schema.triggers
WHERE event_object_table = 'products'
AND trigger_name LIKE '%barcode%';

-- Also check for any other triggers that might modify stock
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'products';

SELECT '✅ Trigger disabled. Stock will no longer double.' as status;
