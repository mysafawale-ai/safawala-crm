-- ================================================================
-- STEP 5: CREATE TRIGGER FOR UPDATED_AT
-- ================================================================
-- Run this fifth - Creates trigger for automatic timestamp updates
-- Safe to run multiple times (uses CREATE OR REPLACE)
-- ================================================================

-- Create or update the trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if exists, then create new one
DROP TRIGGER IF EXISTS update_package_levels_updated_at ON package_levels;

CREATE TRIGGER update_package_levels_updated_at 
    BEFORE UPDATE ON package_levels 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SUCCESS: Trigger created
-- ================================================================
