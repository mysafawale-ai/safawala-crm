-- EMERGENCY OPEN: Temporarily unblock package bookings by disabling RLS
-- Use this when RLS is blocking inserts/reads and you need an immediate fix.
-- Run this in Supabase SQL editor (Production) to take effect.
-- NOTE: This reduces security. Plan to restore proper RLS once you confirm flows.

begin;

-- Disable RLS on the affected tables (safe to re-run)
alter table if exists public.package_bookings disable row level security;
alter table if exists public.package_booking_items disable row level security;

-- Optional: keep policies for later restore; no need to drop them because RLS is disabled.
-- If you still want to drop all existing policies to declutter, uncomment the block below.
-- do $$
-- declare r record;
-- begin
--   for r in
--     select schemaname, tablename, policyname
--     from pg_policies
--     where schemaname='public' and tablename in ('package_bookings','package_booking_items')
--   loop
--     execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
--   end loop;
-- end $$;

commit;

-- QUICK CHECKS
-- select relname, relrowsecurity from pg_class where relname in ('package_bookings','package_booking_items');
-- Expect relrowsecurity = false for both tables
