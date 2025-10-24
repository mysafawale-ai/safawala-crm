# Built-in Test Service

A lightweight test runner is now available as an API endpoint to validate critical CRM behaviors from within the app context (using the current session).

## Endpoint

GET /api/tests

- Query parameters:
  - suite: Repeatable. Choose from `auth`, `customers`, or `all`. Default: `auth`.
  - customerId: Optional for customers tests. Provide a valid customer UUID you can access.

Examples:

- Run core auth check:
  - /api/tests
  - /api/tests?suite=auth

- Run customers checks for a specific customer (ETag + Vary):
  - /api/tests?suite=customers&customerId=<customer_uuid>

- Run everything:
  - /api/tests?suite=all&customerId=<customer_uuid>

## What it tests today

- Auth
  - Confirms Supabase Auth session is visible to the server via `/api/auth/user` (expects 200).

- Customers
  - Validates ETag handling on `/api/customers/[id]` (expects 200 then 304 with `If-None-Match`).
  - Ensures `Vary` header includes `Cookie`.

Each test returns pass/fail/skip with timing and details.

## How it works

- The service reuses your current browser cookies and calls internal API endpoints.
- Responses are aggregated into a structured JSON summary suitable for dashboards, logs, or CI smoke checks.

## Extending

Add new suites or cases under `lib/testing/tests/` and register them in `lib/testing/runner.ts`.

- Interface types live in `lib/testing/types.ts`.
- Use `lib/testing/http.ts` for internal fetch calls.

## Notes

- Tests are read-only and avoid mutating data. Add write tests only with care and proper cleanup.
- The endpoint is dynamic and not cached.
