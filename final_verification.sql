-- Final verification of coupon system
SELECT 
  'FINAL VERIFICATION' as status,
  code,
  discount_type,
  discount_value,
  franchise_id,
  created_at
FROM coupons
ORDER BY created_at DESC;
