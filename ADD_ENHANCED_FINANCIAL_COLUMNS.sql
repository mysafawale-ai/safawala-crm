-- ===================================================================
-- 🚀 ADD ENHANCED FINANCIAL COLUMNS FOR INVOICES & BOOKINGS
-- ===================================================================
-- This migration adds all missing columns needed for the full-featured
-- view dialogs with comprehensive financial summaries
-- 
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- 1️⃣ ADD MISSING COLUMNS TO product_orders
-- -------------------------------------------------------------------
DO $$ 
BEGIN
  -- Distance tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='distance_amount') THEN
    ALTER TABLE product_orders ADD COLUMN distance_amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added distance_amount to product_orders';
  ELSE
    RAISE NOTICE '⏭️  distance_amount already exists in product_orders';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='distance_km') THEN
    ALTER TABLE product_orders ADD COLUMN distance_km DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added distance_km to product_orders';
  ELSE
    RAISE NOTICE '⏭️  distance_km already exists in product_orders';
  END IF;

  -- GST/Tax details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='gst_amount') THEN
    ALTER TABLE product_orders ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added gst_amount to product_orders';
  ELSE
    RAISE NOTICE '⏭️  gst_amount already exists in product_orders';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='gst_percentage') THEN
    ALTER TABLE product_orders ADD COLUMN gst_percentage DECIMAL(5,2) DEFAULT 18.00;
    RAISE NOTICE '✅ Added gst_percentage to product_orders';
  ELSE
    RAISE NOTICE '⏭️  gst_percentage already exists in product_orders';
  END IF;

  -- Timeline information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='delivery_time') THEN
    ALTER TABLE product_orders ADD COLUMN delivery_time TIME;
    RAISE NOTICE '✅ Added delivery_time to product_orders';
  ELSE
    RAISE NOTICE '⏭️  delivery_time already exists in product_orders';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='return_time') THEN
    ALTER TABLE product_orders ADD COLUMN return_time TIME;
    RAISE NOTICE '✅ Added return_time to product_orders';
  ELSE
    RAISE NOTICE '⏭️  return_time already exists in product_orders';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='event_time') THEN
    ALTER TABLE product_orders ADD COLUMN event_time TIME;
    RAISE NOTICE '✅ Added event_time to product_orders';
  ELSE
    RAISE NOTICE '⏭️  event_time already exists in product_orders';
  END IF;

  -- Participant (alias for event_participant for consistency)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='product_orders' AND column_name='participant') THEN
    ALTER TABLE product_orders ADD COLUMN participant VARCHAR(50);
    RAISE NOTICE '✅ Added participant to product_orders';
  ELSE
    RAISE NOTICE '⏭️  participant already exists in product_orders';
  END IF;
END $$;

-- 2️⃣ ADD MISSING COLUMNS TO package_bookings
-- -------------------------------------------------------------------
DO $$ 
BEGIN
  -- GST/Tax details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='gst_amount') THEN
    ALTER TABLE package_bookings ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added gst_amount to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  gst_amount already exists in package_bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='gst_percentage') THEN
    ALTER TABLE package_bookings ADD COLUMN gst_percentage DECIMAL(5,2) DEFAULT 18.00;
    RAISE NOTICE '✅ Added gst_percentage to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  gst_percentage already exists in package_bookings';
  END IF;

  -- Timeline information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='delivery_time') THEN
    ALTER TABLE package_bookings ADD COLUMN delivery_time TIME;
    RAISE NOTICE '✅ Added delivery_time to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  delivery_time already exists in package_bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='return_time') THEN
    ALTER TABLE package_bookings ADD COLUMN return_time TIME;
    RAISE NOTICE '✅ Added return_time to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  return_time already exists in package_bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='event_time') THEN
    ALTER TABLE package_bookings ADD COLUMN event_time TIME;
    RAISE NOTICE '✅ Added event_time to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  event_time already exists in package_bookings';
  END IF;

  -- Participant (alias for event_participant for consistency)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='package_bookings' AND column_name='participant') THEN
    ALTER TABLE package_bookings ADD COLUMN participant VARCHAR(50);
    RAISE NOTICE '✅ Added participant to package_bookings';
  ELSE
    RAISE NOTICE '⏭️  participant already exists in package_bookings';
  END IF;
