-- COMPREHENSIVE ANALYSIS - Check ALL Missing Fields in Both Tables
-- Comparing what the apps try to insert vs what columns exist

-- ============================================================================
-- PART 1: CHECK PRODUCT_ORDERS TABLE
-- ============================================================================

SELECT '=== PRODUCT_ORDERS TABLE ANALYSIS ===' as section;

-- Fields that app/create-product-order/page.tsx tries to insert (lines 528-562):
WITH app_fields AS (
  SELECT unnest(ARRAY[
    'order_number', 'customer_id', 'franchise_id', 'booking_type', 'event_type',
    'event_participant', 'payment_type', 'event_date', 'delivery_date', 'return_date',
    'venue_address', 'groom_name', 'groom_whatsapp', 'groom_address', 'bride_name',
    'bride_whatsapp', 'bride_address', 'notes', 'payment_method', 'discount_amount',
    'coupon_code', 'coupon_discount', 'tax_amount', 'subtotal_amount', 'total_amount',
    'security_deposit', 'amount_paid', 'pending_amount', 'status', 'is_quote',
    'sales_closed_by_id', 'created_by', 'delivery_address'
  ]) AS field_name
),
db_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'product_orders'
)
SELECT 
  app_fields.field_name,
  CASE 
    WHEN db_columns.column_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM app_fields
LEFT JOIN db_columns ON app_fields.field_name = db_columns.column_name
ORDER BY 
  CASE WHEN db_columns.column_name IS NULL THEN 0 ELSE 1 END,
  app_fields.field_name;

-- ============================================================================
-- PART 2: CHECK PACKAGE_BOOKINGS TABLE
-- ============================================================================

SELECT '=== PACKAGE_BOOKINGS TABLE ANALYSIS ===' as section;

-- Fields that app/book-package/page.tsx tries to insert (lines 620-650):
WITH app_fields AS (
  SELECT unnest(ARRAY[
    'package_number', 'is_quote', 'customer_id', 'franchise_id', 'event_type',
    'event_participant', 'payment_type', 'event_date', 'delivery_date', 'return_date',
    'venue_address', 'groom_name', 'groom_whatsapp', 'groom_address', 'bride_name',
    'bride_whatsapp', 'bride_address', 'notes', 'tax_amount', 'subtotal_amount',
    'total_amount', 'amount_paid', 'pending_amount', 'status', 'sales_closed_by_id',
    'use_custom_pricing', 'custom_package_price', 'custom_deposit', 'coupon_code',
    'coupon_discount', 'discount_amount', 'payment_method', 'created_by', 'security_deposit'
  ]) AS field_name
),
db_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'package_bookings'
)
SELECT 
  app_fields.field_name,
  CASE 
    WHEN db_columns.column_name IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM app_fields
LEFT JOIN db_columns ON app_fields.field_name = db_columns.column_name
ORDER BY 
  CASE WHEN db_columns.column_name IS NULL THEN 0 ELSE 1 END,
  app_fields.field_name;

-- ============================================================================
-- PART 3: LIST ALL EXISTING COLUMNS
-- ============================================================================

SELECT '=== CURRENT PRODUCT_ORDERS COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'product_orders'
ORDER BY ordinal_position;

SELECT '=== CURRENT PACKAGE_BOOKINGS COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'package_bookings'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 4: CHECK DELIVERY TRIGGER
-- ============================================================================

SELECT '=== DELIVERY TRIGGER FUNCTION ===' as section;
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname = 'auto_create_delivery';

-- ============================================================================
-- PART 5: SUMMARY OF ISSUES
-- ============================================================================

SELECT '=== SUMMARY ===' as section;

SELECT 
  'Total fields app tries to insert in product_orders' as metric,
  COUNT(*) as count
FROM (
  SELECT unnest(ARRAY[
    'order_number', 'customer_id', 'franchise_id', 'booking_type', 'event_type',
    'event_participant', 'payment_type', 'event_date', 'delivery_date', 'return_date',
    'venue_address', 'groom_name', 'groom_whatsapp', 'groom_address', 'bride_name',
    'bride_whatsapp', 'bride_address', 'notes', 'payment_method', 'discount_amount',
    'coupon_code', 'coupon_discount', 'tax_amount', 'subtotal_amount', 'total_amount',
    'security_deposit', 'amount_paid', 'pending_amount', 'status', 'is_quote',
    'sales_closed_by_id', 'created_by', 'delivery_address'
  ]) AS field
) t

UNION ALL

SELECT 
  'Total fields app tries to insert in package_bookings' as metric,
  COUNT(*) as count
FROM (
  SELECT unnest(ARRAY[
    'package_number', 'is_quote', 'customer_id', 'franchise_id', 'event_type',
    'event_participant', 'payment_type', 'event_date', 'delivery_date', 'return_date',
    'venue_address', 'groom_name', 'groom_whatsapp', 'groom_address', 'bride_name',
    'bride_whatsapp', 'bride_address', 'notes', 'tax_amount', 'subtotal_amount',
    'total_amount', 'amount_paid', 'pending_amount', 'status', 'sales_closed_by_id',
    'use_custom_pricing', 'custom_package_price', 'custom_deposit', 'coupon_code',
    'coupon_discount', 'discount_amount', 'payment_method', 'created_by', 'security_deposit'
  ]) AS field
) t;
