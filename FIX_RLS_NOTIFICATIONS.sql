-- =====================================================
-- FIX: Temporary RLS Bypass for Testing
-- Run this if notifications exist but you can't see them
-- =====================================================

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'notifications';

-- Temporarily allow all SELECT (for debugging only)
DROP POLICY IF EXISTS "Users can view franchise notifications" ON notifications;

CREATE POLICY "Users can view franchise notifications"
  ON notifications FOR SELECT
  USING (true);  -- Temporarily allow all (for testing)

-- After this, try refreshing your app
-- Once it works, we can fix the RLS policy properly
