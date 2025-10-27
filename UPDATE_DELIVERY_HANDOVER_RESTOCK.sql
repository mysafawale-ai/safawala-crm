-- Add restock tracking columns to delivery_handover_items for idempotent inventory updates

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_handover_items'
  ) THEN
    -- Add restocked_qty
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'delivery_handover_items' AND column_name = 'restocked_qty'
    ) THEN
      ALTER TABLE delivery_handover_items ADD COLUMN restocked_qty INT NOT NULL DEFAULT 0;
      COMMENT ON COLUMN delivery_handover_items.restocked_qty IS 'How many of qty_not_tied were already restocked to inventory';
    END IF;

    -- Add restocked_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'delivery_handover_items' AND column_name = 'restocked_at'
    ) THEN
      ALTER TABLE delivery_handover_items ADD COLUMN restocked_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;
