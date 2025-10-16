-- Add security_deposit column to package_bookings table
-- This column was missing and causing issues in quote displays

ALTER TABLE package_bookings 
ADD COLUMN IF NOT EXISTS security_deposit numeric(12,2) DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN package_bookings.security_deposit IS 'Refundable security deposit amount for package bookings';

-- Verify the column was added
SELECT 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'package_bookings' 
  AND column_name = 'security_deposit';
