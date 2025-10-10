-- Adds updated_at column to expense_categories if missing
ALTER TABLE expense_categories
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Backfill existing rows
UPDATE expense_categories SET updated_at = NOW() WHERE updated_at IS NULL;

-- Optional trigger for automatic update (PostgreSQL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expense_categories_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION set_expense_categories_updated_at()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION set_expense_categories_updated_at();
  END IF;
END $$;
