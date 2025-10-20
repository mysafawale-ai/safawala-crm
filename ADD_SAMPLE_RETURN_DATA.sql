-- Add Sample Return Data for Testing
-- This creates sample returns so you can test the return processing form

-- First, let's check if we have deliveries to create returns from
-- If not, we'll create some sample data

-- Sample Return 1: Recent delivery return with mixed items
-- First get or create a customer
DO $$
DECLARE
  customer_id_var UUID;
BEGIN
  -- Try to get first customer, or use NULL
  SELECT id INTO customer_id_var FROM customers LIMIT 1;
  
  -- Insert return
  INSERT INTO returns (
    return_number,
    delivery_id,
    booking_id,
    booking_source,
    customer_id,
    return_date,
    status,
    notes
  ) VALUES (
    'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
    NULL, -- Will be filled if you have a delivery
    NULL, -- Will be filled if you have a booking
    'product_order',
    customer_id_var, -- Use actual customer or NULL
    CURRENT_DATE,
    'pending', -- Status: pending (ready to process)
    'Sample return for testing - wedding items with mixed conditions'
  )
  ON CONFLICT (return_number) DO NOTHING;
END $$;

-- Add items to the return we just created
-- Note: return_items are typically created during processing, but we can pre-create them for testing
DO $$
DECLARE
  return_id_var UUID;
  product_rec RECORD;
  item_count INT := 0;
BEGIN
  -- Get the return we just created
  SELECT id INTO return_id_var
  FROM returns
  WHERE return_number LIKE 'RET-%001'
  ORDER BY created_at DESC
  LIMIT 1;

  IF return_id_var IS NULL THEN
    RAISE NOTICE 'Return not found, skipping item creation';
    RETURN;
  END IF;

  -- Get up to 5 products from database and create return items
  FOR product_rec IN (
    SELECT id, name, product_code, category
    FROM products
    WHERE stock_total > 0
    LIMIT 5
  ) LOOP
    -- Create a return item with delivered quantity (not yet processed)
    -- Quantity varies based on position to make it interesting
    INSERT INTO return_items (
      return_id,
      product_id,
      product_name,
      product_code,
      product_category,
      qty_delivered,
      qty_returned,
      qty_damaged,
      qty_lost,
      archived,
      sent_to_laundry
    ) VALUES (
      return_id_var,
      product_rec.id,
      product_rec.name,
      product_rec.product_code,
      product_rec.category,
      CASE item_count
        WHEN 0 THEN 5   -- First product: 5 items
        WHEN 1 THEN 10  -- Second product: 10 items
        WHEN 2 THEN 3   -- Third product: 3 items
        WHEN 3 THEN 20  -- Fourth product: 20 items
        ELSE 8          -- Fifth product: 8 items
      END,
      0, -- Not yet processed
      0, -- Not yet processed
      0, -- Not yet processed
      false,
      false
    )
    ON CONFLICT DO NOTHING;
    
    item_count := item_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % return items for return %', item_count, return_id_var;
END $$;

-- Sample Return 2: Another return with different status
DO $$
DECLARE
  customer_id_var UUID;
BEGIN
  -- Try to get first customer, or use NULL
  SELECT id INTO customer_id_var FROM customers LIMIT 1;
  
  INSERT INTO returns (
    return_number,
    delivery_id,
    booking_id,
    booking_source,
    customer_id,
    return_date,
    status,
    notes
  ) VALUES (
    'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002',
    NULL,
    NULL,
    'package_booking',
    customer_id_var,
    (CURRENT_DATE + INTERVAL '1 day'),
    'pending',
    'Sample return for testing - corporate event items'
  )
  ON CONFLICT (return_number) DO NOTHING;
END $$;

-- Add items to second return
DO $$
DECLARE
  return_id_var UUID;
  product_rec RECORD;
  item_count INT := 0;
BEGIN
  SELECT id INTO return_id_var
  FROM returns
  WHERE return_number LIKE 'RET-%002'
  ORDER BY created_at DESC
  LIMIT 1;

  IF return_id_var IS NULL THEN
    RAISE NOTICE 'Return 002 not found, skipping item creation';
    RETURN;
  END IF;

  -- Get different products for second return (offset by 5)
  FOR product_rec IN (
    SELECT id, name, product_code, category
    FROM products
    WHERE stock_total > 0
    OFFSET 5
    LIMIT 3
  ) LOOP
    INSERT INTO return_items (
      return_id,
      product_id,
      product_name,
      product_code,
      product_category,
      qty_delivered,
      qty_returned,
      qty_damaged,
      qty_lost,
      archived,
      sent_to_laundry
    ) VALUES (
      return_id_var,
      product_rec.id,
      product_rec.name,
      product_rec.product_code,
      product_rec.category,
      CASE item_count
        WHEN 0 THEN 2   -- First product: 2 items
        WHEN 1 THEN 15  -- Second product: 15 items
        ELSE 7          -- Third product: 7 items
      END,
      0, -- Not yet processed
      0, -- Not yet processed
      0, -- Not yet processed
      false,
      false
    )
    ON CONFLICT DO NOTHING;
    
    item_count := item_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % return items for return %', item_count, return_id_var;
END $$;

-- Summary
SELECT 
  'Sample returns created!' as message,
  COUNT(*) as total_returns
FROM returns
WHERE return_number LIKE 'RET-%' 
  AND created_at > NOW() - INTERVAL '1 hour';

-- Show the created returns
SELECT 
  id,
  return_number,
  customer_name,
  status,
  return_date,
  notes
FROM returns
WHERE return_number LIKE 'RET-%'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Show items for these returns
SELECT 
  r.return_number,
  ri.product_name,
  ri.qty_delivered,
  ri.product_category,
  CASE 
    WHEN ri.qty_returned + ri.qty_damaged + ri.qty_lost = 0 THEN 'Not Processed'
    ELSE 'Processed'
  END as processing_status
FROM returns r
JOIN return_items ri ON ri.return_id = r.id
WHERE r.return_number LIKE 'RET-%'
  AND r.created_at > NOW() - INTERVAL '1 hour'
ORDER BY r.return_number, ri.product_name;
