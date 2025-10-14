-- =====================================================
-- AUTO-GENERATE INVOICE WHEN BOOKING IS CREATED
-- Production-ready with error handling and validation
-- =====================================================

-- Function to auto-generate invoice for a booking
CREATE OR REPLACE FUNCTION auto_generate_invoice_for_booking()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_number VARCHAR(50);
  v_invoice_id UUID;
  v_due_date DATE;
  v_item RECORD;
  v_subtotal NUMERIC(12,2) := 0;
  v_tax_amount NUMERIC(12,2) := 0;
  v_item_count INTEGER := 0;
BEGIN
  -- Generate unique invoice number with lock to prevent race condition
  BEGIN
    -- Lock the invoices table to ensure atomic invoice number generation
    LOCK TABLE invoices IN SHARE ROW EXCLUSIVE MODE;
    
    SELECT 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 10) AS INTEGER)), 0) + 1
      FROM invoices
      WHERE invoice_number LIKE 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-%'
        AND franchise_id = NEW.franchise_id -- Franchise-specific numbering
    )::TEXT, 4, '0')
    INTO v_invoice_number;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to generate invoice number: %', SQLERRM;
      RETURN NEW; -- Don't block booking creation if invoice fails
  END;
  
  -- Validate required fields
  IF NEW.customer_id IS NULL OR NEW.franchise_id IS NULL THEN
    RAISE WARNING 'Cannot create invoice: Missing customer_id or franchise_id';
    RETURN NEW;
  END IF;
  
  IF NEW.total_amount IS NULL OR NEW.total_amount <= 0 THEN
    RAISE WARNING 'Cannot create invoice: Invalid total_amount';
    RETURN NEW;
  END IF;
  
  -- Calculate due date (30 days from now by default)
  v_due_date := CURRENT_DATE + INTERVAL '30 days';
  
  -- Calculate subtotal and tax
  v_subtotal := NEW.total_amount;
  v_tax_amount := 0;
  
  -- Try to get tax/GST amount if available
  BEGIN
    IF TG_TABLE_NAME = 'product_orders' THEN
      -- Check various possible tax column names
      v_tax_amount := COALESCE(
        (SELECT gst_amount FROM product_orders WHERE id = NEW.id),
        (SELECT tax_amount FROM product_orders WHERE id = NEW.id),
        0
      );
    ELSIF TG_TABLE_NAME = 'package_bookings' THEN
      v_tax_amount := COALESCE(
        (SELECT gst_amount FROM package_bookings WHERE id = NEW.id),
        (SELECT tax_amount FROM package_bookings WHERE id = NEW.id),
        0
      );
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      v_tax_amount := 0; -- Default to 0 if column doesn't exist
  END;
  
  -- Adjust subtotal if we have tax
  IF v_tax_amount > 0 THEN
    v_subtotal := NEW.total_amount - v_tax_amount;
  END IF;
  
  -- Create the invoice with error handling
  BEGIN
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
      v_subtotal,
      CASE WHEN v_tax_amount > 0 THEN 18.00 ELSE 0.00 END,
      v_tax_amount,
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
      'Auto-generated invoice for ' || 
        CASE 
          WHEN TG_TABLE_NAME = 'product_orders' THEN 'order ' || COALESCE(NEW.order_number, NEW.id::TEXT)
          WHEN TG_TABLE_NAME = 'package_bookings' THEN 'booking ' || COALESCE(NEW.package_number, NEW.id::TEXT)
          ELSE 'booking ' || NEW.id::TEXT
        END,
      NEW.created_by
    )
    RETURNING id INTO v_invoice_id;
    
    RAISE NOTICE '✅ Created invoice % for booking %', v_invoice_number, NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create invoice: %', SQLERRM;
      RETURN NEW; -- Don't block booking creation
  END;
  
  -- Add invoice items with error handling
  BEGIN
    IF TG_TABLE_NAME = 'product_orders' THEN
      -- Add items from product_order_items
      FOR v_item IN
        SELECT 
          poi.product_id,
          COALESCE(p.name, 'Product Item') as description,
          poi.quantity,
          poi.unit_price,
          poi.total_price as line_total
        FROM product_order_items poi
        LEFT JOIN products p ON p.id = poi.product_id
        WHERE poi.order_id = NEW.id
      LOOP
        v_item_count := v_item_count + 1;
        
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
          v_item.description,
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
          pbi.package_id as product_id,
          COALESCE(pkg.name, 'Package Item') as description,
          pbi.quantity + COALESCE(pbi.extra_safas, 0) as quantity,
          pbi.unit_price,
          pbi.total_price as line_total
        FROM package_booking_items pbi
        LEFT JOIN package_sets pkg ON pkg.id = pbi.package_id
        WHERE pbi.booking_id = NEW.id
      LOOP
        v_item_count := v_item_count + 1;
        
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
          v_item.description,
          v_item.quantity,
          v_item.unit_price,
          0,
          v_item.line_total
        );
      END LOOP;
    END IF;
    
    IF v_item_count = 0 THEN
      RAISE NOTICE '⚠️  Invoice % created with 0 items', v_invoice_number;
    ELSE
      RAISE NOTICE '✅ Added % items to invoice %', v_item_count, v_invoice_number;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to add items to invoice: %', SQLERRM;
      -- Invoice still exists, just without items
  END;
  
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
