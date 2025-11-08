-- Add Products for Your Franchise
-- Franchise ID: 1a518dde-85b7-44ef-8bc4-092f53ddfd99

-- First, create/get the categories
INSERT INTO product_categories (name, is_active, created_at)
VALUES
  ('Brooch', true, NOW()),
  ('Mala', true, NOW()),
  ('Dupatta', true, NOW()),
  ('Katar', true, NOW()),
  ('Mod', true, NOW()),
  ('Pocket Brooch', true, NOW()),
  ('Feathers', true, NOW()),
  ('Groom Safa', true, NOW()),
  ('Scarf', true, NOW()),
  ('Belt', true, NOW()),
  ('Talwar', true, NOW()),
  ('Safa', true, NOW()),
  ('Talwar Belt', true, NOW()),
  ('Tilak', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert Safa Products (Most Important for your business!)
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Red Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional red safa for groom', 'SAF-RED-001', 'SAF-001' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Yellow Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional yellow safa for groom', 'SAF-YEL-001', 'SAF-002' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Orange Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional orange safa for groom', 'SAF-ORG-001', 'SAF-003' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Maroon Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium maroon safa with embroidery', 'SAF-MAR-001', 'SAF-004' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Gold Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium gold safa with jeweled work', 'SAF-GOLD-001', 'SAF-005' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Green Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium green safa for special look', 'SAF-GRN-001', 'SAF-006' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Black Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1000, 10, NOW(), 'Deluxe black safa with premium finish', 'SAF-BLK-001', 'SAF-007' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - White Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1000, 10, NOW(), 'Deluxe white safa for formal events', 'SAF-WHT-001', 'SAF-008' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Safa - Multi-color Elite', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1500, 8, NOW(), 'Elite multicolor safa with jewels', 'SAF-MULTI-001', 'SAF-009' FROM product_categories WHERE name = 'Safa' LIMIT 1;

-- Insert Talwar Belt Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Talwar Belt - Golden', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 400, 15, NOW(), 'Golden talwar belt for formal wear', 'BELT-GOLD-001', 'BELT-001' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Talwar Belt - Silver', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 400, 15, NOW(), 'Silver talwar belt with traditional design', 'BELT-SLV-001', 'BELT-002' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Talwar Belt - Black Leather', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 12, NOW(), 'Black leather talwar belt premium', 'BELT-BLK-001', 'BELT-003' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

-- Insert Brooch Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Brooch - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 10, NOW(), 'Simple traditional brooch', 'BROCH-BAS-001', 'BROCH-001' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Brooch - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1050, 6, NOW(), 'Premium brooch with fine craft', 'BROCH-PREM-001', 'BROCH-002' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Brooch - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1450, 4, NOW(), 'Deluxe brooch with embellishments', 'BROCH-DEL-001', 'BROCH-003' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

-- Insert Mala Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Mala - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1150, 12, NOW(), 'Traditional mala for daily use', 'MALA-BAS-001', 'MALA-001' FROM product_categories WHERE name = 'Mala' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Mala - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1950, 8, NOW(), 'Premium mala with refined details', 'MALA-PREM-001', 'MALA-002' FROM product_categories WHERE name = 'Mala' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Mala - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 2550, 6, NOW(), 'Deluxe mala for special occasions', 'MALA-DEL-001', 'MALA-003' FROM product_categories WHERE name = 'Mala' LIMIT 1;

-- Insert Dupatta Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Dupatta - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1999, 15, NOW(), 'Simple dupatta for everyday wear', 'DUP-BAS-001', 'DUP-001' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Dupatta - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 2950, 10, NOW(), 'Premium dupatta with fine embroidery', 'DUP-PREM-001', 'DUP-002' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Dupatta - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 3250, 8, NOW(), 'Deluxe dupatta with intricate work', 'DUP-DEL-001', 'DUP-003' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

-- Insert Katar Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Katar - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 20, NOW(), 'Simple katar for everyday use', 'KTAR-BAS-001', 'KTAR-001' FROM product_categories WHERE name = 'Katar' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Katar - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1150, 12, NOW(), 'Premium katar with fine details', 'KTAR-PREM-001', 'KTAR-002' FROM product_categories WHERE name = 'Katar' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Katar - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1750, 8, NOW(), 'Deluxe katar with ornate design', 'KTAR-DEL-001', 'KTAR-003' FROM product_categories WHERE name = 'Katar' LIMIT 1;

-- Insert Mod Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Mod - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 350, 25, NOW(), 'Simple mod for everyday styling', 'MOD-BAS-001', 'MOD-001' FROM product_categories WHERE name = 'Mod' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Mod - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 850, 15, NOW(), 'Premium mod with enhanced design', 'MOD-PREM-001', 'MOD-002' FROM product_categories WHERE name = 'Mod' LIMIT 1;

-- Insert Tilak Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Tilak - Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 150, 30, NOW(), 'Traditional tilak for ceremonies', 'TILAK-001', 'TILAK-001' FROM product_categories WHERE name = 'Tilak' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode, product_code)
SELECT 'Tilak - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 250, 20, NOW(), 'Premium tilak with jeweled design', 'TILAK-002', 'TILAK-002' FROM product_categories WHERE name = 'Tilak' LIMIT 1;

-- Done! All products added for 1a518dde-85b7-44ef-8bc4-092f53ddfd99
