-- =====================================================
-- AUTO-GENERATE INVOICE WHEN BOOKING IS CREATED
-- This function automatically creates an invoice for new bookings
-- =====================================================

-- Function to auto-generate invoice for a booking
CREATE OR REPLACE FUNCTION auto_generate_invoice_for_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_number VARCHAR(50);
  v_invoice_id UUID;
  v_due_date DATE;
  v_item RECORD;
BEGIN
  -- Generate unique invoice number (format: INV-YYYY-XXXX)
  SELECT 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
    FROM invoices
    WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'
  )::TEXT, 4, '0')
  INTO v_invoice_number;
  
  -- Calculate due date (30 days from now by default)
  v_due_date := CURRENT_DATE + INTERVAL '30 days';
  
  -- Create the invoice
  INSERT INTO invoices (
    invoice_number,
    customer_id,
    franchise_id,
    booking_id,
    issue_date,
    due_date,
    subtotal,
    tax_rate,
    tax_amount,
    discount_amount,
    total_amount,
    paid_amount,
    balance_amount,
    status,
    payment_terms,
    notes,
    created_by
  ) VALUES (
    v_invoice_number,
    NEW.customer_id,
    NEW.franchise_id,
    NEW.id,
    CURRENT_DATE,
    v_due_date,
    NEW.total_amount - COALESCE(NEW.gst_amount, 0),
    18.00, -- Default GST rate
    COALESCE(NEW.gst_amount, 0),
    0,
    NEW.total_amount,
    COALESCE(NEW.amount_paid, 0),
    NEW.total_amount - COALESCE(NEW.amount_paid, 0),
    CASE 
      WHEN COALESCE(NEW.amount_paid, 0) >= NEW.total_amount THEN 'paid'::invoice_status
      WHEN COALESCE(NEW.amount_paid, 0) > 0 THEN 'sent'::invoice_status
      ELSE 'draft'::invoice_status
    END,
    '30_days'::payment_terms,
    'Auto-generated invoice for booking ' || COALESCE(NEW.order_number, NEW.package_number, NEW.id::TEXT),
    NEW.created_by
  )
  RETURNING id INTO v_invoice_id;
  
  -- Add invoice items from product order items or package booking items
  IF TG_TABLE_NAME = 'product_orders' THEN
    -- Add items from product_order_items
    FOR v_item IN
      SELECT 
        poi.product_id,
        p.name as description,
        poi.quantity,
        poi.price as unit_price,
        (poi.quantity * poi.price) as line_total
      FROM product_order_items poi
      LEFT JOIN products p ON p.id = poi.product_id
      WHERE poi.order_id = NEW.id
    LOOP
      INSERT INTO invoice_items (
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        discount_percent,
        line_total
      ) VALUES (
        v_invoice_id,
        v_item.product_id,
        COALESCE(v_item.description, 'Product Item'),
        v_item.quantity,
        v_item.unit_price,
        0,
        v_item.line_total
      );
    END LOOP;
    
  ELSIF TG_TABLE_NAME = 'package_bookings' THEN
    -- Add items from package_booking_items
    FOR v_item IN
      SELECT 
        pbi.package_item_id as product_id,
        p.name as description,
        pbi.quantity,
        pbi.rate as unit_price,
        (pbi.quantity * pbi.rate) as line_total
      FROM package_booking_items pbi
      LEFT JOIN package_items pi ON pi.id = pbi.package_item_id
      LEFT JOIN products p ON p.id = pi.product_id
      WHERE pbi.booking_id = NEW.id
    LOOP
      INSERT INTO invoice_items (
        invoice_id,
        product_id,
        description,
        quantity,
        unit_price,
        discount_percent,
        line_total
      ) VALUES (
        v_invoice_id,
        v_item.product_id,
        COALESCE(v_item.description, 'Package Item'),
        v_item.quantity,
        v_item.unit_price,
        0,
        v_item.line_total
      );
    END LOOP;
  END IF;
  
  RAISE NOTICE '✅ Auto-generated invoice % for booking %', v_invoice_number, NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for product_orders
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice_product_orders ON product_orders;
CREATE TRIGGER trigger_auto_generate_invoice_product_orders
  AFTER INSERT ON product_orders
  FOR EACH ROW
  WHEN (NEW.is_quote = false) -- Only for bookings, not quotes
  EXECUTE FUNCTION auto_generate_invoice_for_booking();

-- Create trigger for package_bookings
DROP TRIGGER IF EXISTS trigger_auto_generate_invoice_package_bookings ON package_bookings;
CREATE TRIGGER trigger_auto_generate_invoice_package_bookings
  AFTER INSERT ON package_bookings
  FOR EACH ROW
  WHEN (NEW.is_quote = false) -- Only for bookings, not quotes
  EXECUTE FUNCTION auto_generate_invoice_for_booking();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Auto-invoice generation triggers installed successfully!';
  RAISE NOTICE '📝 Invoices will now be automatically created for:';
  RAISE NOTICE '   - Product orders (when is_quote = false)';
  RAISE NOTICE '   - Package bookings (when is_quote = false)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 How it works:';
  RAISE NOTICE '   1. Create a booking';
  RAISE NOTICE '   2. Invoice auto-generates with format: INV-YYYY-XXXX';
  RAISE NOTICE '   3. Invoice includes all booking items';
  RAISE NOTICE '   4. Status auto-set based on payment';
  RAISE NOTICE '   5. Invoice appears in /invoices page immediately';
END $$;
