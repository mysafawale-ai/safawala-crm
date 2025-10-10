-- Migration: Split unified bookings into product_orders and package_bookings
-- Safety: Run in transaction
-- Note: Does NOT drop existing bookings tables; keeps legacy for historical data.
--        You can later backfill or build views if needed.

begin;

-- 1. product_orders table
create table if not exists product_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- e.g. ORD123456
  customer_id uuid not null references customers(id) on delete restrict,
  franchise_id uuid not null references franchises(id) on delete restrict,
  booking_type text not null check (booking_type in ('rental','sale')),
  event_type text,
  event_participant text, -- NEW: Groom/Bride/Both
  payment_type text not null check (payment_type in ('full','advance','partial')),
  event_date timestamptz not null,
  delivery_date timestamptz,
  return_date timestamptz,
  venue_address text,
  groom_name text,
  groom_whatsapp text, -- NEW: Groom additional WhatsApp
  groom_address text, -- NEW: Groom home address
  bride_name text,
  bride_whatsapp text, -- NEW: Bride additional WhatsApp
  bride_address text, -- NEW: Bride home address
  notes text,
  tax_amount numeric(12,2) default 0,
  subtotal_amount numeric(12,2) default 0,
  total_amount numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  pending_amount numeric(12,2) default 0,
  status text not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_orders_customer on product_orders(customer_id);
create index if not exists idx_product_orders_event_date on product_orders(event_date);
create index if not exists idx_product_orders_status on product_orders(status);

create or replace function trg_product_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_product_orders on product_orders;
create trigger set_timestamp_product_orders
before update on product_orders
for each row
execute function trg_product_orders_updated_at();

-- 2. product_order_items table
create table if not exists product_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references product_orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  security_deposit numeric(12,2) default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_product_order_items_order on product_order_items(order_id);
create index if not exists idx_product_order_items_product on product_order_items(product_id);

-- 3. package_bookings table
create table if not exists package_bookings (
  id uuid primary key default gen_random_uuid(),
  package_number text not null unique, -- e.g. PKG123456
  customer_id uuid not null references customers(id) on delete restrict,
  franchise_id uuid not null references franchises(id) on delete restrict,
  event_type text,
  event_participant text, -- NEW: Groom/Bride/Both
  payment_type text not null check (payment_type in ('full','advance','partial')),
  event_date timestamptz not null,
  delivery_date timestamptz,
  return_date timestamptz,
  venue_address text,
  groom_name text,
  groom_whatsapp text, -- NEW: Groom additional WhatsApp
  groom_address text, -- NEW: Groom home address
  bride_name text,
  bride_whatsapp text, -- NEW: Bride additional WhatsApp
  bride_address text, -- NEW: Bride home address
  notes text,
  tax_amount numeric(12,2) default 0,
  subtotal_amount numeric(12,2) default 0,
  total_amount numeric(12,2) not null,
  amount_paid numeric(12,2) default 0,
  pending_amount numeric(12,2) default 0,
  status text not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_package_bookings_customer on package_bookings(customer_id);
create index if not exists idx_package_bookings_event_date on package_bookings(event_date);
create index if not exists idx_package_bookings_status on package_bookings(status);

create or replace function trg_package_bookings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp_package_bookings on package_bookings;
create trigger set_timestamp_package_bookings
before update on package_bookings
for each row
execute function trg_package_bookings_updated_at();

-- 4. package_booking_items table (each selected package + variant + optional selected products list)
create table if not exists package_booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references package_bookings(id) on delete cascade,
  package_id uuid not null references package_sets(id) on delete restrict,
  variant_id uuid not null references package_variants(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) not null,
  extra_safas integer default 0,
  selected_products uuid[] default '{}',
  created_at timestamptz not null default now()
);
create index if not exists idx_package_booking_items_booking on package_booking_items(booking_id);
create index if not exists idx_package_booking_items_package on package_booking_items(package_id);

commit;
