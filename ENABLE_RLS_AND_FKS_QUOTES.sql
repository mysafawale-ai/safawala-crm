-- =====================================================================
-- SAFE ENABLEMENT: Foreign Keys + RLS for Quotes & Orders
-- Tables: product_orders, product_order_items, package_bookings, package_booking_items
-- Strategy: Add FKs as NOT VALID, clean data, VALIDATE, then enable RLS with policies
-- Run in Supabase SQL Editor with service role or as owner.
-- =====================================================================

begin;

-- ============================
-- 1) Create helpful indexes
-- ============================
-- Product orders
create index if not exists idx_product_orders_franchise on product_orders(franchise_id);
create index if not exists idx_product_order_items_order on product_order_items(order_id);
create index if not exists idx_product_order_items_product on product_order_items(product_id);
-- NOTE: Some schemas do not have franchise_id on items tables. Do not index a non-existent column.
-- create index if not exists idx_product_order_items_franchise on product_order_items(franchise_id);

-- Package bookings
create index if not exists idx_package_bookings_franchise on package_bookings(franchise_id);
create index if not exists idx_package_booking_items_booking on package_booking_items(booking_id);
create index if not exists idx_package_booking_items_package on package_booking_items(package_id);
create index if not exists idx_package_booking_items_variant on package_booking_items(variant_id);
-- NOTE: Some schemas do not have franchise_id on items tables. Do not index a non-existent column.
-- create index if not exists idx_package_booking_items_franchise on package_booking_items(franchise_id);

-- =====================================
-- 2) Add Foreign Keys (NOT VALID first)
-- =====================================
-- Product orders
alter table product_order_items
  drop constraint if exists fk_poi_order,
  add constraint fk_poi_order
    foreign key (order_id) references product_orders(id)
    on delete cascade
    not valid;

alter table product_order_items
  drop constraint if exists fk_poi_product,
  add constraint fk_poi_product
    foreign key (product_id) references products(id)
    on delete restrict
    not valid;

-- Package bookings
alter table package_booking_items
  drop constraint if exists fk_pbi_booking,
  add constraint fk_pbi_booking
    foreign key (booking_id) references package_bookings(id)
    on delete cascade
    not valid;

alter table package_booking_items
  drop constraint if exists fk_pbi_package,
  add constraint fk_pbi_package
    foreign key (package_id) references package_sets(id)
    on delete restrict
    not valid;

alter table package_booking_items
  drop constraint if exists fk_pbi_variant,
  add constraint fk_pbi_variant
    foreign key (variant_id) references package_variants(id)
    on delete restrict
    not valid;

-- =====================================================
-- 3) Orphan checks (READ-ONLY diagnostics)
--    Run these SELECTs to see problem rows before validating
-- =====================================================
-- Product order items without parent order
select 'orphan: product_order_items.order_id' as check, count(*) as rows
from product_order_items i
left join product_orders o on o.id = i.order_id
where o.id is null;

-- Product order items referencing missing product
select 'orphan: product_order_items.product_id' as check, count(*) as rows
from product_order_items i
left join products p on p.id = i.product_id
where p.id is null;

-- Package booking items without parent booking
select 'orphan: package_booking_items.booking_id' as check, count(*) as rows
from package_booking_items i
left join package_bookings b on b.id = i.booking_id
where b.id is null;

-- Package booking items referencing missing package/variant
select 'orphan: package_booking_items.package_id' as check, count(*) as rows
from package_booking_items i
left join package_sets ps on ps.id = i.package_id
where ps.id is null;

select 'orphan: package_booking_items.variant_id' as check, count(*) as rows
from package_booking_items i
left join package_variants v on v.id = i.variant_id
where v.id is null;

-- Optional: rows missing franchise_id (should be set)
select 'bad: product_orders.franchise_id is null' as check, count(*) from product_orders where franchise_id is null;
select 'bad: product_order_items.franchise_id is null' as check, count(*) from product_order_items where franchise_id is null;
select 'bad: package_bookings.franchise_id is null' as check, count(*) from package_bookings where franchise_id is null;
select 'bad: package_booking_items.franchise_id is null' as check, count(*) from package_booking_items where franchise_id is null;

-- =====================================================
-- 4) Suggested cleanup (commented) - choose one approach
-- =====================================================
-- Option A: DELETE orphans (simple & safe)
-- delete from product_order_items i
-- using product_orders o
-- where i.order_id is not null and o.id is null;
--
-- delete from product_order_items i
-- using products p
-- where i.product_id is not null and p.id is null;
--
-- delete from package_booking_items i
-- using package_bookings b
-- where i.booking_id is not null and b.id is null;
--
-- delete from package_booking_items i
-- using packages p
-- where i.package_id is not null and p.id is null;
--
-- delete from package_booking_items i
-- using package_variants v
-- where i.variant_id is not null and v.id is null;

-- Option B: BACKFILL franchise_id from parent (if null)
-- update product_order_items i
-- set franchise_id = o.franchise_id
-- from product_orders o
-- where i.franchise_id is null and o.id = i.order_id;
--
-- update package_booking_items i
-- set franchise_id = b.franchise_id
-- from package_bookings b
-- where i.franchise_id is null and b.id = i.booking_id;

