-- Add Sample Return Data for Testing
-- This creates sample returns so you can test the return processing form

-- First, let's check if we have deliveries to create returns from
-- If not, we'll create some sample data

-- Sample Return 1: Recent delivery return with mixed items
INSERT INTO returns (
  return_number,
  delivery_id,
  booking_id,
  booking_source,
  customer_name,
  customer_phone,
  return_date,
  return_time,
  actual_return_date,
  status,
  return_address,
  notes,
  special_instructions
) VALUES (
  'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
  NULL, -- Will be filled if you have a delivery
  NULL, -- Will be filled if you have a booking
  'product_order',
  'Sample Customer',
  '+91-9876543210',
  CURRENT_DATE::text,
  '18:00',
  CURRENT_TIMESTAMP,
  'scheduled', -- Status: scheduled (ready to process)
  '123 Sample Street, Mumbai, Maharashtra 400001',
  'Sample return for testing - wedding items',
  'Customer prefers afternoon pickup'
)
ON CONFLICT DO NOTHING;

-- Get the return ID we just created
DO $$
DECLARE
  return_id_var UUID;
  product_id_var UUID;
BEGIN
  -- Get the return we just created
  SELECT id INTO return_id_var
  FROM returns
  WHERE return_number LIKE 'RET-%001'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get some product IDs (adjust based on your actual products)
  -- Example: Add return items for Wedding Dress and Tuxedo
  
  -- Wedding Dress - delivered 5, some damaged
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%wedding dress%' OR LOWER(name) LIKE '%lehenga%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      5
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Tuxedo/Suit - delivered 3
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%tuxedo%' OR LOWER(name) LIKE '%suit%' OR LOWER(name) LIKE '%sherwani%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      3
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Tablecloth - delivered 10
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%tablecloth%' OR LOWER(name) LIKE '%table cover%' OR LOWER(category) LIKE '%linen%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      10
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Napkins - delivered 50
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%napkin%' OR LOWER(name) LIKE '%serviette%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      50
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Chairs - delivered 100
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%chair%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      100
    )
    ON CONFLICT DO NOTHING;
  END IF;

END $$;

-- Sample Return 2: Another return with different status
INSERT INTO returns (
  return_number,
  delivery_id,
  booking_id,
  booking_source,
  customer_name,
  customer_phone,
  return_date,
  return_time,
  status,
  return_address,
  notes
) VALUES (
  'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-002',
  NULL,
  NULL,
  'package_booking',
  'Test Customer 2',
  '+91-9876543211',
  (CURRENT_DATE + INTERVAL '1 day')::text,
  '14:00',
  'scheduled',
  '456 Test Avenue, Delhi 110001',
  'Sample return for testing - corporate event items'
)
ON CONFLICT DO NOTHING;

-- Add items to second return
DO $$
DECLARE
  return_id_var UUID;
  product_id_var UUID;
BEGIN
  SELECT id INTO return_id_var
  FROM returns
  WHERE return_number LIKE 'RET-%002'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Add projector
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%projector%' OR LOWER(category) LIKE '%equipment%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      2
    )
    ON CONFLICT DO NOTHING;
  END IF;

  -- Add tables
  SELECT id INTO product_id_var
  FROM products
  WHERE LOWER(name) LIKE '%table%' AND NOT LOWER(name) LIKE '%tablecloth%'
  LIMIT 1;
  
  IF product_id_var IS NOT NULL AND return_id_var IS NOT NULL THEN
    INSERT INTO delivery_items (
      return_id,
      product_id,
      quantity_delivered
    ) VALUES (
      return_id_var,
      product_id_var,
      20
    )
    ON CONFLICT DO NOTHING;
  END IF;

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
  p.name as product_name,
  di.quantity_delivered,
  p.category
FROM returns r
JOIN delivery_items di ON di.return_id = r.id
JOIN products p ON p.id = di.product_id
WHERE r.return_number LIKE 'RET-%'
  AND r.created_at > NOW() - INTERVAL '1 hour'
ORDER BY r.return_number, p.name;
