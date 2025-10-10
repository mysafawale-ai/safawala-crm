-- Demo Data Seed Script
-- Adds 50 products and 6 package sets with variants
-- Run this directly in Supabase SQL Editor

-- Use the default franchise ID or replace with your franchise ID
DO $$
DECLARE
  default_franchise_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- ============================================
-- INSERT PRODUCTS (50 items)
-- ============================================

-- Sherwani Collection (15 items)
INSERT INTO products (name, category, rental_price, sale_price, security_deposit, stock_available, franchise_id, product_code)
VALUES
  ('Royal Gold Sherwani', 'Sherwani', 8000, 35000, 5000, 5, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Classic Cream Sherwani', 'Sherwani', 6500, 28000, 4000, 8, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Maroon Velvet Sherwani', 'Sherwani', 9000, 42000, 6000, 4, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Navy Blue Designer Sherwani', 'Sherwani', 7500, 32000, 5000, 6, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Ivory Pearl Sherwani', 'Sherwani', 8500, 38000, 5500, 5, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Black Embroidered Sherwani', 'Sherwani', 7000, 30000, 4500, 7, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Pastel Pink Sherwani', 'Sherwani', 6000, 25000, 4000, 6, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Mint Green Sherwani', 'Sherwani', 6500, 27000, 4000, 5, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Silver Grey Sherwani', 'Sherwani', 7500, 33000, 5000, 4, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Wine Red Sherwani', 'Sherwani', 8000, 36000, 5500, 5, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Peach Silk Sherwani', 'Sherwani', 6500, 28000, 4000, 6, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Chocolate Brown Sherwani', 'Sherwani', 7000, 31000, 4500, 5, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Royal Purple Sherwani', 'Sherwani', 8500, 39000, 6000, 4, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Champagne Gold Sherwani', 'Sherwani', 9500, 45000, 6500, 3, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Teal Blue Sherwani', 'Sherwani', 7000, 30000, 4500, 6, default_franchise_id, 'PRD' || floor(random() * 100000000)::text);

