-- Migration: Expense Audit Trail, Indexes & updated_at enhancements
-- Idempotent where possible

-- 1. Audit table for entity-level changes (lighter than system_logs)
CREATE TABLE IF NOT EXISTS public.expense_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,               -- 'expense' | 'expense_category'
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('create','update','delete')),
  actor_id uuid,
  actor_role text,
  changes jsonb,                           -- { before: {}, after: {} }
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS expense_audit_entity_idx ON public.expense_audit(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS expense_audit_created_idx ON public.expense_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS expense_audit_action_idx ON public.expense_audit(action);

-- 2. Add updated_at + trigger to expenses table (if not already present)
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_at timestamptz;
UPDATE public.expenses SET updated_at = NOW() WHERE updated_at IS NULL;

-- Reusable trigger function (generic)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'set_row_updated_at_generic'
  ) THEN
    CREATE OR REPLACE FUNCTION set_row_updated_at_generic()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Attach trigger to expenses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_expenses_updated_at'
  ) THEN
    CREATE TRIGGER trg_expenses_updated_at
    BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION set_row_updated_at_generic();
  END IF;
END $$;

-- 3. Performance indexes for pagination & filtering
CREATE INDEX IF NOT EXISTS expenses_expense_date_idx ON public.expenses (expense_date DESC);
CREATE INDEX IF NOT EXISTS expenses_expense_date_id_idx ON public.expenses (expense_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS expenses_subcategory_idx ON public.expenses (subcategory);
CREATE INDEX IF NOT EXISTS expenses_vendor_name_idx ON public.expenses (vendor_name);
CREATE INDEX IF NOT EXISTS expenses_amount_idx ON public.expenses (amount);

-- 4. Category activity index (if heavy filtering by is_active)
CREATE INDEX IF NOT EXISTS expense_categories_is_active_idx ON public.expense_categories (is_active);

-- 5. (Optional) Future trigram for fuzzy vendor search (commented)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS expenses_vendor_name_trgm ON public.expenses USING gin (vendor_name gin_trgm_ops);

-- 6. Documentation comments
COMMENT ON TABLE public.expense_audit IS 'Entity-level audit trail for expenses & categories';
COMMENT ON COLUMN public.expense_audit.changes IS 'JSON diff structure: {before:{}, after:{}}';
