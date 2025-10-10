-- Migration: Base Attendance Table, Indexes & Updated_at Trigger
-- Idempotent where possible

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  franchise_id uuid NOT NULL REFERENCES franchises(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  break_start_time timestamptz,
  break_end_time timestamptz,
  total_hours numeric(6,2),
  overtime_hours numeric(6,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present','absent','late','half_day','on_leave')),
  shift_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Generic updated_at trigger function (reuse if already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_row_updated_at_generic') THEN
    CREATE OR REPLACE FUNCTION set_row_updated_at_generic()
    RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_attendance_updated_at') THEN
    CREATE TRIGGER trg_attendance_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW EXECUTE FUNCTION set_row_updated_at_generic();
  END IF;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS attendance_date_franchise_idx ON public.attendance_records(date, franchise_id);
CREATE INDEX IF NOT EXISTS attendance_user_date_idx ON public.attendance_records(user_id, date DESC);
CREATE INDEX IF NOT EXISTS attendance_franchise_status_date_idx ON public.attendance_records(franchise_id, status, date DESC);
CREATE INDEX IF NOT EXISTS attendance_shift_idx ON public.attendance_records(shift_id);

-- Optional improved hours calculation trigger (uncomment if using calculate_attendance_hours_v2)
-- DROP TRIGGER IF EXISTS trigger_calculate_attendance_hours ON public.attendance_records;
-- CREATE TRIGGER trigger_calculate_attendance_hours
--   BEFORE INSERT OR UPDATE ON public.attendance_records
--   FOR EACH ROW EXECUTE FUNCTION calculate_attendance_hours_v2();

COMMENT ON TABLE public.attendance_records IS 'Employee daily attendance records with hours & status';
COMMENT ON COLUMN public.attendance_records.total_hours IS 'Computed working hours minus break';
COMMENT ON COLUMN public.attendance_records.overtime_hours IS 'Hours exceeding configured shift duration';
