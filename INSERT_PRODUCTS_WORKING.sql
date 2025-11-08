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
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Red Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional red safa for groom' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Yellow Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional yellow safa for groom' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Orange Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 500, 20, NOW(), 'Traditional orange safa for groom' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Maroon Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium maroon safa with embroidery' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Gold Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium gold safa with jeweled work' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Green Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 750, 15, NOW(), 'Premium green safa for special look' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Black Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1000, 10, NOW(), 'Deluxe black safa with premium finish' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - White Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1000, 10, NOW(), 'Deluxe white safa for formal events' FROM product_categories WHERE name = 'Safa' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Safa - Multi-color Elite', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1500, 8, NOW(), 'Elite multicolor safa with jewels' FROM product_categories WHERE name = 'Safa' LIMIT 1;

-- Insert Talwar Belt Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar Belt - Golden', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 400, 15, NOW(), 'Golden talwar belt for formal wear' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar Belt - Silver', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 400, 15, NOW(), 'Silver talwar belt with traditional design' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar Belt - Black Leather', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 12, NOW(), 'Black leather talwar belt premium' FROM product_categories WHERE name = 'Talwar Belt' LIMIT 1;

-- Insert Brooch Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 10, NOW(), 'Simple traditional brooch' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1050, 6, NOW(), 'Premium brooch with fine craft' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1450, 4, NOW(), 'Deluxe brooch with embellishments' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

-- Insert Mala Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1150, 12, NOW(), 'Traditional mala for daily use' FROM product_categories WHERE name = 'Mala' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1950, 8, NOW(), 'Premium mala with refined details' FROM product_categories WHERE name = 'Mala' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 2550, 6, NOW(), 'Deluxe mala for special occasions' FROM product_categories WHERE name = 'Mala' LIMIT 1;

-- Insert Dupatta Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1999, 15, NOW(), 'Simple dupatta for everyday wear' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 2950, 10, NOW(), 'Premium dupatta with fine embroidery' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 3250, 8, NOW(), 'Deluxe dupatta with intricate work' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

-- Insert Katar Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 550, 20, NOW(), 'Simple katar for everyday use' FROM product_categories WHERE name = 'Katar' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1150, 12, NOW(), 'Premium katar with fine details' FROM product_categories WHERE name = 'Katar' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Deluxe', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 1750, 8, NOW(), 'Deluxe katar with ornate design' FROM product_categories WHERE name = 'Katar' LIMIT 1;

-- Insert Mod Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mod - Basic', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 350, 25, NOW(), 'Simple mod for everyday styling' FROM product_categories WHERE name = 'Mod' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mod - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 850, 15, NOW(), 'Premium mod with enhanced design' FROM product_categories WHERE name = 'Mod' LIMIT 1;

-- Insert Tilak Products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Tilak - Traditional', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 150, 30, NOW(), 'Traditional tilak for ceremonies' FROM product_categories WHERE name = 'Tilak' LIMIT 1;

INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Tilak - Premium', id, '1a518dde-85b7-44ef-8bc4-092f53ddfd99', true, 250, 20, NOW(), 'Premium tilak with jeweled design' FROM product_categories WHERE name = 'Tilak' LIMIT 1;

-- Done! All 32 products added for your franchise!
