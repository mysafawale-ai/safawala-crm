-- ============================================================
-- DELIVERY STAFF ASSIGNMENT SYSTEM
-- Allows assigning multiple staff members to a delivery
-- ============================================================

-- 1. Create junction table for delivery-staff many-to-many relationship
CREATE TABLE IF NOT EXISTS delivery_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'assigned', -- 'driver', 'helper', 'assigned'
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  
  -- Prevent duplicate assignments
  UNIQUE(delivery_id, staff_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_delivery_staff_delivery ON delivery_staff(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_staff_staff ON delivery_staff(staff_id);

-- 3. Add RLS policies
ALTER TABLE delivery_staff ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view delivery_staff
CREATE POLICY "Users can view delivery_staff" ON delivery_staff
  FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete
CREATE POLICY "Users can manage delivery_staff" ON delivery_staff
  FOR ALL USING (true);

-- 4. Add assigned_staff_ids array column to deliveries for quick access (optional, denormalized)
ALTER TABLE deliveries 
ADD COLUMN IF NOT EXISTS assigned_staff_ids UUID[] DEFAULT '{}';

-- 5. Create a function to sync assigned_staff_ids when delivery_staff changes
CREATE OR REPLACE FUNCTION sync_delivery_staff_ids()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the denormalized array in deliveries table
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE deliveries
    SET assigned_staff_ids = (
      SELECT COALESCE(array_agg(staff_id), '{}')
      FROM delivery_staff
      WHERE delivery_id = NEW.delivery_id
    )
    WHERE id = NEW.delivery_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE deliveries
    SET assigned_staff_ids = (
      SELECT COALESCE(array_agg(staff_id), '{}')
      FROM delivery_staff
      WHERE delivery_id = OLD.delivery_id
    )
    WHERE id = OLD.delivery_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers to keep assigned_staff_ids in sync
DROP TRIGGER IF EXISTS trigger_sync_delivery_staff_insert ON delivery_staff;
CREATE TRIGGER trigger_sync_delivery_staff_insert
  AFTER INSERT ON delivery_staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_delivery_staff_ids();

DROP TRIGGER IF EXISTS trigger_sync_delivery_staff_update ON delivery_staff;
CREATE TRIGGER trigger_sync_delivery_staff_update
  AFTER UPDATE ON delivery_staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_delivery_staff_ids();

DROP TRIGGER IF EXISTS trigger_sync_delivery_staff_delete ON delivery_staff;
CREATE TRIGGER trigger_sync_delivery_staff_delete
  AFTER DELETE ON delivery_staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_delivery_staff_ids();

-- 7. Grant permissions
GRANT ALL ON delivery_staff TO authenticated;
GRANT ALL ON delivery_staff TO service_role;

-- ============================================================
-- DONE! Now you can assign multiple staff to deliveries
-- ============================================================
