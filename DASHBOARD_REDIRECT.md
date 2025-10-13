# Dashboard redirect when not logged in

This project uses Next.js middleware to redirect unauthenticated visits to the dashboard back to the main website domain.

- File: `middleware.ts`
- Behavior: If a user visits `/dashboard` (or any subpath) without a `safawala_session` cookie, they are redirected to:
  - Production: `https://mysafawala.com/`
  - Local development: `/` (keeps local dev simple)
- Scope: Limited to dashboard routes via `matcher: ["/dashboard/:path*"]` so it doesn't affect APIs or other pages.

## Customize

- Change the destination domain
  - In `middleware.ts`, update the `new URL("https://mysafawala.com/")` value.
- Protect more pages
  - Extend the matcher, for example: `matcher: ["/dashboard/:path*", "/bookings/:path*", "/customers/:path*"]`.
- Tighten auth check
  - Currently the middleware checks for the presence of the `safawala_session` cookie. If you want stricter validation, parse the cookie and validate expected fields (e.g., `id`) before allowing access.

## Notes

- The login flow sets `safawala_session` in `/api/auth/login`.
- The cookie has a 24h max age. Logging out clears it via `/api/auth/logout`.