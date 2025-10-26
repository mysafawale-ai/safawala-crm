-- Add variant_name and variant_inclusions to package_booking_items so inclusions edited in the UI persist per item.
-- Safe to run multiple times.

begin;

-- Ensure category_id exists on package_booking_items (modern schema uses category/variant instead of legacy package_id)
alter table if exists public.package_booking_items
  add column if not exists category_id uuid references public.packages_categories(id) on delete restrict;

-- Add variant_name for snapshotting the chosen variant label at booking time
alter table if exists public.package_booking_items
  add column if not exists variant_name text;

-- Add variant_inclusions to store per-item custom/default inclusions
alter table if exists public.package_booking_items
  add column if not exists variant_inclusions jsonb default '[]'::jsonb;

-- Optional indexes for faster filtering
create index if not exists idx_package_booking_items_category on public.package_booking_items(category_id);
create index if not exists idx_package_booking_items_variant on public.package_booking_items(variant_id);

-- Backfill variant_name and variant_inclusions where missing using package_variants
update public.package_booking_items pbi
set 
  -- Avoid referencing columns that may not exist by using row_to_json
  variant_name = coalesce(
    pbi.variant_name,
    (row_to_json(pv)->>'name'),
    (row_to_json(pv)->>'variant_name')
  ),
  -- Safely coerce inclusions: support json/jsonb, text[], or comma-separated text
  variant_inclusions = coalesce(
    nullif(pbi.variant_inclusions, '[]'::jsonb),
    case 
      when pv.inclusions is null then '[]'::jsonb
      -- If it's a plain text field, split on commas into an array then to jsonb
      when pg_typeof(pv.inclusions)::text = 'text' then to_jsonb(regexp_split_to_array(pv.inclusions::text, '\\s*,\\s*'))
      -- For json/jsonb or text[] (or any array), let to_jsonb handle conversion safely
      else to_jsonb(pv.inclusions)
    end
  )
from public.package_variants pv
where pv.id = pbi.variant_id
  and (pbi.variant_name is null or pbi.variant_inclusions is null or pbi.variant_inclusions = '[]'::jsonb);

commit;