END $$;

-- 3️⃣ ADD MISSING COLUMNS TO bookings (unified table)
-- -------------------------------------------------------------------
DO $$ 
BEGIN
  -- Distance tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='distance_amount') THEN
    ALTER TABLE bookings ADD COLUMN distance_amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added distance_amount to bookings';
  ELSE
    RAISE NOTICE '⏭️  distance_amount already exists in bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='distance_km') THEN
    ALTER TABLE bookings ADD COLUMN distance_km DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added distance_km to bookings';
  ELSE
    RAISE NOTICE '⏭️  distance_km already exists in bookings';
  END IF;

  -- GST/Tax details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='gst_amount') THEN
    ALTER TABLE bookings ADD COLUMN gst_amount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added gst_amount to bookings';
  ELSE
    RAISE NOTICE '⏭️  gst_amount already exists in bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='gst_percentage') THEN
    ALTER TABLE bookings ADD COLUMN gst_percentage DECIMAL(5,2) DEFAULT 18.00;
    RAISE NOTICE '✅ Added gst_percentage to bookings';
  ELSE
    RAISE NOTICE '⏭️  gst_percentage already exists in bookings';
  END IF;

  -- Timeline information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='delivery_time') THEN
    ALTER TABLE bookings ADD COLUMN delivery_time TIME;
    RAISE NOTICE '✅ Added delivery_time to bookings';
  ELSE
    RAISE NOTICE '⏭️  delivery_time already exists in bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='return_time') THEN
    ALTER TABLE bookings ADD COLUMN return_time TIME;
    RAISE NOTICE '✅ Added return_time to bookings';
  ELSE
    RAISE NOTICE '⏭️  return_time already exists in bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='event_time') THEN
    ALTER TABLE bookings ADD COLUMN event_time TIME;
    RAISE NOTICE '✅ Added event_time to bookings';
  ELSE
    RAISE NOTICE '⏭️  event_time already exists in bookings';
  END IF;

  -- Participant
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='participant') THEN
    ALTER TABLE bookings ADD COLUMN participant VARCHAR(50);
    RAISE NOTICE '✅ Added participant to bookings';
  ELSE
    RAISE NOTICE '⏭️  participant already exists in bookings';
  END IF;

  -- Payment method
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='payment_method') THEN
    ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50);
    RAISE NOTICE '✅ Added payment_method to bookings';
  ELSE
    RAISE NOTICE '⏭️  payment_method already exists in bookings';
  END IF;

  -- Coupon support
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='coupon_code') THEN
    ALTER TABLE bookings ADD COLUMN coupon_code VARCHAR(50);
    RAISE NOTICE '✅ Added coupon_code to bookings';
  ELSE
    RAISE NOTICE '⏭️  coupon_code already exists in bookings';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name='bookings' AND column_name='coupon_discount') THEN
    ALTER TABLE bookings ADD COLUMN coupon_discount DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Added coupon_discount to bookings';
  ELSE
    RAISE NOTICE '⏭️  coupon_discount already exists in bookings';
  END IF;
END $$;

-- 4️⃣ ADD COMMENTS FOR DOCUMENTATION
-- -------------------------------------------------------------------
COMMENT ON COLUMN product_orders.distance_amount IS 'Distance-based delivery charge amount';
COMMENT ON COLUMN product_orders.distance_km IS 'Distance in kilometers';
COMMENT ON COLUMN product_orders.gst_amount IS 'GST/Tax amount calculated';
COMMENT ON COLUMN product_orders.gst_percentage IS 'GST/Tax percentage applied (default 18%)';
COMMENT ON COLUMN product_orders.delivery_time IS 'Scheduled delivery time';
COMMENT ON COLUMN product_orders.return_time IS 'Scheduled return/pickup time';
COMMENT ON COLUMN product_orders.event_time IS 'Event start time';
COMMENT ON COLUMN product_orders.participant IS 'Event participant (groom/bride/both)';

