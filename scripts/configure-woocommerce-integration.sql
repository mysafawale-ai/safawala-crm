-- Adding WooCommerce configuration with provided credentials
INSERT INTO integration_settings (integration_name, store_url, consumer_key, consumer_secret, is_active, created_at, updated_at)
VALUES (
  'WooCommerce',
  'https://safawala.com',
  'ck_b0989eadb72d75ec0ba524e7af24ca476f62e5af',
  'cs_af9b5e8a6c4d74b7e360f3ea264f55c7a9fb0ef4',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (integration_name) 
DO UPDATE SET 
  store_url = EXCLUDED.store_url,
  consumer_key = EXCLUDED.consumer_key,
  consumer_secret = EXCLUDED.consumer_secret,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
