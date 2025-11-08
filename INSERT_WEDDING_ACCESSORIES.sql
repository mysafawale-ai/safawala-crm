-- Insert product categories for wedding accessories
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
  ('Talwar', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert Brooch products (Tier: Basic → Premium → Deluxe → Ultra → Elite)
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 550, 10, NOW(), 'Simple traditional brooch for everyday wear' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 950, 8, NOW(), 'Classic brooch with enhanced detailing' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 1050, 6, NOW(), 'Premium quality brooch with fine craftsmanship' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Deluxe', id, (SELECT id FROM franchises LIMIT 1), true, 1450, 4, NOW(), 'Luxurious brooch with embellishments' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Ultra', id, (SELECT id FROM franchises LIMIT 1), true, 1650, 3, NOW(), 'Ultra premium brooch for special occasions' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Elite', id, (SELECT id FROM franchises LIMIT 1), true, 1850, 2, NOW(), 'Elite collection brooch with exclusive design' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Exclusive', id, (SELECT id FROM franchises LIMIT 1), true, 2150, 2, NOW(), 'Exclusive limited edition brooch' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Grand', id, (SELECT id FROM franchises LIMIT 1), true, 2550, 1, NOW(), 'Grand statement brooch for wedding events' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Majestic', id, (SELECT id FROM franchises LIMIT 1), true, 3550, 1, NOW(), 'Majestic brooch with royal aesthetics' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Supreme', id, (SELECT id FROM franchises LIMIT 1), true, 4550, 1, NOW(), 'Supreme collection brooch - highest quality' FROM product_categories WHERE name = 'Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Brooch - Heritage', id, (SELECT id FROM franchises LIMIT 1), true, 6550, 1, NOW(), 'Heritage collection brooch - timeless elegance' FROM product_categories WHERE name = 'Brooch' LIMIT 1;

-- Insert Mala products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 1150, 12, NOW(), 'Traditional mala for daily use' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 1650, 10, NOW(), 'Classic mala with traditional craftsmanship' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 1950, 8, NOW(), 'Premium mala with refined details' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Deluxe', id, (SELECT id FROM franchises LIMIT 1), true, 2550, 6, NOW(), 'Deluxe mala for special occasions' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Ultra', id, (SELECT id FROM franchises LIMIT 1), true, 3550, 4, NOW(), 'Ultra premium mala with intricate design' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Elite', id, (SELECT id FROM franchises LIMIT 1), true, 4250, 3, NOW(), 'Elite collection mala - handcrafted excellence' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Prestige', id, (SELECT id FROM franchises LIMIT 1), true, 4550, 2, NOW(), 'Prestige mala for grand celebrations' FROM product_categories WHERE name = 'Mala' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mala - Royal', id, (SELECT id FROM franchises LIMIT 1), true, 5500, 1, NOW(), 'Royal collection mala - supreme quality' FROM product_categories WHERE name = 'Mala' LIMIT 1;

-- Insert Dupatta products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 1999, 15, NOW(), 'Simple dupatta for everyday wear' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 2250, 12, NOW(), 'Classic dupatta with traditional patterns' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 2950, 10, NOW(), 'Premium dupatta with fine embroidery' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Deluxe', id, (SELECT id FROM franchises LIMIT 1), true, 3250, 8, NOW(), 'Deluxe dupatta with intricate work' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Ultra', id, (SELECT id FROM franchises LIMIT 1), true, 3650, 6, NOW(), 'Ultra premium dupatta with beadwork' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Elite', id, (SELECT id FROM franchises LIMIT 1), true, 3850, 5, NOW(), 'Elite dupatta with mirror embellishments' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Exclusive', id, (SELECT id FROM franchises LIMIT 1), true, 3950, 4, NOW(), 'Exclusive dupatta with designer patterns' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Dupatta - Heritage', id, (SELECT id FROM franchises LIMIT 1), true, 4550, 2, NOW(), 'Heritage dupatta - finest craftsmanship' FROM product_categories WHERE name = 'Dupatta' LIMIT 1;

-- Insert Katar products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 550, 20, NOW(), 'Simple katar for everyday use' FROM product_categories WHERE name = 'Katar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 650, 18, NOW(), 'Classic katar with traditional design' FROM product_categories WHERE name = 'Katar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 1150, 12, NOW(), 'Premium katar with fine details' FROM product_categories WHERE name = 'Katar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Deluxe', id, (SELECT id FROM franchises LIMIT 1), true, 1750, 8, NOW(), 'Deluxe katar with ornate design' FROM product_categories WHERE name = 'Katar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Ultra', id, (SELECT id FROM franchises LIMIT 1), true, 2250, 5, NOW(), 'Ultra premium katar with jeweled work' FROM product_categories WHERE name = 'Katar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Elite', id, (SELECT id FROM franchises LIMIT 1), true, 5500, 2, NOW(), 'Elite katar for special occasions' FROM product_categories WHERE name = 'Katar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Katar - Royal', id, (SELECT id FROM franchises LIMIT 1), true, 7500, 1, NOW(), 'Royal katar - premium collection' FROM product_categories WHERE name = 'Katar' LIMIT 1;

-- Insert Mod products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mod - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 350, 25, NOW(), 'Simple mod for everyday styling' FROM product_categories WHERE name = 'Mod' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mod - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 650, 20, NOW(), 'Classic mod with traditional appeal' FROM product_categories WHERE name = 'Mod' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Mod - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 850, 15, NOW(), 'Premium mod with enhanced design' FROM product_categories WHERE name = 'Mod' LIMIT 1;

-- Insert Pocket Brooch products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Pocket Brooch - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 250, 30, NOW(), 'Simple pocket brooch for shirt styling' FROM product_categories WHERE name = 'Pocket Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Pocket Brooch - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 350, 25, NOW(), 'Classic pocket brooch with details' FROM product_categories WHERE name = 'Pocket Brooch' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Pocket Brooch - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 450, 20, NOW(), 'Premium pocket brooch for formal wear' FROM product_categories WHERE name = 'Pocket Brooch' LIMIT 1;

-- Insert Feathers products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Feathers - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 150, 40, NOW(), 'Simple feather accessory' FROM product_categories WHERE name = 'Feathers' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Feathers - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 350, 30, NOW(), 'Premium feather accessory with styling' FROM product_categories WHERE name = 'Feathers' LIMIT 1;

-- Insert Groom Safa products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 2950, 10, NOW(), 'Traditional groom safa for weddings' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 3250, 9, NOW(), 'Classic groom safa with tradition' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 3650, 7, NOW(), 'Premium groom safa for grand events' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Deluxe', id, (SELECT id FROM franchises LIMIT 1), true, 3950, 6, NOW(), 'Deluxe groom safa with intricate details' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Ultra', id, (SELECT id FROM franchises LIMIT 1), true, 4150, 5, NOW(), 'Ultra premium groom safa' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Elite', id, (SELECT id FROM franchises LIMIT 1), true, 4550, 3, NOW(), 'Elite groom safa - finest collection' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Groom Safa - Royal', id, (SELECT id FROM franchises LIMIT 1), true, 5100, 1, NOW(), 'Royal groom safa - premium craftsmanship' FROM product_categories WHERE name = 'Groom Safa' LIMIT 1;

-- Insert Scarf products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Scarf - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 450, 20, NOW(), 'Simple scarf for casual styling' FROM product_categories WHERE name = 'Scarf' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Scarf - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 650, 15, NOW(), 'Classic scarf with elegant appeal' FROM product_categories WHERE name = 'Scarf' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Scarf - Prestige', id, (SELECT id FROM franchises LIMIT 1), true, 2500, 5, NOW(), 'Prestige scarf for special occasions' FROM product_categories WHERE name = 'Scarf' LIMIT 1;

-- Insert Belt product
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Belt - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 3500, 8, NOW(), 'Premium belt for formal wedding wear' FROM product_categories WHERE name = 'Belt' LIMIT 1;

-- Insert Talwar products
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar - Basic', id, (SELECT id FROM franchises LIMIT 1), true, 3500, 10, NOW(), 'Traditional talwar for groom' FROM product_categories WHERE name = 'Talwar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar - Standard', id, (SELECT id FROM franchises LIMIT 1), true, 4000, 8, NOW(), 'Classic talwar with traditional design' FROM product_categories WHERE name = 'Talwar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar - Premium', id, (SELECT id FROM franchises LIMIT 1), true, 5500, 6, NOW(), 'Premium talwar for special events' FROM product_categories WHERE name = 'Talwar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar - Deluxe', id, (SELECT id FROM franchises LIMIT 1), true, 8000, 3, NOW(), 'Deluxe talwar for grand occasions' FROM product_categories WHERE name = 'Talwar' LIMIT 1;
INSERT INTO products (name, category_id, franchise_id, is_active, rental_price, stock_available, created_at, description)
SELECT 'Talwar - Elite', id, (SELECT id FROM franchises LIMIT 1), true, 11000, 1, NOW(), 'Elite talwar - premium collection' FROM product_categories WHERE name = 'Talwar' LIMIT 1;
