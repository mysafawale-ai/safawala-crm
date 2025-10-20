-- =====================================================
-- CUSTOMER ADDRESSES TABLE MIGRATION
-- =====================================================
-- Purpose: Store frequently used addresses for customers
-- Like shipping companies (FedEx, DHL) - save and reuse addresses
-- Created: 2025-10-20
-- =====================================================

-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  
  -- Address Information
  address_type VARCHAR(50) DEFAULT 'other', -- 'pickup', 'delivery', 'other'
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  landmark TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  full_address TEXT NOT NULL, -- Complete formatted address for quick display
  
  -- Metadata
  label VARCHAR(100), -- e.g., "Home", "Office", "Warehouse"
  is_default BOOLEAN DEFAULT FALSE, -- Default pickup/delivery address
  usage_count INTEGER DEFAULT 1, -- Track how often used
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  -- Constraints
  CONSTRAINT valid_address_type CHECK (address_type IN ('pickup', 'delivery', 'other'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_franchise_id ON customer_addresses(franchise_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_last_used ON customer_addresses(last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_default ON customer_addresses(customer_id, is_default) WHERE is_default = TRUE;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_customer_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_addresses_updated_at_trigger
  BEFORE UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_addresses_updated_at();

-- =====================================================
-- HELPER FUNCTION: Get Recent Addresses
-- =====================================================
-- Returns recent addresses for a customer ordered by usage
CREATE OR REPLACE FUNCTION get_customer_recent_addresses(
  p_customer_id UUID,
  p_address_type VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  full_address TEXT,
  label VARCHAR,
  address_type VARCHAR,
  usage_count INTEGER,
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_default BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ca.id,
    ca.full_address,
    ca.label,
    ca.address_type,
    ca.usage_count,
    ca.last_used_at,
    ca.is_default
  FROM customer_addresses ca
  WHERE ca.customer_id = p_customer_id
    AND (p_address_type IS NULL OR ca.address_type = p_address_type)
  ORDER BY 
    ca.is_default DESC,
    ca.last_used_at DESC,
    ca.usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER FUNCTION: Save or Update Address
-- =====================================================
-- Saves a new address or updates usage if exists
CREATE OR REPLACE FUNCTION save_customer_address(
  p_customer_id UUID,
  p_full_address TEXT,
  p_address_type VARCHAR DEFAULT 'other',
  p_label VARCHAR DEFAULT NULL,
  p_franchise_id UUID DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_address_id UUID;
BEGIN
  -- Check if address already exists (case-insensitive)
  SELECT id INTO v_address_id
  FROM customer_addresses
  WHERE customer_id = p_customer_id
    AND LOWER(TRIM(full_address)) = LOWER(TRIM(p_full_address))
  LIMIT 1;
  
  IF v_address_id IS NOT NULL THEN
    -- Update existing address
    UPDATE customer_addresses
    SET 
      usage_count = usage_count + 1,
      last_used_at = NOW(),
      address_type = COALESCE(p_address_type, address_type),
      label = COALESCE(p_label, label)
    WHERE id = v_address_id;
  ELSE
    -- Insert new address
    INSERT INTO customer_addresses (
      customer_id,
      franchise_id,
      full_address,
      address_type,
      label,
      address_line_1,
      created_by
    ) VALUES (
      p_customer_id,
      p_franchise_id,
      p_full_address,
      p_address_type,
      p_label,
      p_full_address, -- Use full_address as address_line_1 for now
      p_created_by
    )
    RETURNING id INTO v_address_id;
  END IF;
  
  RETURN v_address_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS POLICIES (if using Row Level Security)
-- =====================================================
-- Enable RLS
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view addresses in their franchise
CREATE POLICY customer_addresses_select_policy ON customer_addresses
  FOR SELECT
  USING (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    franchise_id IS NULL
  );

-- Policy: Users can insert addresses in their franchise
CREATE POLICY customer_addresses_insert_policy ON customer_addresses
  FOR INSERT
  WITH CHECK (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    franchise_id IS NULL
  );

-- Policy: Users can update addresses in their franchise
CREATE POLICY customer_addresses_update_policy ON customer_addresses
  FOR UPDATE
  USING (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    franchise_id IS NULL
  );

-- Policy: Users can delete addresses in their franchise
CREATE POLICY customer_addresses_delete_policy ON customer_addresses
  FOR DELETE
  USING (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
    OR
    franchise_id IS NULL
  );

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to add sample addresses

/*
INSERT INTO customer_addresses (customer_id, full_address, address_type, label, franchise_id)
SELECT 
  c.id,
  c.address,
  'delivery',
  'Primary Address',
  c.franchise_id
FROM customers c
WHERE c.address IS NOT NULL AND c.address != ''
LIMIT 5;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check table created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customer_addresses'
ORDER BY ordinal_position;

-- Test helper function (replace with actual customer_id)
-- SELECT * FROM get_customer_recent_addresses('your-customer-uuid-here', 'pickup', 10);

COMMENT ON TABLE customer_addresses IS 'Stores frequently used addresses for customers - like FedEx/DHL address book';
COMMENT ON FUNCTION get_customer_recent_addresses IS 'Retrieves recent addresses for a customer ordered by usage frequency';
COMMENT ON FUNCTION save_customer_address IS 'Saves or updates a customer address, tracking usage count';
