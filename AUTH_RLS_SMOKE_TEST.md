# Auth & RLS Smoke Test

This repo includes an SQL-based smoke test to validate Row Level Security (RLS) coverage and basic tenant isolation for the CRM.

## Files
- `scripts/rls-smoke-test.sql` — quick, idempotent checks that:
  - Show RLS enabled status and policies
  - Simulate JWT claims for different roles
  - Verify that a user with a random franchise does NOT see other tenant rows
  - Surface red flags like "Enable all for authenticated users" policies
- `scripts/rls-improvements-template.sql` — copy/paste policy patterns to tighten security per table.

## How to run

1) In Supabase SQL Editor (or psql), run:
- `scripts/rls-smoke-test.sql`

2) Review the output:
- `[LEAK] <table>` means RLS likely allows cross-tenant read access
- `RLS enabled = false` means the table is not protected
- Policies named `Enable all for authenticated users` are overly broad

## Interpreting results

- If you see leaks on tenant tables (`customers`, `products`, `bookings`, etc.), replace the broad policies with the template in `scripts/rls-improvements-template.sql`.
- Laundry tables currently have RLS disabled in `setup-laundry-management.sql` — you should enable RLS and use tenant policies before going live.
- If `deliveries` exists without policies, add RLS and tenant policies.

## Next steps (recommended)

- Add `jwt_franchise_id()` and `app_is_super_admin()` helpers once and reuse in all policies.
- Replace all "Enable all for authenticated users" policies with action-specific, tenant-scoped policies.
- For tables lacking `franchise_id` (e.g., `vendors`), either add it or restrict writes to super admins only.
- Add BEFORE INSERT/UPDATE triggers to set `created_by = auth.uid()` and validate non-null where applicable.

## Optional: CI guard

- Add a CI step that runs a policy linter (simple SQL) to fail if any `public` tables are `rls_enabled = false` or have zero policies.
