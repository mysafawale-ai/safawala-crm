-- Add updated_at to package_bookings and package_booking_items with triggers

-- package_bookings.updated_at
ALTER TABLE IF EXISTS public.package_bookings
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- package_booking_items.updated_at
ALTER TABLE IF EXISTS public.package_booking_items
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- update function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger for package_bookings
DROP TRIGGER IF EXISTS trg_package_bookings_updated_at ON public.package_bookings;
CREATE TRIGGER trg_package_bookings_updated_at
  BEFORE UPDATE ON public.package_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- trigger for package_booking_items
DROP TRIGGER IF EXISTS trg_package_booking_items_updated_at ON public.package_booking_items;
CREATE TRIGGER trg_package_booking_items_updated_at
  BEFORE UPDATE ON public.package_booking_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('package_bookings','package_booking_items')
  AND column_name = 'updated_at'
ORDER BY table_name;