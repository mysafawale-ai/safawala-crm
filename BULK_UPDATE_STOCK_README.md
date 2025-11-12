# Bulk Update Product Stock Script

This script allows you to update all product stock quantities to a specified value across all franchises or for a specific franchise.

## Usage

### Using npm/pnpm script (recommended)
```bash
# Update all products to 600 (default)
pnpm stock:update

# Update all products to a specific quantity
pnpm stock:update 1000

# Update products for a specific franchise
pnpm stock:update 600 franchise-123
```

### Using Node.js directly
```bash
# Update all products to 600 (default)
node scripts/bulk-update-stock.js

# Update all products to a specific quantity
node scripts/bulk-update-stock.js 1000

# Update products for a specific franchise
node scripts/bulk-update-stock.js 600 franchise-123
```

## Requirements

- Set the following environment variables:
  - `SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

## API Endpoint

The script uses the `/api/products/bulk-update-stock` endpoint which:

- **POST**: Updates stock quantities
  - Body: `{ "stock_quantity": 600, "franchise_id": "optional" }`
  - Requires super admin authentication

- **GET**: Returns current stock statistics
  - Returns total products, average stock, min/max stock, etc.

## What it does

1. Updates `stock_available` and `stock_total` fields for all products
2. Sets `updated_at` timestamp
3. Provides before/after statistics
4. Can target all franchises or a specific franchise

## Safety

- Requires super admin authentication
- Shows statistics before and after the update
- Only updates active products (`is_active = true`)

## Examples

```bash
# Check current stock statistics
curl -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     http://localhost:3000/api/products/bulk-update-stock

# Update all products to 600
curl -X POST \
     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"stock_quantity": 600}' \
     http://localhost:3000/api/products/bulk-update-stock
```