-- =====================================
-- 5) Validate constraints (after cleanup)
-- =====================================
-- Run these only when orphan checks return 0
alter table product_order_items validate constraint fk_poi_order;
alter table product_order_items validate constraint fk_poi_product;
alter table package_booking_items validate constraint fk_pbi_booking;
alter table package_booking_items validate constraint fk_pbi_package;
alter table package_booking_items validate constraint fk_pbi_variant;

commit;

-- =====================================================================
-- 6) Enable RLS + Franchise policies (idempotent)
-- =====================================================================
-- Helper: current user's franchise (works under Supabase RLS context)
-- select (select franchise_id from users where id = auth.uid());

-- Product Orders
alter table product_orders enable row level security;

-- Drop existing policies if needed
drop policy if exists "po_select_franchise" on product_orders;
drop policy if exists "po_insert_franchise" on product_orders;
drop policy if exists "po_update_franchise" on product_orders;
drop policy if exists "po_delete_franchise" on product_orders;

-- Read: user can see rows in own franchise or super_admin sees all
create policy "po_select_franchise" on product_orders
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = product_orders.franchise_id
    ))
  );

-- Insert: row must match user's franchise (or super_admin)
create policy "po_insert_franchise" on product_orders
  for insert to authenticated
  with check (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = product_orders.franchise_id
    ))
  );

-- Update: same condition
create policy "po_update_franchise" on product_orders
  for update to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = product_orders.franchise_id
    ))
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = product_orders.franchise_id
    ))
  );

-- Delete: same condition
create policy "po_delete_franchise" on product_orders
  for delete to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = product_orders.franchise_id
    ))
  );

-- Product Order Items
alter table product_order_items enable row level security;

drop policy if exists "poi_select_franchise" on product_order_items;
drop policy if exists "poi_cud_franchise" on product_order_items;

create policy "poi_select_franchise" on product_order_items
  for select to authenticated
  using (
    exists (
      select 1
      from users u
      join product_orders po on po.id = product_order_items.order_id
      where u.id = auth.uid()
        and (
          u.role = 'super_admin' or u.franchise_id = po.franchise_id
        )
    )
  );

create policy "poi_cud_franchise" on product_order_items
  for all to authenticated
  using (
    exists (
      select 1
      from users u
      join product_orders po on po.id = product_order_items.order_id
      where u.id = auth.uid()
        and (
          u.role = 'super_admin' or u.franchise_id = po.franchise_id
        )
    )
  )
  with check (
    exists (
      select 1
      from users u
      join product_orders po on po.id = product_order_items.order_id
      where u.id = auth.uid()
        and (
          u.role = 'super_admin' or u.franchise_id = po.franchise_id
        )
    )
  );

-- Package Bookings
alter table package_bookings enable row level security;

drop policy if exists "pb_select_franchise" on package_bookings;
drop policy if exists "pb_insert_franchise" on package_bookings;
drop policy if exists "pb_update_franchise" on package_bookings;
drop policy if exists "pb_delete_franchise" on package_bookings;

create policy "pb_select_franchise" on package_bookings
  for select to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = package_bookings.franchise_id
    ))
  );

create policy "pb_insert_franchise" on package_bookings
  for insert to authenticated
  with check (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = package_bookings.franchise_id
    ))
  );

create policy "pb_update_franchise" on package_bookings
  for update to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = package_bookings.franchise_id
    ))
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = package_bookings.franchise_id
    ))
  );

create policy "pb_delete_franchise" on package_bookings
  for delete to authenticated
  using (
    exists (select 1 from users u where u.id = auth.uid() and (
      u.role = 'super_admin' or u.franchise_id = package_bookings.franchise_id
    ))
  );

-- Package Booking Items
alter table package_booking_items enable row level security;

drop policy if exists "pbi_select_franchise" on package_booking_items;
drop policy if exists "pbi_cud_franchise" on package_booking_items;

create policy "pbi_select_franchise" on package_booking_items
  for select to authenticated
  using (
    exists (
      select 1
      from users u
      join package_bookings pb on pb.id = package_booking_items.booking_id
      where u.id = auth.uid()
        and (
          u.role = 'super_admin' or u.franchise_id = pb.franchise_id
        )
    )
  );

create policy "pbi_cud_franchise" on package_booking_items
  for all to authenticated
  using (
    exists (
      select 1
      from users u
      join package_bookings pb on pb.id = package_booking_items.booking_id
      where u.id = auth.uid()
        and (
          u.role = 'super_admin' or u.franchise_id = pb.franchise_id
        )
    )
  )
  with check (
    exists (
      select 1
      from users u
      join package_bookings pb on pb.id = package_booking_items.booking_id
      where u.id = auth.uid()
        and (
          u.role = 'super_admin' or u.franchise_id = pb.franchise_id
        )
    )
  );

-- =====================================================================
-- 7) Notes
-- - If you perform admin/batch operations, use the Supabase service key (bypasses RLS)
-- - Keep FK ON DELETE CASCADE so child rows are removed with parent
-- - If VALIDATE fails, re-run orphan checks and clean up
-- =====================================================================
