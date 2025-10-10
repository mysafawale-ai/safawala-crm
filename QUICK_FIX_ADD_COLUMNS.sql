-- Quick fix: Add pincode and pan_number columns to company_settings
-- This will add the columns if they don't exist

DO $$ 
BEGIN
    -- Add pincode column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'pincode'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN pincode VARCHAR(10);
        RAISE NOTICE 'Added pincode column';
    ELSE
        RAISE NOTICE 'pincode column already exists';
    END IF;

    -- Add pan_number column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'pan_number'
    ) THEN
        ALTER TABLE company_settings ADD COLUMN pan_number VARCHAR(10);
        RAISE NOTICE 'Added pan_number column';
    ELSE
        RAISE NOTICE 'pan_number column already exists';
    END IF;
END $$;

-- Show the result
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'company_settings'
ORDER BY ordinal_position;
