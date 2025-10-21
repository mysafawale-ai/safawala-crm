-- ================================================================
-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- ================================================================
-- Run this fourth - Enables security
-- Handles existing policies gracefully
-- ================================================================

-- Enable RLS on package_levels
ALTER TABLE package_levels ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON package_levels;

CREATE POLICY "Allow all operations for authenticated users" 
    ON package_levels 
    FOR ALL 
    TO authenticated 
    USING (true);

-- ================================================================
-- SUCCESS: RLS enabled and policies created
-- ================================================================
