-- Insert 3 demo coupons for Vadodara franchise (1a518dde-85b7-44ef-8bc4-092f53ddfd99)
INSERT INTO coupons (code, discount_type, discount_value, franchise_id, created_at, updated_at)
VALUES
('VADO10', 'percentage', 10.00, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', NOW(), NOW()),
('VADOFLAT', 'flat', 1.00, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', NOW(), NOW()),
('VADOFREE', 'free_shipping', 0.00, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Verify insertion
SELECT code, discount_type, discount_value, franchise_id FROM coupons 
WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99' 
ORDER BY created_at DESC;
