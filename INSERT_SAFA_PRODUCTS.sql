-- Insert Safa Products (Designer Sarees Collection)
-- Franchise: vadodara@safawala.com
-- Category: Safa (main category - no subcategory)
-- All quantities set to 100, pricing set to 100 for demo

-- First, get the franchise_id and category_id
-- franchise_id for vadodara@safawala.com (you may need to adjust this)
-- category_id for "Safa" main category

-- Package 1 – Leheriya & Bandhani Collection
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW1001 - Tiger Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW1002 - Yellow Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW1003 - Red Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW1004 - Orange Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW1007 - Rani Bandhani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW1010 - Pink Bandhani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW1012 - Red Bandhani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 2 – Rajwadi Collection
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW2001 - Red Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2002 - Maroon Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2003 - Pink Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2004 - Peach Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2006 - C-Green Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2007 - Rani/Wine Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2009 - Light Golden Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW2010 - Dark Golden Rajwadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 3 – Jodhpuri & Bandhani Mix
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW3001 - Jodhpuri Floral Off-White', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW3002 - Jodhpuri Pachrangi Bandhani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW3003 - Pachrangi Modi Bandhani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW3004 - Pachrangi Plain', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW3005 - Anant Ambani Red', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW3006 - Chunadi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW3007 - Anant Ambani Rani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 4 – Keri & Chanderi Collection
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW4001 - Peach Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4002 - Red Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4003 - Pista Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4004 - Sky Blue Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4005 - Golden Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4006 - Baby Pink Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4007 - Chanderi Multi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW4008 - Maroon Keri', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 5 – Chanderi, Sabyasachi & Patola Styles
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
-- Chanderi Leheriya Collection
('SW5001 - Pista Chanderi Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5002 - Off-White Chanderi Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5004 - Golden Chanderi Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5008 - Pink Chanderi Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5011 - Peach Chanderi Leheriya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
-- Sabyasachi Collection
('SW5003 - Sabyasachi C-Green', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5007 - Brown Sabyasachi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5009 - Peach Sabyasachi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5012 - Mehndi Sabyasachi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
-- Patola Style
('SW5005 - Peach Patola', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW5006 - White Patola', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 6 – Multi & Plain Designer Collection
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW6001 - Peach Pista Multi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW6002 - Ambani Plain', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW6003 - Pink Multi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW6005 - Orange Multi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW6006 - Rani Multi', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 7 – Adani & Royal Ambani Series
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW7001 - Adani Golden', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7002 - Adani Blue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7003 - Adani Pista', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7004 - Adani Peach', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7005 - Royal Ambani Blue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7006 - Royal Ambani Pink', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7008 - Royal Ambani Coffee', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW7009 - Royal Ambani', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 8 – J.J. Valaya Collection
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW8001 - J.J. Valaya Pink', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8002 - Golden J.J. Valaya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8003 - J.J. Valaya Grey', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8004 - Off-White J.J. Valaya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8005 - Green J.J. Valaya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8006 - Red J.J. Valaya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8007 - Maroon J.J. Valaya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW8008 - Peach J.J. Valaya', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());

-- Package 9 – Tissue Collection
INSERT INTO products (name, category_id, franchise_id, rental_price, sale_price, security_deposit, stock_available, created_at) VALUES
('SW9001 - Silver Tissue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW9002 - Peach Tissue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW9003 - Green Tissue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW9004 - Golden Tissue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW()),
('SW9005 - Onion Pink Tissue', (SELECT id FROM product_categories WHERE name = 'Safa' AND parent_id IS NULL LIMIT 1), (SELECT id FROM franchises WHERE email = 'vadodara@safawala.com' LIMIT 1), 100, 100, 50, 100, NOW());
