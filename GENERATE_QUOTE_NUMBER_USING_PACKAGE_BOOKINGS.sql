-- Create a quote number generator that works with package_bookings (no separate quotes table required)
-- Format: QT-YYYYMMDD-0001 (daily incremental)

CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  current_date_str TEXT;
  next_seq INTEGER := 1;
  candidate TEXT;
  attempts INTEGER := 0;
BEGIN
  current_date_str := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Determine next sequence for today from existing package_bookings (is_quote=true)
  SELECT COALESCE(MAX(
    CASE
      WHEN package_number ~ ('^QT-' || current_date_str || '-[0-9]+$')
      THEN CAST(SUBSTRING(package_number FROM LENGTH('QT-' || current_date_str || '-') + 1) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO next_seq
  FROM public.package_bookings
  WHERE is_quote = true AND package_number LIKE 'QT-' || current_date_str || '-%';

  -- Loop to ensure uniqueness in case of race
  LOOP
    attempts := attempts + 1;
    candidate := 'QT-' || current_date_str || '-' || LPAD(next_seq::TEXT, 4, '0');

    IF NOT EXISTS (
      SELECT 1 FROM public.package_bookings WHERE package_number = candidate
    ) THEN
      RETURN candidate;
    END IF;

    next_seq := next_seq + 1;
    IF attempts > 50 THEN
      -- Fallback unique variant
      RETURN 'QT-' || current_date_str || '-' || REPLACE(EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT, '-', '') || '-' || floor(random()*1000)::INT::TEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_quote_number() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_quote_number() TO service_role;

-- Quick test (optional)
-- SELECT generate_quote_number();
