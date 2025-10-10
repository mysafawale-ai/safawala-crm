-- Expense Categories Table Migration
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#2563eb',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Helpful index for name searches
CREATE INDEX IF NOT EXISTS expense_categories_name_idx ON public.expense_categories (lower(name));
