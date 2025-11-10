-- Remove description column from packages_categories table
-- This field is no longer needed in the UI or business logic
-- Date: 11 November 2025

-- Drop the description column
ALTER TABLE packages_categories 
DROP COLUMN IF EXISTS description;

-- Verify the change
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'packages_categories'
ORDER BY 
    ordinal_position;
