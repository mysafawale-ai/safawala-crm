-- Insert demo coupons for Vadodara franchise
INSERT INTO coupons (code, discount_type, discount_value, franchise_id, created_at, updated_at)
VALUES
('new10', 'percentage', 10.00, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', NOW(), NOW()),
('flat1', 'flat', 1.00, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', NOW(), NOW()),
('freeship', 'free_shipping', 0.00, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', NOW(), NOW());
