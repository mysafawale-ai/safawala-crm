-- Add soft-delete columns to customers table
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID NULL,
  ADD COLUMN IF NOT EXISTS delete_reason TEXT NULL;

-- Helpful index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_customers_deleted_at ON customers (deleted_at);
