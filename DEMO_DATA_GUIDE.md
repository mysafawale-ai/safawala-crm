# Demo Data Seeding Guide

## Overview
This script adds 50 demo products and 6 package sets with variants to your database for testing and demonstration purposes.

## What's Included

### Products (50 items)
- **Sherwani Collection** - 15 premium items (₹6,000 - ₹9,500 rental)
- **Kurta Collection** - 10 traditional items (₹2,000 - ₹3,200 rental)
- **Safa/Turban Collection** - 10 colorful items (₹1,500 - ₹2,200 rental)
- **Jooti/Shoes Collection** - 8 stylish pairs (₹1,000 - ₹1,300 rental)
- **Accessories** - 7 complementary items (₹300 - ₹1,500 rental)

### Package Sets (6 packages, 16 variants)
1. **Royal Groom Package** - ₹15,000-22,000 (Standard/Premium/Deluxe)
2. **Classic Groom Package** - ₹12,000-17,000 (Basic/Standard/Premium)
3. **Wedding Special Package** - ₹20,000-30,000 (Gold/Platinum/Diamond)
4. **Budget Groom Package** - ₹8,000-10,000 (Economy/Standard)
5. **Sangeet Special Package** - ₹10,000-13,000 (Basic/Premium)
6. **Destination Wedding Package** - ₹18,000-28,000 (Standard/Deluxe/Royal)

## How to Run

### Option 1: Supabase SQL Editor (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire content of `SEED_DEMO_DATA.sql`
5. Paste it into the editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for completion (should take 5-10 seconds)
8. Check the summary at the bottom showing counts

### Option 2: Command Line (psql)

```bash
# If you have direct database access
psql -h <your-host> -U postgres -d postgres -f SEED_DEMO_DATA.sql
```

### Option 3: Supabase CLI

```bash
supabase db reset --db-url "<your-connection-string>"
```

## Verification

After running the script, verify the data:

### Check Products
```sql
SELECT category, COUNT(*) as count, 
       AVG(rental_price) as avg_rental,
       SUM(stock_available) as total_stock
FROM products
GROUP BY category
ORDER BY category;
```

### Check Packages
```sql
SELECT ps.name, 
       COUNT(pv.id) as variants,
       MIN(pv.base_price) as min_price,
       MAX(pv.base_price) as max_price
FROM package_sets ps
LEFT JOIN package_variants pv ON ps.id = pv.package_id
GROUP BY ps.id, ps.name
ORDER BY ps.name;
```

### Quick Count
```sql
SELECT 
  (SELECT COUNT(*) FROM products) as total_products,
  (SELECT COUNT(*) FROM package_sets) as total_packages,
  (SELECT COUNT(*) FROM package_variants) as total_variants;
```

## Expected Results

After successful execution:
- ✅ 50 products added across 5 categories
- ✅ 6 package sets created
- ✅ 16 package variants added
- ✅ All items assigned to default franchise
- ✅ All items have unique product/package codes

## Testing the Data

### In Product Order Page
1. Go to `/create-product-order`
2. Click "Add Product" button
3. Search for products (e.g., "Sherwani", "Kurta", "Safa")
4. You should see multiple options with prices

### In Package Booking Page
1. Go to `/book-package`
2. Select Package dropdown
3. You should see 6 package options
4. Select a package to see its variants

## Data Characteristics

### Product Categories
- **Sherwani**: High-value items (₹25,000 - ₹45,000 sale price)
- **Kurta**: Medium-value items (₹6,500 - ₹10,000 sale price)
- **Safa**: Accessories (₹4,500 - ₹6,500 sale price)
- **Jooti**: Low-mid value (₹3,000 - ₹3,800 sale price)
- **Accessories**: Complementary items (₹800 - ₹4,500 sale price)

### Stock Levels
- Sherwanis: 3-8 units each
- Kurtas: 8-15 units each
- Safas: 12-20 units each
- Jootis: 22-30 units each
- Accessories: 12-25 units each

### Package Pricing
- Budget: ₹8,000 - ₹10,000
- Mid-range: ₹12,000 - ₹18,000
- Premium: ₹20,000 - ₹30,000

## Customization

### Change Franchise ID
If you want to assign products to a different franchise:

```sql
-- Replace the franchise_id in the DO block at the top of the script
DECLARE
  default_franchise_id UUID := 'YOUR-FRANCHISE-ID-HERE';
```

### Adjust Prices
Edit the INSERT statements to change rental_price, sale_price, or security_deposit values.

### Add More Products
Copy any INSERT INTO products statement and modify the values:

```sql
INSERT INTO products (name, category, rental_price, sale_price, security_deposit, stock_available, franchise_id, product_code)
VALUES ('New Product Name', 'Category', 5000, 20000, 3000, 10, default_franchise_id, 'PRD' || floor(random() * 100000000)::text);
```

## Cleanup (if needed)

To remove all demo data:

```sql
-- Delete all products added in last hour (adjust time as needed)
DELETE FROM products WHERE created_at > NOW() - INTERVAL '1 hour';

-- Delete all package variants
DELETE FROM package_variants 
WHERE package_id IN (
  SELECT id FROM package_sets WHERE created_at > NOW() - INTERVAL '1 hour'
);

-- Delete all package sets added in last hour
DELETE FROM package_sets WHERE created_at > NOW() - INTERVAL '1 hour';
```

## Troubleshooting

### Error: "relation does not exist"
- Ensure you've run the main migration scripts first
- Check if `products` and `package_sets` tables exist

### Error: "duplicate key value"
- The script generates random codes, should be unique
- If error persists, manually increment the random seed

### No data showing in UI
- Clear browser cache and reload
- Check Supabase logs for any errors
- Verify franchise_id matches your current user's franchise

### Products not appearing in dropdowns
- Refresh the page
- Check browser console for API errors
- Verify stock_available > 0

## Production Use

⚠️ **Important**: This is DEMO data for testing purposes.

For production:
1. Don't use this script directly
2. Import real product inventory
3. Set accurate pricing
4. Use proper product codes
5. Add product images
6. Set correct stock levels

## Support

If you encounter issues:
1. Check Supabase logs
2. Verify database schema matches migrations
3. Ensure proper RLS policies are set
4. Test with a simple SELECT query first

---

**Created**: October 2025  
**Version**: 1.0  
**Products**: 50  
**Packages**: 6  
**Variants**: 16
