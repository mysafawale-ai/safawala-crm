-- Add Barati Safa parent category and Package 1-9 subcategories
-- This script creates a hierarchical category structure for Barati Safa packages

DO $$
DECLARE
    v_barati_safa_id UUID;
    v_franchise_id UUID;
    i INTEGER;
BEGIN
    -- Get the first franchise_id (or you can specify a specific franchise)
    SELECT id INTO v_franchise_id FROM franchises LIMIT 1;
    
    IF v_franchise_id IS NULL THEN
        RAISE NOTICE '⚠️  No franchise found. Creating categories without franchise_id.';
    END IF;

    -- Step 1: Check if "Barati Safa" category already exists
    SELECT id INTO v_barati_safa_id 
    FROM packages_categories 
    WHERE name = 'Barati Safa';

    -- Step 2: If not exists, create parent category "Barati Safa"
    IF v_barati_safa_id IS NULL THEN
        INSERT INTO packages_categories (name, description, display_order, is_active, franchise_id)
        VALUES (
            'Barati Safa',
            'Traditional barati safa collection with multiple package options',
            10,
            true,
            v_franchise_id
        )
        RETURNING id INTO v_barati_safa_id;
        
        RAISE NOTICE '✅ Created parent category: Barati Safa (ID: %)', v_barati_safa_id;
    ELSE
        RAISE NOTICE '✅ Barati Safa category already exists (ID: %)', v_barati_safa_id;
    END IF;

    -- Step 3: Create subcategories Package 1 to Package 9
    FOR i IN 1..9 LOOP
        -- Check if subcategory already exists
        IF NOT EXISTS (
            SELECT 1 FROM packages_categories 
            WHERE name = 'Barati Safa - Package ' || i
        ) THEN
            INSERT INTO packages_categories (name, description, display_order, is_active, franchise_id)
            VALUES (
                'Barati Safa - Package ' || i,
                'Barati Safa Package ' || i || ' - Premium wedding safa collection',
                10 + i, -- Display order: 11, 12, 13, ..., 19
                true,
                v_franchise_id
            );
            
            RAISE NOTICE '✅ Created subcategory: Barati Safa - Package %', i;
        ELSE
            RAISE NOTICE '⚠️  Subcategory already exists: Barati Safa - Package %', i;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COMPLETED: Barati Safa Categories';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Parent: Barati Safa';
    RAISE NOTICE 'Subcategories: Package 1 through Package 9';
    RAISE NOTICE '';

END $$;

-- Verify the created categories
SELECT 
    id,
    name,
    description,
    display_order,
    is_active,
    created_at
FROM packages_categories
WHERE name LIKE 'Barati Safa%'
ORDER BY display_order;
