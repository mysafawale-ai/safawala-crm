-- =====================================================
-- NOTIFICATION TRIGGERS FOR ALL CRM ACTIVITIES
-- Auto-create notifications on database events
-- =====================================================

-- ============================================
-- 1. BOOKING NOTIFICATIONS
-- ============================================

-- Trigger: New booking created
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_name VARCHAR;
  v_staff_ids UUID[];
  v_staff_id UUID;
BEGIN
  -- Get customer name
  SELECT name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
  
  -- Get all staff in the franchise
  SELECT ARRAY_AGG(id) INTO v_staff_ids
  FROM users
  WHERE franchise_id = NEW.franchise_id
    AND role IN ('staff', 'franchise_admin', 'super_admin');
  
  -- Create notification for each staff member
  FOREACH v_staff_id IN ARRAY v_staff_ids
  LOOP
    PERFORM create_notification(
      v_staff_id,
      NEW.franchise_id,
      'booking_created',
      '📦 New Booking Created',
      'Booking ' || NEW.booking_number || ' for ' || COALESCE(v_customer_name, 'customer') || ' has been created.',
      'high',
      'booking',
      NEW.id,
      jsonb_build_object(
        'booking_number', NEW.booking_number,
        'customer_name', v_customer_name,
        'event_date', NEW.event_date,
        'total_amount', NEW.total_amount
      ),
      '/bookings/' || NEW.id,
      'View Booking'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_booking_created
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_created();

-- Trigger: Booking status changed
CREATE OR REPLACE FUNCTION notify_booking_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_name VARCHAR;
  v_staff_ids UUID[];
  v_staff_id UUID;
  v_priority VARCHAR;
BEGIN
  -- Only trigger if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  SELECT name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;
  
  -- Determine priority based on new status
  v_priority := CASE
    WHEN NEW.status = 'cancelled' THEN 'critical'
    WHEN NEW.status = 'confirmed' THEN 'high'
    WHEN NEW.status = 'delivered' THEN 'medium'
    ELSE 'medium'
  END;
  
  SELECT ARRAY_AGG(id) INTO v_staff_ids
  FROM users
  WHERE franchise_id = NEW.franchise_id
    AND role IN ('staff', 'franchise_admin', 'super_admin');
  
  FOREACH v_staff_id IN ARRAY v_staff_ids
  LOOP
    PERFORM create_notification(
      v_staff_id,
      NEW.franchise_id,
      'booking_status_changed',
      '🔄 Booking Status Updated',
      'Booking ' || NEW.booking_number || ' status changed from ' || OLD.status || ' to ' || NEW.status,
      v_priority,
      'booking',
      NEW.id,
      jsonb_build_object(
        'booking_number', NEW.booking_number,
        'customer_name', v_customer_name,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      '/bookings/' || NEW.id,
      'View Booking'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_booking_status_changed
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_status_changed();

-- ============================================
-- 2. PAYMENT NOTIFICATIONS
-- ============================================

-- Trigger: Payment received
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_name VARCHAR;
  v_booking_number VARCHAR;
  v_staff_ids UUID[];
  v_staff_id UUID;
BEGIN
  -- Get booking and customer details
  SELECT b.booking_number, c.name INTO v_booking_number, v_customer_name
  FROM bookings b
  JOIN customers c ON c.id = b.customer_id
  WHERE b.id = NEW.booking_id;
  
  SELECT ARRAY_AGG(id) INTO v_staff_ids
  FROM users
  WHERE franchise_id = NEW.franchise_id
    AND role IN ('staff', 'franchise_admin', 'super_admin');
  
  FOREACH v_staff_id IN ARRAY v_staff_ids
  LOOP
    PERFORM create_notification(
      v_staff_id,
      NEW.franchise_id,
      'payment_received',
      '💰 Payment Received',
      'Payment of ₹' || NEW.amount || ' received for booking ' || COALESCE(v_booking_number, 'N/A'),
      'high',
      'payment',
      NEW.id,
      jsonb_build_object(
        'amount', NEW.amount,
        'payment_method', NEW.payment_method,
        'booking_number', v_booking_number,
        'customer_name', v_customer_name
      ),
      '/bookings/' || NEW.booking_id,
      'View Booking'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_payment_received
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_received();

-- ============================================
-- 3. CUSTOMER NOTIFICATIONS
-- ============================================

-- Trigger: New customer created
CREATE OR REPLACE FUNCTION notify_customer_created()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_ids UUID[];
  v_staff_id UUID;
BEGIN
  SELECT ARRAY_AGG(id) INTO v_staff_ids
  FROM users
  WHERE franchise_id = NEW.franchise_id
    AND role IN ('staff', 'franchise_admin', 'super_admin');
  
  FOREACH v_staff_id IN ARRAY v_staff_ids
  LOOP
    PERFORM create_notification(
      v_staff_id,
      NEW.franchise_id,
      'customer_created',
      '👤 New Customer Added',
      'Customer ' || NEW.name || ' has been added to the system.',
      'medium',
      'customer',
      NEW.id,
      jsonb_build_object(
        'customer_name', NEW.name,
        'phone', NEW.phone,
        'city', NEW.city
      ),
      '/customers/' || NEW.id,
      'View Customer'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_customer_created
AFTER INSERT ON customers
FOR EACH ROW
EXECUTE FUNCTION notify_customer_created();

-- ============================================
-- 4. INVENTORY NOTIFICATIONS
-- ============================================

-- Trigger: Low stock alert
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_staff_ids UUID[];
  v_staff_id UUID;
  v_priority VARCHAR;
BEGIN
  -- Only trigger if stock crosses threshold
  IF NEW.stock_available <= NEW.reorder_level AND OLD.stock_available > NEW.reorder_level THEN
    
    v_priority := CASE
      WHEN NEW.stock_available = 0 THEN 'critical'
      WHEN NEW.stock_available <= NEW.reorder_level / 2 THEN 'high'
      ELSE 'medium'
    END;
    
    SELECT ARRAY_AGG(id) INTO v_staff_ids
    FROM users
    WHERE franchise_id = NEW.franchise_id
      AND role IN ('staff', 'franchise_admin', 'super_admin');
    
    FOREACH v_staff_id IN ARRAY v_staff_ids
    LOOP
      PERFORM create_notification(
        v_staff_id,
        NEW.franchise_id,
        CASE WHEN NEW.stock_available = 0 THEN 'stock_out' ELSE 'stock_low' END,
        CASE WHEN NEW.stock_available = 0 THEN '❌ Out of Stock' ELSE '📉 Low Stock Alert' END,
        'Product "' || NEW.name || '" has ' || NEW.stock_available || ' units remaining (reorder level: ' || NEW.reorder_level || ').',
        v_priority,
        'product',
        NEW.id,
        jsonb_build_object(
          'product_name', NEW.name,
          'stock_available', NEW.stock_available,
          'reorder_level', NEW.reorder_level
        ),
        '/inventory/' || NEW.id,
        'Restock Now'
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_low_stock
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION notify_low_stock();

-- ============================================
-- 5. DELIVERY NOTIFICATIONS
-- ============================================

-- Trigger: Delivery assigned to staff
CREATE OR REPLACE FUNCTION notify_delivery_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_booking_number VARCHAR;
  v_customer_name VARCHAR;
BEGIN
  -- Only trigger if assigned_staff_id changes
  IF OLD.assigned_staff_id IS DISTINCT FROM NEW.assigned_staff_id AND NEW.assigned_staff_id IS NOT NULL THEN
    
    SELECT b.booking_number, c.name INTO v_booking_number, v_customer_name
    FROM bookings b
    JOIN customers c ON c.id = b.customer_id
    WHERE b.id = NEW.booking_id;
    
    PERFORM create_notification(
      NEW.assigned_staff_id,
      NEW.franchise_id,
      'delivery_assigned',
      '🚚 Delivery Assigned to You',
      'You have been assigned delivery for booking ' || COALESCE(v_booking_number, 'N/A') || ' (' || COALESCE(v_customer_name, 'customer') || ').',
      'high',
      'delivery',
      NEW.id,
      jsonb_build_object(
        'booking_number', v_booking_number,
        'customer_name', v_customer_name,
        'delivery_date', NEW.delivery_date,
        'address', NEW.delivery_address
      ),
      '/deliveries/' || NEW.id,
      'View Delivery'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_delivery_assigned
AFTER UPDATE ON deliveries
FOR EACH ROW
EXECUTE FUNCTION notify_delivery_assigned();

-- ============================================
-- 6. TASK NOTIFICATIONS
-- ============================================

-- Check if tasks table exists, if not create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks') THEN
    CREATE TABLE tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      assigned_to UUID REFERENCES users(id),
      assigned_by UUID REFERENCES users(id),
      franchise_id UUID REFERENCES franchises(id),
      status VARCHAR(50) DEFAULT 'pending',
      priority VARCHAR(20) DEFAULT 'medium',
      due_date TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE,
      entity_type VARCHAR(50),
      entity_id UUID,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
    CREATE INDEX idx_tasks_franchise_id ON tasks(franchise_id);
    CREATE INDEX idx_tasks_status ON tasks(status);
    
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Users can view franchise tasks"
      ON tasks FOR SELECT
      USING (
        franchise_id IN (SELECT franchise_id FROM users WHERE id = auth.uid())
        OR assigned_to = auth.uid()
      );
  END IF;
END $$;

-- Trigger: Task assigned
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
DECLARE
  v_assigner_name VARCHAR;
BEGIN
  IF NEW.assigned_to IS NOT NULL THEN
    SELECT name INTO v_assigner_name FROM users WHERE id = NEW.assigned_by;
    
    PERFORM create_notification(
      NEW.assigned_to,
      NEW.franchise_id,
      'task_assigned',
      '👷 New Task Assigned',
      COALESCE(v_assigner_name, 'Someone') || ' assigned you a task: "' || NEW.title || '"',
      CASE WHEN NEW.priority = 'high' THEN 'high' ELSE 'medium' END,
      'task',
      NEW.id,
      jsonb_build_object(
        'task_title', NEW.title,
        'assigned_by', v_assigner_name,
        'due_date', NEW.due_date,
        'priority', NEW.priority
      ),
      '/tasks/' || NEW.id,
      'View Task'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_task_assigned
AFTER INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION notify_task_assigned();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Notification triggers created successfully!';
  RAISE NOTICE '✅ Bookings notifications enabled';
  RAISE NOTICE '✅ Payment notifications enabled';
  RAISE NOTICE '✅ Customer notifications enabled';
  RAISE NOTICE '✅ Inventory notifications enabled';
  RAISE NOTICE '✅ Delivery notifications enabled';
  RAISE NOTICE '✅ Task notifications enabled';
END $$;
