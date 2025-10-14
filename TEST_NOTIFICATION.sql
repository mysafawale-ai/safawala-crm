-- =====================================================
-- TEST NOTIFICATION - Quick Test Script
-- Run this in Supabase SQL Editor to create a test notification
-- =====================================================

-- Get your user_id and franchise_id (update the email below)
-- Replace 'your-email@example.com' with your actual login email
DO $$
DECLARE
  v_user_id UUID;
  v_franchise_id UUID;
BEGIN
  -- Get your user details (CHANGE THIS EMAIL!)
  SELECT id, franchise_id INTO v_user_id, v_franchise_id
  FROM users
  WHERE email = 'your-email@example.com'  -- ⚠️ CHANGE THIS!
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found! Please update the email in the script.';
    RAISE NOTICE 'Run this query to see all users: SELECT id, email, name FROM users;';
  ELSE
    -- Create a test notification
    PERFORM create_notification(
      v_user_id,
      v_franchise_id,
      'test_notification',
      '🧪 Test Notification',
      'This is a test notification to verify the system is working correctly! If you see this, everything is set up properly.',
      'high',
      'system',
      NULL,
      jsonb_build_object('test', true, 'timestamp', NOW()),
      '/dashboard',
      'Go to Dashboard'
    );
    
    RAISE NOTICE '✅ Test notification created successfully!';
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Franchise ID: %', v_franchise_id;
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next steps:';
    RAISE NOTICE '1. Refresh your app (Cmd+Shift+R or F5)';
    RAISE NOTICE '2. Look for the notification bell 🔔 in the header';
    RAISE NOTICE '3. Click it to see your test notification';
    RAISE NOTICE '4. Or go to /notifications page';
  END IF;
END $$;
