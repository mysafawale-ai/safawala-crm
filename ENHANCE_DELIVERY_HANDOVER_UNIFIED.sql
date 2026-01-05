-- Enhance delivery_handover_items table for unified handover capture
-- This adds photo, signature, recipient info, and item categorization

DO $$
BEGIN
  -- Add photo and signature columns to handover
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN photo_url TEXT;
    COMMENT ON COLUMN delivery_handover_items.photo_url IS 'Photo of items at handover';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'signature_url'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN signature_url TEXT;
    COMMENT ON COLUMN delivery_handover_items.signature_url IS 'Digital signature of recipient';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'recipient_name'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN recipient_name TEXT;
    COMMENT ON COLUMN delivery_handover_items.recipient_name IS 'Name of person receiving delivery';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'recipient_phone'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN recipient_phone TEXT;
    COMMENT ON COLUMN delivery_handover_items.recipient_phone IS 'Phone of person receiving delivery';
  END IF;

  -- Add item categorization columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'qty_used'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN qty_used INT DEFAULT 0;
    COMMENT ON COLUMN delivery_handover_items.qty_used IS 'Items used by customer (will go to laundry)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'qty_not_used'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN qty_not_used INT DEFAULT 0;
    COMMENT ON COLUMN delivery_handover_items.qty_not_used IS 'Items not used (will return to inventory)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'qty_damaged'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN qty_damaged INT DEFAULT 0;
    COMMENT ON COLUMN delivery_handover_items.qty_damaged IS 'Items damaged (will go to archive)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'qty_lost'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN qty_lost INT DEFAULT 0;
    COMMENT ON COLUMN delivery_handover_items.qty_lost IS 'Items lost (will go to archive)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'damage_reason'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN damage_reason TEXT;
    COMMENT ON COLUMN delivery_handover_items.damage_reason IS 'Reason for damage (stain, tear, etc)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'damage_notes'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN damage_notes TEXT;
    COMMENT ON COLUMN delivery_handover_items.damage_notes IS 'Detailed notes on damage';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'delivery_handover_items' AND column_name = 'handover_completed_at'
  ) THEN
    ALTER TABLE delivery_handover_items ADD COLUMN handover_completed_at TIMESTAMPTZ;
    COMMENT ON COLUMN delivery_handover_items.handover_completed_at IS 'Timestamp when handover was completed';
  END IF;

  RAISE NOTICE 'Delivery handover table enhanced with photo, signature, and categorization columns';
END $$;

-- ========================================================================
-- DELIVERY TABLE: Add photo and signature references
-- ========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'handover_photo_url'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN handover_photo_url TEXT;
    COMMENT ON COLUMN deliveries.handover_photo_url IS 'Photo captured at handover';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'handover_signature_url'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN handover_signature_url TEXT;
    COMMENT ON COLUMN deliveries.handover_signature_url IS 'Signature captured at handover';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'recipient_name'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN recipient_name TEXT;
    COMMENT ON COLUMN deliveries.recipient_name IS 'Name of person who received delivery';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'recipient_phone'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN recipient_phone TEXT;
    COMMENT ON COLUMN deliveries.recipient_phone IS 'Phone of person who received delivery';
  END IF;

  RAISE NOTICE 'Deliveries table enhanced with handover photo, signature, and recipient info';
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_handover_items TO authenticated;
