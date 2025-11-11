-- ===================================================================
-- 🧾 ADD GST PERCENTAGE TO COMPANY SETTINGS
-- ===================================================================
-- This migration adds gst_percentage field to company_settings table
-- This will be the central GST rate used for all bookings and billing
-- 
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
-- ===================================================================

-- Add gst_percentage column if it doesn't exist
DO $$ 
BEGIN
  -- Add gst_percentage column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='company_settings' AND column_name='gst_percentage'
  ) THEN
    ALTER TABLE company_settings 
    ADD COLUMN gst_percentage DECIMAL(5,2) DEFAULT 5.00 NOT NULL;
    
    RAISE NOTICE '✅ Added gst_percentage column to company_settings (default: 5.00%)';
  ELSE
    RAISE NOTICE '⏭️  gst_percentage column already exists in company_settings';
  END IF;

  -- Add constraint to ensure GST percentage is between 0 and 100
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name='company_settings' AND constraint_name='company_settings_gst_percentage_check'
  ) THEN
    ALTER TABLE company_settings 
    ADD CONSTRAINT company_settings_gst_percentage_check 
    CHECK (gst_percentage >= 0 AND gst_percentage <= 100);
    
    RAISE NOTICE '✅ Added constraint: GST percentage must be between 0-100';
  ELSE
    RAISE NOTICE '⏭️  GST percentage constraint already exists';
  END IF;

END $$;

-- Add comment for documentation
COMMENT ON COLUMN company_settings.gst_percentage IS 'GST/Tax percentage applied to all bookings and billing (default: 5%)';

-- Update existing records to have default GST if NULL
UPDATE company_settings 
SET gst_percentage = 5.00 
WHERE gst_percentage IS NULL;

-- Verification query
SELECT 
  id,
  company_name,
  gst_percentage,
  gst_number,
  franchise_id
FROM company_settings
ORDER BY created_at DESC;

-- ✅ MIGRATION COMPLETE
-- The gst_percentage field is now available in company_settings
-- Default value: 5.00%
-- Range: 0-100%
-- Use this in booking creation and billing calculations