-- Kurta Collection (10 items)
INSERT INTO products (name, category, rental_price, sale_price, security_deposit, stock_available, franchise_id, product_code)
VALUES
  ('White Chikankari Kurta', 'Kurta', 2500, 8000, 1500, 12, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Sky Blue Cotton Kurta', 'Kurta', 2000, 6500, 1200, 15, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Pink Silk Kurta', 'Kurta', 3000, 9500, 1800, 10, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Yellow Festive Kurta', 'Kurta', 2500, 8500, 1500, 12, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Green Designer Kurta', 'Kurta', 2800, 9000, 1600, 10, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Orange Embroidered Kurta', 'Kurta', 2700, 8800, 1500, 11, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Black Pathani Kurta', 'Kurta', 2300, 7500, 1400, 14, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Beige Linen Kurta', 'Kurta', 2200, 7000, 1300, 13, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Red Wedding Kurta', 'Kurta', 3200, 10000, 2000, 8, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Lavender Kurta Pajama Set', 'Kurta', 2600, 8500, 1500, 10, default_franchise_id, 'PRD' || floor(random() * 100000000)::text);

-- Safa/Turban Collection (10 items)
INSERT INTO products (name, category, rental_price, sale_price, security_deposit, stock_available, franchise_id, product_code)
VALUES
  ('Red Rajasthani Safa', 'Safa', 1500, 4500, 800, 20, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Golden Safa with Kalgi', 'Safa', 2000, 6000, 1200, 15, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Pink Designer Safa', 'Safa', 1800, 5500, 1000, 18, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Orange Traditional Safa', 'Safa', 1600, 5000, 900, 20, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Maroon Royal Safa', 'Safa', 1700, 5200, 1000, 16, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Cream Bandhani Safa', 'Safa', 1800, 5500, 1000, 15, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Green Festive Safa', 'Safa', 1600, 4800, 900, 18, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Blue Embroidered Safa', 'Safa', 1900, 5800, 1100, 14, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Yellow Celebration Safa', 'Safa', 1700, 5000, 900, 17, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('White Pearl Safa', 'Safa', 2200, 6500, 1300, 12, default_franchise_id, 'PRD' || floor(random() * 100000000)::text);

-- Jooti/Shoes Collection (8 items)
INSERT INTO products (name, category, rental_price, sale_price, security_deposit, stock_available, franchise_id, product_code)
VALUES
  ('Golden Embroidered Jooti', 'Jooti', 1200, 3500, 600, 25, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Cream Velvet Mojari', 'Jooti', 1000, 3000, 500, 30, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Red Traditional Jooti', 'Jooti', 1100, 3200, 550, 28, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Black Designer Jooti', 'Jooti', 1300, 3800, 650, 22, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Maroon Royal Mojari', 'Jooti', 1150, 3400, 600, 26, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Beige Leather Jooti', 'Jooti', 1250, 3600, 600, 24, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Navy Blue Mojari', 'Jooti', 1100, 3300, 550, 27, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Brown Classic Jooti', 'Jooti', 1050, 3100, 550, 28, default_franchise_id, 'PRD' || floor(random() * 100000000)::text);

-- Accessories (7 items)
INSERT INTO products (name, category, rental_price, sale_price, security_deposit, stock_available, franchise_id, product_code)
VALUES
  ('Pearl Mala Set', 'Accessories', 800, 2500, 400, 15, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Golden Brooch', 'Accessories', 500, 1500, 300, 20, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Kundan Kalgi', 'Accessories', 1500, 4500, 800, 12, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Designer Belt', 'Accessories', 600, 1800, 350, 18, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Embroidered Stole', 'Accessories', 700, 2200, 400, 16, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Silver Kara Set', 'Accessories', 900, 2800, 500, 14, default_franchise_id, 'PRD' || floor(random() * 100000000)::text),
  ('Wedding Handkerchief', 'Accessories', 300, 800, 200, 25, default_franchise_id, 'PRD' || floor(random() * 100000000)::text);

-- ============================================
-- INSERT PACKAGE SETS AND VARIANTS
-- ============================================

-- Package 1: Royal Groom Package
INSERT INTO package_sets (name, base_price, extra_safa_price, description, franchise_id, package_code)
VALUES ('Royal Groom Package', 15000, 1500, 'Premium complete groom outfit with sherwani, safa, jooti and accessories', default_franchise_id, 'PKG' || floor(random() * 100000000)::text)
RETURNING id INTO @royal_pkg_id;

INSERT INTO package_variants (package_id, variant_name, base_price, extra_safa_price)
SELECT id, 'Standard', 15000, 1500 FROM package_sets WHERE name = 'Royal Groom Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Premium', 18000, 1500 FROM package_sets WHERE name = 'Royal Groom Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Deluxe', 22000, 1500 FROM package_sets WHERE name = 'Royal Groom Package' ORDER BY created_at DESC LIMIT 1;

-- Package 2: Classic Groom Package
INSERT INTO package_sets (name, base_price, extra_safa_price, description, franchise_id, package_code)
VALUES ('Classic Groom Package', 12000, 1200, 'Traditional groom outfit with elegant sherwani and accessories', default_franchise_id, 'PKG' || floor(random() * 100000000)::text);

INSERT INTO package_variants (package_id, variant_name, base_price, extra_safa_price)
SELECT id, 'Basic', 12000, 1200 FROM package_sets WHERE name = 'Classic Groom Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Standard', 14000, 1200 FROM package_sets WHERE name = 'Classic Groom Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Premium', 17000, 1200 FROM package_sets WHERE name = 'Classic Groom Package' ORDER BY created_at DESC LIMIT 1;

-- Package 3: Wedding Special Package
INSERT INTO package_sets (name, base_price, extra_safa_price, description, franchise_id, package_code)
VALUES ('Wedding Special Package', 20000, 2000, 'Luxury wedding package with designer sherwani and premium accessories', default_franchise_id, 'PKG' || floor(random() * 100000000)::text);

INSERT INTO package_variants (package_id, variant_name, base_price, extra_safa_price)
SELECT id, 'Gold', 20000, 2000 FROM package_sets WHERE name = 'Wedding Special Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Platinum', 25000, 2000 FROM package_sets WHERE name = 'Wedding Special Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Diamond', 30000, 2000 FROM package_sets WHERE name = 'Wedding Special Package' ORDER BY created_at DESC LIMIT 1;

-- Package 4: Budget Groom Package
INSERT INTO package_sets (name, base_price, extra_safa_price, description, franchise_id, package_code)
VALUES ('Budget Groom Package', 8000, 800, 'Affordable yet stylish groom outfit for budget-conscious customers', default_franchise_id, 'PKG' || floor(random() * 100000000)::text);

INSERT INTO package_variants (package_id, variant_name, base_price, extra_safa_price)
SELECT id, 'Economy', 8000, 800 FROM package_sets WHERE name = 'Budget Groom Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Standard', 10000, 800 FROM package_sets WHERE name = 'Budget Groom Package' ORDER BY created_at DESC LIMIT 1;

-- Package 5: Sangeet Special Package
INSERT INTO package_sets (name, base_price, extra_safa_price, description, franchise_id, package_code)
VALUES ('Sangeet Special Package', 10000, 1000, 'Vibrant and colorful outfit perfect for sangeet ceremonies', default_franchise_id, 'PKG' || floor(random() * 100000000)::text);

INSERT INTO package_variants (package_id, variant_name, base_price, extra_safa_price)
SELECT id, 'Basic', 10000, 1000 FROM package_sets WHERE name = 'Sangeet Special Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Premium', 13000, 1000 FROM package_sets WHERE name = 'Sangeet Special Package' ORDER BY created_at DESC LIMIT 1;

-- Package 6: Destination Wedding Package
INSERT INTO package_sets (name, base_price, extra_safa_price, description, franchise_id, package_code)
VALUES ('Destination Wedding Package', 18000, 1800, 'Travel-friendly premium outfit for destination weddings', default_franchise_id, 'PKG' || floor(random() * 100000000)::text);

INSERT INTO package_variants (package_id, variant_name, base_price, extra_safa_price)
SELECT id, 'Standard', 18000, 1800 FROM package_sets WHERE name = 'Destination Wedding Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Deluxe', 22000, 1800 FROM package_sets WHERE name = 'Destination Wedding Package' ORDER BY created_at DESC LIMIT 1
UNION ALL
SELECT id, 'Royal', 28000, 1800 FROM package_sets WHERE name = 'Destination Wedding Package' ORDER BY created_at DESC LIMIT 1;

END $$;

-- Show summary
SELECT 'Products' as type, category, COUNT(*) as count 
FROM products 
WHERE created_at > NOW() - INTERVAL '1 minute'
GROUP BY category
UNION ALL
SELECT 'Packages' as type, 'Package Sets' as category, COUNT(*) as count
FROM package_sets
WHERE created_at > NOW() - INTERVAL '1 minute'
UNION ALL
SELECT 'Packages' as type, 'Package Variants' as category, COUNT(*) as count
FROM package_variants
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY type, category;
