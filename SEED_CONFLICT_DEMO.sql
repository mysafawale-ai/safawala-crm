-- Seed demo data to visualize date-aware conflicts in Product Selection dialog
-- Window target: set your booking event date to 2025-10-11
-- This script creates orders on 2025-10-09 and 2025-10-12 for the same product
-- So the dialog (D-2..D+2) shows conflicts/low availability around 2025-10-11

begin;

-- Ensure a demo customer exists
DO $$
DECLARE
  v_customer_id uuid;
BEGIN
  SELECT id INTO v_customer_id FROM customers LIMIT 1;
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (id, name, phone)
    VALUES (gen_random_uuid(), 'Demo Customer (Conflicts)', '9999999999')
    RETURNING id INTO v_customer_id;
  END IF;
END $$;

-- Ensure a demo franchise exists
DO $$
DECLARE
  v_franchise_id uuid;
BEGIN
  SELECT id INTO v_franchise_id FROM franchises LIMIT 1;
  IF v_franchise_id IS NULL THEN
    INSERT INTO franchises (id, name)
    VALUES (gen_random_uuid(), 'Demo Franchise')
    RETURNING id INTO v_franchise_id;
  END IF;
END $$;

-- Create or update a demo product with stock (ensures product_code NOT NULL & UNIQUE)
DO $$
DECLARE
  v_product_id uuid;
  v_existing uuid;
  v_code_try text := 'DEMO-SAF-001';
  n int := 1;
  v_franchise_id uuid;
BEGIN
  -- Get a franchise id (previous DO ensures at least one exists)
  SELECT id INTO v_franchise_id FROM franchises LIMIT 1;

  SELECT id INTO v_existing FROM products WHERE name = 'Conflict Demo Safa' LIMIT 1;
  IF v_existing IS NULL THEN
    -- ensure unique product_code
    WHILE EXISTS (SELECT 1 FROM products WHERE product_code = v_code_try) LOOP
      n := n + 1;
      v_code_try := 'DEMO-SAF-' || LPAD(n::text, 3, '0');
    END LOOP;
    INSERT INTO products (
      id, product_code, name, category, price, rental_price,
      stock_total, stock_available, stock_booked, image_url, is_active, franchise_id
    ) VALUES (
      gen_random_uuid(), v_code_try, 'Conflict Demo Safa', 'Demo Safas', 2000, 0,
      10, 10, 0, NULL, true, v_franchise_id
    ) RETURNING id INTO v_product_id;
  ELSE
    v_product_id := v_existing;
    -- Assign a product_code if missing and ensure uniqueness
    IF (SELECT product_code FROM products WHERE id = v_product_id) IS NULL THEN
      v_code_try := 'DEMO-SAF-001'; n := 1;
      WHILE EXISTS (SELECT 1 FROM products WHERE product_code = v_code_try) LOOP
        n := n + 1;
        v_code_try := 'DEMO-SAF-' || LPAD(n::text, 3, '0');
      END LOOP;
      UPDATE products SET product_code = v_code_try WHERE id = v_product_id;
    END IF;
    UPDATE products
      SET category = coalesce(category, 'Demo Safas'),
          price = 2000,
          stock_total = 10,
          stock_available = 10,
          is_active = true,
          franchise_id = coalesce(franchise_id, v_franchise_id)
      WHERE id = v_product_id;
  END IF;
END $$;

-- Create two orders around 2025-10-11 to simulate conflicts
DO $$
DECLARE
  v_customer_id uuid;
  v_franchise_id uuid;
  v_product_id uuid;
  v_order1_id uuid;
  v_order2_id uuid;
BEGIN
  SELECT id INTO v_customer_id FROM customers ORDER BY created_at ASC NULLS LAST LIMIT 1;
  SELECT id INTO v_franchise_id FROM franchises ORDER BY created_at ASC NULLS LAST LIMIT 1;
  SELECT id INTO v_product_id FROM products WHERE name = 'Conflict Demo Safa' LIMIT 1;

  -- D-2: 2025-10-09 (3 items)
  INSERT INTO product_orders (
    id, order_number, customer_id, franchise_id, booking_type,
    payment_type, event_date, total_amount, status, created_at
  ) VALUES (
    gen_random_uuid(), 'ORD-DEMO-1', v_customer_id, v_franchise_id, 'rental',
    'full', '2025-10-09T10:00:00+05:30', 6000, 'confirmed', now()
  ) RETURNING id INTO v_order1_id;

  INSERT INTO product_order_items (
    id, order_id, product_id, quantity, unit_price, total_price
  ) VALUES (
    gen_random_uuid(), v_order1_id, v_product_id, 3, 2000, 6000
  );

  -- D+1: 2025-10-12 (6 items)
  INSERT INTO product_orders (
    id, order_number, customer_id, franchise_id, booking_type,
    payment_type, event_date, total_amount, status, created_at
  ) VALUES (
    gen_random_uuid(), 'ORD-DEMO-2', v_customer_id, v_franchise_id, 'rental',
    'full', '2025-10-12T10:00:00+05:30', 12000, 'confirmed', now()
  ) RETURNING id INTO v_order2_id;

  INSERT INTO product_order_items (
    id, order_id, product_id, quantity, unit_price, total_price
  ) VALUES (
    gen_random_uuid(), v_order2_id, v_product_id, 6, 2000, 12000
  );
END $$;

commit;

-- After running this, set your booking event date to 2025-10-11, open the Product Selection dialog,
-- filter to category "Demo Safas", and you should see:
--  - Booked: 9 in window
--  - Availability badge ("Low • 1 left") if stock_available is 10
--  - Details popover showing entries for 2025-10-09 and 2025-10-12.