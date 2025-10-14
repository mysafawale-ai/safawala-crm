-- =====================================================
-- DEBUG: Check Notifications
-- Run this to see if notifications exist in your database
-- =====================================================

-- 1. Check if you have any notifications
SELECT 
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_notifications
FROM notifications;

-- 2. See your user_id
SELECT id, email, name, franchise_id 
FROM users 
WHERE email = 'mysafawale@gmail.com';

-- 3. See all your notifications
SELECT 
  id,
  type,
  title,
  message,
  priority,
  is_read,
  is_archived,
  created_at
FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'mysafawale@gmail.com')
ORDER BY created_at DESC;

-- 4. If you see no notifications above, run this to create one directly:
-- (Uncomment the lines below by removing the -- at the start)

-- INSERT INTO notifications (
--   user_id,
--   franchise_id,
--   type,
--   title,
--   message,
--   priority,
--   is_read,
--   is_archived
-- )
-- SELECT 
--   u.id,
--   u.franchise_id,
--   'test',
--   '🎉 Manual Test Notification',
--   'This notification was created manually. If you can see this in the app, everything works!',
--   'high',
--   false,
--   false
-- FROM users u
-- WHERE u.email = 'mysafawale@gmail.com';
