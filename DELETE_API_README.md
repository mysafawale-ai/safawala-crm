# Unified Delete API

Endpoint: POST /api/delete

Purpose: Centralized deletion handler with soft-delete by default and hard-delete fallback, supporting vendors and customers. Applies auth and franchise checks.

Request body:
{
  "entity": "vendor" | "vendors" | "customer" | "customers",
  "id": "<uuid>",
  "hard": false // optional; when true, performs hard delete
}

Behavior:
- Soft delete preferred (sets is_active=false and updates updated_at) when the column exists.
- If is_active column is missing, falls back to hard delete.
- Vendors: prevents deletion if there are active purchases (pending/partial).
- Auth: only super_admin, franchise_admin, and staff can delete; non-super admins must match franchise_id if present.

Responses:
- 200: { message, record? }
- 401/403/404/409/500 with { error } per scenario

Notes:
- Keep using this API for future entities; extend ENTITY_TABLE_MAP as needed.
- Vendors UI is wired to this endpoint already.
