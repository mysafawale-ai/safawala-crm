-- Add ALL 40 Products for Your Franchise
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

-- ============================================
-- INSERT SAFA PRODUCTS (9 TOTAL)
-- ============================================

-- Basic Safas (3) - ₹500 each
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Red Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional red safa for groom', '80001001001' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Yellow Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional yellow safa for groom', '80001001002' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Orange Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional orange safa for groom', '80001001003' FROM product_categories WHERE name = 'Safa' LIMIT 1;

-- Premium Safas (3) - ₹750 each
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Maroon Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium maroon safa with embroidery', '80001002001' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Gold Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium gold safa with jeweled work', '80001002002' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Green Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium green safa for special look', '80001002003' FROM product_categories WHERE name = 'Safa' LIMIT 1;

-- Deluxe Safas (2) - ₹1000 each
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Black Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1000, 10, NOW(), 'Deluxe black safa with premium finish', '80001003001' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - White Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1000, 10, NOW(), 'Deluxe white safa for formal events', '80001003002' FROM product_categories WHERE name = 'Safa' LIMIT 1;

-- Elite Safa (1) - ₹1500
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Safa - Multi-color Elite', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1500, 8, NOW(), 'Elite multicolor safa with jewels', '80001004001' FROM product_categories WHERE name = 'Safa' LIMIT 1;

-- ============================================
-- INSERT TALWAR BELT PRODUCTS (3 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Talwar Belt - Golden', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 400, 15, NOW(), 'Golden talwar belt for formal wear', '80002001001' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Talwar Belt - Silver', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 400, 15, NOW(), 'Silver talwar belt with traditional design', '80002001002' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Talwar Belt - Black Leather', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 12, NOW(), 'Black leather talwar belt premium', '80002001003' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

-- ============================================
-- INSERT BROOCH PRODUCTS (3 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Brooch - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 10, NOW(), 'Simple traditional brooch', '80003001001' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Brooch - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1050, 6, NOW(), 'Premium brooch with fine craft', '80003001002' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Brooch - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1450, 4, NOW(), 'Deluxe brooch with embellishments', '80003001003' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

-- ============================================
-- INSERT MALA PRODUCTS (3 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Mala - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1150, 12, NOW(), 'Traditional mala for daily use', '80004001001' FROM product_categories WHERE name = 'Mala' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Mala - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1950, 8, NOW(), 'Premium mala with refined details', '80004001002' FROM product_categories WHERE name = 'Mala' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Mala - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 2550, 6, NOW(), 'Deluxe mala for special occasions', '80004001003' FROM product_categories WHERE name = 'Mala' LIMIT 1;

-- ============================================
-- INSERT DUPATTA PRODUCTS (3 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Dupatta - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1999, 15, NOW(), 'Simple dupatta for everyday wear', '80005001001' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Dupatta - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 2950, 10, NOW(), 'Premium dupatta with fine embroidery', '80005001002' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Dupatta - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 3250, 8, NOW(), 'Deluxe dupatta with intricate work', '80005001003' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

-- ============================================
-- INSERT KATAR PRODUCTS (3 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Katar - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 20, NOW(), 'Simple katar for everyday use', '80006001001' FROM product_categories WHERE name = 'Katar' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Katar - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1150, 12, NOW(), 'Premium katar with fine details', '80006001002' FROM product_categories WHERE name = 'Katar' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Katar - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1750, 8, NOW(), 'Deluxe katar with ornate design', '80006001003' FROM product_categories WHERE name = 'Katar' LIMIT 1;

-- ============================================
-- INSERT MOD PRODUCTS (2 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Mod - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 350, 25, NOW(), 'Simple mod for everyday styling', '80007001001' FROM product_categories WHERE name = 'Mod' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Mod - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 850, 15, NOW(), 'Premium mod with enhanced design', '80007001002' FROM product_categories WHERE name = 'Mod' LIMIT 1;

-- ============================================
-- INSERT TILAK PRODUCTS (2 TOTAL)
-- ============================================

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Tilak - Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 150, 30, NOW(), 'Traditional tilak for ceremonies', '80008001001' FROM product_categories WHERE name = 'Tilak' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Tilak - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 250, 20, NOW(), 'Premium tilak with jeweled design', '80008001002' FROM product_categories WHERE name = 'Tilak' LIMIT 1;

-- ============================================
-- INSERT ADDITIONAL PRODUCTS (8 MORE)
-- ============================================

-- Pocket Brooches (3)
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Pocket Brooch - Silver', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 450, 14, NOW(), 'Silver pocket brooch for waistcoat', '80009001001' FROM product_categories WHERE name = 'Pocket Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Pocket Brooch - Gold', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 12, NOW(), 'Gold pocket brooch for formal wear', '80009001002' FROM product_categories WHERE name = 'Pocket Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Pocket Brooch - Diamond', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 8, NOW(), 'Diamond pocket brooch premium', '80009001003' FROM product_categories WHERE name = 'Pocket Brooch' LIMIT 1;

-- Feathers (2)
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Feather - Ostrich White', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 850, 10, NOW(), 'White ostrich feather for turban', '80010001001' FROM product_categories WHERE name = 'Feathers' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Feather - Peacock Blue', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1050, 8, NOW(), 'Peacock blue feather for safa', '80010001002' FROM product_categories WHERE name = 'Feathers' LIMIT 1;

-- Scarves (3)
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Scarf - Silk Red', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 600, 12, NOW(), 'Red silk scarf for formal events', '80011001001' FROM product_categories WHERE name = 'Scarf' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Scarf - Silk Gold', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 650, 10, NOW(), 'Gold silk scarf with pattern', '80011001002' FROM product_categories WHERE name = 'Scarf' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description, barcode)
SELECT 'Scarf - Silk Black', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 600, 12, NOW(), 'Black silk scarf for weddings', '80011001003' FROM product_categories WHERE name = 'Scarf' LIMIT 1;

-- ============================================
-- TOTAL: 40 PRODUCTS ADDED
-- ============================================
-- Safas: 9
-- Talwar Belts: 3
-- Brooches: 3
-- Malas: 3
-- Dupattas: 3
-- Katars: 3
-- Mods: 2
-- Tilaks: 2
-- Pocket Brooches: 3
-- Feathers: 2
-- Scarves: 3
-- TOTAL: 40 PRODUCTS
