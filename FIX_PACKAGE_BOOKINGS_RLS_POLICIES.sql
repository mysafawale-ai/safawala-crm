-- RLS policies for package_bookings and package_booking_items
-- Idempotent: drops existing policies and (re)creates a clear, franchise-isolated set
-- Access model:
--   - super_admin: full access to all rows
--   - franchise roles (franchise_admin, franchise_owner, staff): access only rows matching their users.franchise_id
-- Auth scope: TO authenticated

-- Enable RLS on both tables
ALTER TABLE IF EXISTS public.package_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.package_booking_items ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on these tables to avoid conflicts/duplicates
DO $$
BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'public' AND tablename IN ('package_bookings','package_booking_items')
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.package_bookings';
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.package_booking_items';
  END LOOP;
END$$;

-- PACKAGE_BOOKINGS: super_admin full access
CREATE POLICY pb_super_admin_all ON public.package_bookings
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
      AND u.is_active = TRUE
      AND u.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
      AND u.is_active = TRUE
      AND u.role = 'super_admin'
  )
);

-- PACKAGE_BOOKINGS: franchise-scoped access
CREATE POLICY pb_franchise_access ON public.package_bookings
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.is_active = TRUE
      AND u.role IN ('franchise_admin','franchise_owner','staff')
      AND u.franchise_id = package_bookings.franchise_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.is_active = TRUE
      AND u.role IN ('franchise_admin','franchise_owner','staff')
      AND u.franchise_id = package_bookings.franchise_id
  )
);

-- PACKAGE_BOOKING_ITEMS: super_admin full access
CREATE POLICY pbi_super_admin_all ON public.package_booking_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
      AND u.is_active = TRUE
      AND u.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() 
      AND u.is_active = TRUE
      AND u.role = 'super_admin'
  )
);

-- PACKAGE_BOOKING_ITEMS: franchise-scoped via parent booking
CREATE POLICY pbi_franchise_access ON public.package_booking_items
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.package_bookings pb
    JOIN public.users u ON u.id = auth.uid()
    WHERE pb.id = package_booking_items.booking_id
      AND u.is_active = TRUE
      AND u.role IN ('franchise_admin','franchise_owner','staff')
      AND pb.franchise_id = u.franchise_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.package_bookings pb
    JOIN public.users u ON u.id = auth.uid()
    WHERE pb.id = package_booking_items.booking_id
      AND u.is_active = TRUE
      AND u.role IN ('franchise_admin','franchise_owner','staff')
      AND pb.franchise_id = u.franchise_id
  )
);

-- Optional: quick verification
SELECT schemaname, tablename, policyname, cmd, roles, permissive
FROM pg_policies
WHERE tablename IN ('package_bookings','package_booking_items')
ORDER BY tablename, policyname;