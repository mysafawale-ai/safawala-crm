-- =====================================================
-- STEP 3: ENABLE RLS AND CREATE POLICIES
-- Run this after step 2
-- =====================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications (FRANCHISE ISOLATED)
CREATE POLICY "Users can view franchise notifications"
  ON notifications FOR SELECT
  USING (
    user_id = auth.uid()
    AND
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own franchise notifications"
  ON notifications FOR UPDATE
  USING (
    user_id = auth.uid()
    AND
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (
    user_id = auth.uid()
  );

-- RLS Policies for notification preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for activity logs (FRANCHISE ISOLATED)
CREATE POLICY "Users can view franchise activity logs"
  ON activity_logs FOR SELECT
  USING (
    franchise_id IN (
      SELECT franchise_id FROM users WHERE id = auth.uid()
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Step 3/4 Complete: RLS enabled with franchise isolation!';
  RAISE NOTICE '📝 Next: Run 04_create_functions.sql';
END $$;
