-- Check if franchises table has data
SELECT COUNT(*) as franchise_count FROM franchises;

-- Check if coupons table exists and has data
SELECT COUNT(*) as coupon_count FROM coupons;

-- Check coupon columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'coupons' AND table_schema = 'public' 
ORDER BY ordinal_position;
