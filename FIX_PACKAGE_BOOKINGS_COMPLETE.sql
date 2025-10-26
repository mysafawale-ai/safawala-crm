-- Comprehensive fix for package_bookings table - add all missing columns
-- Run this to ensure all columns needed for booking/quote creation exist

DO $$ 
BEGIN
  -- Add is_quote column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'is_quote'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN is_quote BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_quote column';
  END IF;

  -- Add distance_km column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'distance_km'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN distance_km NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE 'Added distance_km column';
  END IF;

  -- Add distance_amount column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'distance_amount'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN distance_amount NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added distance_amount column';
  END IF;

  -- Add security_deposit column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'security_deposit'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN security_deposit NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added security_deposit column';
  END IF;

  -- Add sales_closed_by_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'sales_closed_by_id'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN sales_closed_by_id UUID REFERENCES users(id);
    RAISE NOTICE 'Added sales_closed_by_id column';
  END IF;

  -- Add use_custom_pricing column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'use_custom_pricing'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN use_custom_pricing BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added use_custom_pricing column';
  END IF;

  -- Add custom_package_price column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'custom_package_price'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN custom_package_price NUMERIC(12,2);
    RAISE NOTICE 'Added custom_package_price column';
  END IF;

  -- Add discount_type column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN discount_type VARCHAR(20) DEFAULT 'flat';
    RAISE NOTICE 'Added discount_type column';
  END IF;

  -- Add discount_amount column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN discount_amount NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added discount_amount column';
  END IF;

  -- Add coupon_code column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN coupon_code VARCHAR(50);
    RAISE NOTICE 'Added coupon_code column';
  END IF;

  -- Add coupon_discount column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'coupon_discount'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN coupon_discount NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added coupon_discount column';
  END IF;

  -- Add custom_amount column if missing (for partial payments)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_bookings' 
    AND column_name = 'custom_amount'
  ) THEN
    ALTER TABLE public.package_bookings 
    ADD COLUMN custom_amount NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added custom_amount column';
  END IF;

END $$;

-- Now fix the RLS policies with proper WITH CHECK clauses
DROP POLICY IF EXISTS "super_admin_all_package_bookings" ON package_bookings;
DROP POLICY IF EXISTS "franchise_users_own_package_bookings" ON package_bookings;

ALTER TABLE package_bookings ENABLE ROW LEVEL SECURITY;

-- Policy 1: Super admins can do everything
CREATE POLICY "super_admin_all_package_bookings" ON package_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

-- Policy 2: Franchise users can only access their franchise's bookings
CREATE POLICY "franchise_users_own_package_bookings" ON package_bookings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = package_bookings.franchise_id
    AND users.is_active = true
    AND users.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.franchise_id = package_bookings.franchise_id
    AND users.is_active = true
    AND users.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
);

-- Also ensure package_booking_items has correct columns
DO $$ 
BEGIN
  -- Add distance_addon column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_booking_items' 
    AND column_name = 'distance_addon'
  ) THEN
    ALTER TABLE public.package_booking_items 
    ADD COLUMN distance_addon NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added distance_addon column to package_booking_items';
  END IF;

  -- Add security_deposit column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'package_booking_items' 
    AND column_name = 'security_deposit'
  ) THEN
    ALTER TABLE public.package_booking_items 
    ADD COLUMN security_deposit NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE 'Added security_deposit column to package_booking_items';
  END IF;
END $$;

-- Fix package_booking_items RLS policies
DROP POLICY IF EXISTS "super_admin_all_package_booking_items" ON package_booking_items;
DROP POLICY IF EXISTS "franchise_users_own_package_booking_items" ON package_booking_items;

ALTER TABLE package_booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admin_all_package_booking_items" ON package_booking_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
    AND users.is_active = true
  )
);

CREATE POLICY "franchise_users_own_package_booking_items" ON package_booking_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    INNER JOIN users u ON u.id = auth.uid()
    WHERE pb.id = package_booking_items.booking_id
    AND pb.franchise_id = u.franchise_id
    AND u.is_active = true
    AND u.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM package_bookings pb
    INNER JOIN users u ON u.id = auth.uid()
    WHERE pb.id = package_booking_items.booking_id
    AND pb.franchise_id = u.franchise_id
    AND u.is_active = true
    AND u.role IN ('franchise_admin', 'franchise_owner', 'staff')
  )
);

-- Verify the schema
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'package_bookings'
ORDER BY ordinal_position;

-- Verify policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('package_bookings', 'package_booking_items')
ORDER BY tablename, policyname;
