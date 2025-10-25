-- ============================================================================
-- STEP 2: Create Variants (Run AFTER categories are created)
-- ============================================================================
-- This creates 3 sample variants for "21 Safas" category
-- ============================================================================

DO $$
DECLARE
  v_franchise_id UUID := '1a518dde-85b7-44ef-8bc4-092f53ddfd99';
  v_cat_21 UUID;
BEGIN

RAISE NOTICE '🚀 Creating variants...';

-- First, add the missing columns if they don't exist
ALTER TABLE package_variants ADD COLUMN IF NOT EXISTS extra_safa_price NUMERIC(10,2) DEFAULT 0;
ALTER TABLE package_variants ADD COLUMN IF NOT EXISTS missing_safa_penalty NUMERIC(10,2) DEFAULT 0;

RAISE NOTICE '✅ Columns verified';

-- Get the 21 Safas category ID
SELECT id INTO v_cat_21 FROM packages_categories WHERE name = '21 Safas' AND franchise_id = v_franchise_id;

IF v_cat_21 IS NULL THEN
  RAISE EXCEPTION 'Category "21 Safas" not found. Please run STEP_1_CREATE_CATEGORIES.sql first!';
END IF;

RAISE NOTICE 'Found category: 21 Safas (ID: %)', v_cat_21;

-- Variant 1: Classic Style
INSERT INTO package_variants (
  name, 
  description, 
  category_id, 
  package_id, 
  base_price, 
  extra_safa_price, 
  missing_safa_penalty, 
  inclusions, 
  is_active
)
VALUES (
  'Classic Style',
  'Classic Style, 3 VIP Family Safas, Groom Safa not included',
  v_cat_21,
  v_cat_21,
  4000.00,
  100.00,
  450.00,
  ARRAY['Classic Style', '3 VIP Family Safas', 'Groom Safa not included'],
  true
);

RAISE NOTICE '  ✅ Created: Classic Style (₹4,000)';

-- Variant 2: Bollywood Styles
INSERT INTO package_variants (
  name, 
  description, 
  category_id, 
  package_id, 
  base_price, 
  extra_safa_price, 
  missing_safa_penalty, 
  inclusions, 
  is_active
)
VALUES (
  'Bollywood Styles',
  'Bollywood Styles, All VIP Safas, Groom Maharaja Safa with premium brooches & jewellery',
  v_cat_21,
  v_cat_21,
  7000.00,
  200.00,
  650.00,
  ARRAY['Bollywood Styles', 'All VIP Safas', 'Groom Maharaja Safa', 'Premium brooches', 'Jewellery'],
  true
);

RAISE NOTICE '  ✅ Created: Bollywood Styles (₹7,000)';

-- Variant 3: Royal Heritage Special
INSERT INTO package_variants (
  name, 
  description, 
  category_id, 
  package_id, 
  base_price, 
  extra_safa_price, 
  missing_safa_penalty, 
  inclusions, 
  is_active
)
VALUES (
  'Royal Heritage Special',
  'Royal Heritage Special, All VVIP Theme Safas, Groom Maharaja Safa with premium jewellery',
  v_cat_21,
  v_cat_21,
  12000.00,
  450.00,
  1150.00,
  ARRAY['Royal Heritage Special', 'All VVIP Theme Safas', 'Groom Maharaja Safa', 'Premium jewellery'],
  true
);

RAISE NOTICE '  ✅ Created: Royal Heritage Special (₹12,000)';

RAISE NOTICE '✅ Successfully created 3 variants!';

END $$;

-- Verify
SELECT 
  v.id,
  v.name,
  v.base_price,
  v.extra_safa_price,
  v.missing_safa_penalty,
  c.name as category
FROM package_variants v
JOIN packages_categories c ON v.category_id = c.id
WHERE c.franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'
ORDER BY v.base_price;