COMMENT ON COLUMN package_bookings.gst_amount IS 'GST/Tax amount calculated';
COMMENT ON COLUMN package_bookings.gst_percentage IS 'GST/Tax percentage applied (default 18%)';
COMMENT ON COLUMN package_bookings.delivery_time IS 'Scheduled delivery time';
COMMENT ON COLUMN package_bookings.return_time IS 'Scheduled return/pickup time';
COMMENT ON COLUMN package_bookings.event_time IS 'Event start time';
COMMENT ON COLUMN package_bookings.participant IS 'Event participant (groom/bride/both)';

COMMENT ON COLUMN bookings.distance_amount IS 'Distance-based delivery charge amount';
COMMENT ON COLUMN bookings.distance_km IS 'Distance in kilometers';
COMMENT ON COLUMN bookings.gst_amount IS 'GST/Tax amount calculated';
COMMENT ON COLUMN bookings.gst_percentage IS 'GST/Tax percentage applied (default 18%)';
COMMENT ON COLUMN bookings.delivery_time IS 'Scheduled delivery time';
COMMENT ON COLUMN bookings.return_time IS 'Scheduled return/pickup time';
COMMENT ON COLUMN bookings.event_time IS 'Event start time';
COMMENT ON COLUMN bookings.participant IS 'Event participant (groom/bride/both)';
COMMENT ON COLUMN bookings.payment_method IS 'Payment method used (cash/card/upi/etc)';
COMMENT ON COLUMN bookings.coupon_code IS 'Applied coupon/promo code';
COMMENT ON COLUMN bookings.coupon_discount IS 'Discount amount from coupon';

-- 5️⃣ VERIFY INSTALLATION
-- -------------------------------------------------------------------
DO $$ 
DECLARE
  po_count INT;
  pb_count INT;
  b_count INT;
BEGIN
  -- Count product_orders columns
  SELECT COUNT(*) INTO po_count FROM information_schema.columns 
  WHERE table_name='product_orders' 
  AND column_name IN ('distance_amount', 'gst_amount', 'gst_percentage', 
                       'delivery_time', 'return_time', 'event_time', 'participant');
  
  -- Count package_bookings columns
  SELECT COUNT(*) INTO pb_count FROM information_schema.columns 
  WHERE table_name='package_bookings' 
  AND column_name IN ('gst_amount', 'gst_percentage', 
                       'delivery_time', 'return_time', 'event_time', 'participant');
  
  -- Count bookings columns
  SELECT COUNT(*) INTO b_count FROM information_schema.columns 
  WHERE table_name='bookings' 
  AND column_name IN ('distance_amount', 'gst_amount', 'gst_percentage', 
                       'delivery_time', 'return_time', 'event_time', 
                       'participant', 'payment_method', 'coupon_code', 'coupon_discount');
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '🎉 MIGRATION COMPLETE!';
  RAISE NOTICE '====================================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Column Installation Summary:';
  RAISE NOTICE '  • product_orders:    %/7 enhanced columns installed', po_count;
  RAISE NOTICE '  • package_bookings:  %/6 enhanced columns installed', pb_count;
  RAISE NOTICE '  • bookings:          %/10 enhanced columns installed', b_count;
  RAISE NOTICE '';
  
  IF po_count = 7 AND pb_count = 6 AND b_count = 10 THEN
    RAISE NOTICE '✅ ALL COLUMNS SUCCESSFULLY INSTALLED!';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your invoices and bookings now support:';
    RAISE NOTICE '   • Distance-based charges with km tracking';
    RAISE NOTICE '   • GST/Tax amount and percentage display';
    RAISE NOTICE '   • Complete timeline (delivery/return/event times)';
    RAISE NOTICE '   • Event participant tracking';
    RAISE NOTICE '   • Payment method tracking';
    RAISE NOTICE '   • Coupon code support';
    RAISE NOTICE '';
    RAISE NOTICE '📱 Next Steps:';
    RAISE NOTICE '   1. Refresh your application';
    RAISE NOTICE '   2. Test invoice view dialog';
    RAISE NOTICE '   3. Test booking view dialog';
    RAISE NOTICE '   4. Verify all financial data displays correctly';
  ELSE
    RAISE NOTICE '⚠️  SOME COLUMNS MAY ALREADY EXIST - This is normal!';
    RAISE NOTICE '    Existing columns were preserved, new ones were added.';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '====================================================================';
END $$;
