-- Add columns to capture items returned during delivery with process split

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_handover_items'
  ) THEN
    -- Returned at handover: restocked quantity
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'delivery_handover_items' AND column_name = 'returned_restocked_qty'
    ) THEN
      ALTER TABLE delivery_handover_items ADD COLUMN returned_restocked_qty INT NOT NULL DEFAULT 0;
      COMMENT ON COLUMN delivery_handover_items.returned_restocked_qty IS 'Quantity returned at handover and directly restocked (available++, booked--)';
    END IF;

    -- Returned at handover: sent to laundry quantity
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'delivery_handover_items' AND column_name = 'returned_laundry_qty'
    ) THEN
      ALTER TABLE delivery_handover_items ADD COLUMN returned_laundry_qty INT NOT NULL DEFAULT 0;
      COMMENT ON COLUMN delivery_handover_items.returned_laundry_qty IS 'Quantity returned at handover and sent to laundry (in_laundry++, booked--)';
    END IF;
  END IF;
END $$;
