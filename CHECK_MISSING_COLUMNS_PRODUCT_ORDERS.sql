-- COMPREHENSIVE CRUD TEST - Find ALL Missing Fields in product_orders
-- This will attempt to insert all fields that the application tries to use

-- Step 1: Check current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'product_orders'
ORDER BY ordinal_position;

-- Step 2: Test INSERT with ALL fields the app might use
-- This will fail on missing columns and tell us exactly what's missing

-- First, let's see what the trigger expects
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'product_orders';

-- Step 3: Get the trigger function definition to see what fields it accesses
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as definition
FROM pg_proc
WHERE proname LIKE '%delivery%';

-- Step 4: Compare with what app/create-product-order/page.tsx tries to insert
-- Based on line 528-560, the app tries to insert these fields:

/*
Expected fields from create-product-order page.tsx:
- order_number ✅
- customer_id ✅
- franchise_id ✅
- booking_type ✅
- event_type ✅
- event_participant ✅
- payment_type ✅
- event_date ✅
- delivery_date ✅
- return_date ✅
- venue_address ✅
- groom_name ✅
- groom_whatsapp ✅
- groom_address ✅
- bride_name ✅
- bride_whatsapp ✅
- bride_address ✅
- notes ✅
- discount_percentage ❓
- discount_amount ❓
- coupon_code ❓
- coupon_discount ❓
- tax_amount ✅
- subtotal_amount ✅
- total_amount ✅
- security_deposit ❓ (MISSING - we know this)
- amount_paid ✅
- pending_amount ✅
- status ✅
- is_quote ❓
- sales_closed_by_id ❓ (MISSING - we know this)
- created_by ❓
- payment_method ❓
*/

-- Step 5: Check for commonly missing fields
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'security_deposit') 
        THEN '✅ security_deposit EXISTS'
        ELSE '❌ security_deposit MISSING'
    END as security_deposit_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'delivery_address') 
        THEN '✅ delivery_address EXISTS'
        ELSE '❌ delivery_address MISSING (trigger needs this)'
    END as delivery_address_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'sales_closed_by_id') 
        THEN '✅ sales_closed_by_id EXISTS'
        ELSE '❌ sales_closed_by_id MISSING'
    END as sales_closed_by_id_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'is_quote') 
        THEN '✅ is_quote EXISTS'
        ELSE '❌ is_quote MISSING'
    END as is_quote_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'discount_percentage') 
        THEN '✅ discount_percentage EXISTS'
        ELSE '❌ discount_percentage MISSING'
    END as discount_percentage_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'discount_amount') 
        THEN '✅ discount_amount EXISTS'
        ELSE '❌ discount_amount MISSING'
    END as discount_amount_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'coupon_code') 
        THEN '✅ coupon_code EXISTS'
        ELSE '❌ coupon_code MISSING'
    END as coupon_code_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'coupon_discount') 
        THEN '✅ coupon_discount EXISTS'
        ELSE '❌ coupon_discount MISSING'
    END as coupon_discount_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'created_by') 
        THEN '✅ created_by EXISTS'
        ELSE '❌ created_by MISSING'
    END as created_by_check,
    
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_orders' AND column_name = 'payment_method') 
        THEN '✅ payment_method EXISTS'
        ELSE '❌ payment_method MISSING'
    END as payment_method_check;

-- Step 6: List ALL columns that currently exist
SELECT 
    'Current product_orders columns:' as info,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as existing_columns
FROM information_schema.columns 
WHERE table_name = 'product_orders';

-- Step 7: Check what the delivery trigger expects
SELECT 
    'Checking delivery trigger function...' as info;
