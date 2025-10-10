-- Migration: Payroll Enhancements (extra columns & indexes)
-- Idempotent additions

ALTER TABLE salary_configurations ADD COLUMN IF NOT EXISTS effective_to date;
ALTER TABLE salary_configurations ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';

ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS failed_reason text;

ALTER TABLE payroll_line_items ADD COLUMN IF NOT EXISTS remarks text;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS salary_config_franchise_active_eff_idx ON salary_configurations(franchise_id, is_active, effective_from DESC);
CREATE INDEX IF NOT EXISTS payroll_runs_franchise_status_idx ON payroll_runs(franchise_id, status);
CREATE INDEX IF NOT EXISTS payroll_line_items_user_run_idx ON payroll_line_items(user_id, payroll_run_id);

-- Comments
COMMENT ON COLUMN salary_configurations.effective_to IS 'End date (exclusive) for configuration validity';
COMMENT ON COLUMN salary_configurations.currency IS 'Currency code (default INR)';
COMMENT ON COLUMN payroll_runs.locked_at IS 'Timestamp when run was locked against changes';
COMMENT ON COLUMN payroll_runs.failed_reason IS 'Failure diagnostics if a run failed';
COMMENT ON COLUMN payroll_line_items.remarks IS 'Optional per-employee notes or manual adjustments explanation';
