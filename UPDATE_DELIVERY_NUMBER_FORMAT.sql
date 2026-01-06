-- Update delivery_number format to use DEL-{invoice_suffix}
-- Old format: DEL-20260106-00108
-- New format: DEL-INV0007

-- First, let's check what invoice suffixes look like
SELECT 
  id,
  booking_number,
  delivery_id,
  d.delivery_number
FROM deliveries d
LEFT JOIN product_orders po ON d.booking_id = po.id
LEFT JOIN package_bookings pb ON d.booking_id = pb.id
LIMIT 5;

-- Create new trigger to generate delivery numbers from booking invoice suffix
CREATE OR REPLACE FUNCTION generate_delivery_number()
RETURNS TRIGGER AS $$
DECLARE
  new_delivery_number TEXT;
  invoice_suffix TEXT;
BEGIN
  -- Try to get invoice suffix from the booking
  IF NEW.booking_source = 'product_order' THEN
    SELECT 
      COALESCE(po.invoice_number, 'INV' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY po.created_at) AS TEXT), 4, '0'))
      INTO invoice_suffix
      FROM product_orders po
      WHERE po.id = NEW.booking_id
      LIMIT 1;
  ELSE
    SELECT 
      COALESCE(pb.invoice_number, 'INV' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY pb.created_at) AS TEXT), 4, '0'))
      INTO invoice_suffix
      FROM package_bookings pb
      WHERE pb.id = NEW.booking_id
      LIMIT 1;
  END IF;
  
  -- Generate new format: DEL-{invoice_suffix}
  new_delivery_number := 'DEL-' || COALESCE(invoice_suffix, 'INV' || LPAD(CAST(nextval('delivery_seq')::TEXT), 4, '0'));
  
  NEW.delivery_number := new_delivery_number;
  NEW.created_at := NOW();
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS set_delivery_number ON deliveries;

-- Create new trigger
CREATE TRIGGER set_delivery_number
BEFORE INSERT ON deliveries
FOR EACH ROW
EXECUTE FUNCTION generate_delivery_number();

-- Regenerate delivery numbers for existing deliveries (optional - comment out if you want to keep old ones)
-- UPDATE deliveries 
-- SET delivery_number = NULL
-- WHERE delivery_number LIKE 'DEL-20%'
-- RETURNING *;
