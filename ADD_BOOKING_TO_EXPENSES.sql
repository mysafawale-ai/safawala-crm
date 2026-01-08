-- Add booking reference columns to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS booking_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS booking_number VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_expenses_booking_id ON expenses(booking_id);
