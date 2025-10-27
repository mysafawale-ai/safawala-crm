-- Create table to capture per-product handover (not tied) quantities at delivery time
-- This records items that were delivered but not tied/used during handover.
-- Inventory is not impacted at this step; it's used to prefill the final return processing.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'delivery_handover_items'
  ) THEN
    CREATE TABLE delivery_handover_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
      qty_not_tied INT NOT NULL DEFAULT 0,
      notes TEXT,
      franchise_id UUID REFERENCES franchises(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT uq_delivery_product UNIQUE (delivery_id, product_id),
      CONSTRAINT chk_qty_not_tied_nonnegative CHECK (qty_not_tied >= 0)
    );
    
    COMMENT ON TABLE delivery_handover_items IS 'Per-product handover capture for not tied/unused quantities at delivery time';
    COMMENT ON COLUMN delivery_handover_items.qty_not_tied IS 'Quantity delivered but not tied/used at handover';

    CREATE INDEX IF NOT EXISTS idx_handover_delivery ON delivery_handover_items(delivery_id);
    CREATE INDEX IF NOT EXISTS idx_handover_product ON delivery_handover_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_handover_franchise ON delivery_handover_items(franchise_id);

    -- updated_at trigger
    CREATE OR REPLACE FUNCTION update_delivery_handover_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS delivery_handover_updated_at_trigger ON delivery_handover_items;
    CREATE TRIGGER delivery_handover_updated_at_trigger
      BEFORE UPDATE ON delivery_handover_items
      FOR EACH ROW
      EXECUTE FUNCTION update_delivery_handover_updated_at();

    GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_handover_items TO authenticated;
  END IF;
END $$;
