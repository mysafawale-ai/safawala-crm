-- =====================================================
-- STEP 1: CREATE NOTIFICATION TABLES
-- Run this first
-- =====================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User & Franchise
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  
  -- Notification Details
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low', 'info')),
  
  -- Related Entity
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Actions
  action_url TEXT,
  action_label VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Channel preferences
  in_app_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  
  -- Category preferences
  preferences JSONB DEFAULT '{
    "bookings": true,
    "customers": true,
    "payments": true,
    "inventory": true,
    "deliveries": true,
    "tasks": true,
    "system": true
  }'::jsonb,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 3. Create activity log table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Actor
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  
  -- Action
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  entity_name VARCHAR(255),
  
  -- Details
  description TEXT NOT NULL,
  changes JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Step 1/4 Complete: Notification tables created!';
  RAISE NOTICE '📝 Next: Run 02_create_indexes.sql';
END $$;
