# Quick Start: Add Demo Inventory

## Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com
2. Open your project: safawala-crm
3. Click "SQL Editor" in the left sidebar

## Step 2: Run the Demo Script
1. Click "New Query"
2. Open this file: `scripts/inventory/add-demo-inventory-mysafawale.sql`
3. Copy the entire contents
4. Paste into Supabase SQL Editor
5. Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

## Step 3: Verify Results
You should see output similar to:
```
NOTICE: Franchise ID: 95168a3d-a6a5-4f9b-bbe2-7b88c7cef050
NOTICE: User ID: [some-uuid]
NOTICE: Inserting demo products...
NOTICE: Successfully added 10 demo products for franchise: [franchise-id]

=== DEMO INVENTORY ADDED ===
total_products: 10
total_stock: 77
available_stock: 68
booked_stock: 9

=== PRODUCT LIST ===
[List of 10 products with details]

=== INVENTORY BY CATEGORY ===
Wedding Wear: 7 products
Accessories: 2 products
Party Wear: 1 product
```

## Step 4: Test in Application
1. Open http://localhost:3000
2. Login as: `mysafawale@gmail.com`
3. Navigate to: Inventory page
4. You should see: **10 demo products**

## Troubleshooting

### Error: "Franchise not found for mysafawale@gmail.com"
**Solution**: Check if mysafawale@gmail.com user exists and has a franchise_id:
```sql
SELECT id, email, franchise_id 
FROM users 
WHERE email = 'mysafawale@gmail.com';
```

### Error: "duplicate key value violates unique constraint"
**Solution**: Products already exist. To reset:
```sql
-- Delete existing demo products for this franchise
DELETE FROM products 
WHERE franchise_id = (
  SELECT franchise_id 
  FROM users 
  WHERE email = 'mysafawale@gmail.com'
)
AND product_code LIKE 'PROD-%';
```

### No Products Showing in App
**Checklist**:
1. ✅ Script ran successfully (no errors)
2. ✅ Logged in as mysafawale@gmail.com
3. ✅ On the Inventory page (/inventory)
4. ✅ Check browser console for errors (F12)
5. ✅ Verify franchise_id matches:
```sql
SELECT p.name, p.franchise_id, u.franchise_id as user_franchise_id
FROM products p, users u
WHERE u.email = 'mysafawale@gmail.com'
AND p.franchise_id = u.franchise_id
LIMIT 5;
```

## Expected Demo Inventory

| # | Product Name | Brand | Category | Rental Price | Stock |
|---|-------------|-------|----------|--------------|-------|
| 1 | Royal Blue Sherwani Set | Manyavar | Wedding Wear | ₹5,000 | 5 |
| 2 | Red Bridal Lehenga with Dupatta | Sabyasachi | Wedding Wear | ₹15,000 | 3 |
| 3 | Cream Silk Kurta Pajama | Raymond | Wedding Wear | ₹2,500 | 10 |
| 4 | Pink Designer Banarasi Saree | Nalli Silks | Wedding Wear | ₹6,000 | 6 |
| 5 | Black Indo-Western Jacket Set | Manish Malhotra | Wedding Wear | ₹3,500 | 4 |
| 6 | Green Anarkali Suit Set | Fabindia | Wedding Wear | ₹3,000 | 7 |
| 7 | Traditional Wedding Turban (Safa) | Traditional | Wedding Wear | ₹1,000 | 15 |
| 8 | Kundan Bridal Jewelry Set | Tanishq | Accessories | ₹8,000 | 3 |
| 9 | Embroidered Wedding Jooti | Kolhapuri | Accessories | ₹500 | 20 |
| 10 | Navy Blue Evening Gown | Zara | Party Wear | ₹4,000 | 4 |

**Total Rental Value**: ₹48,500

---

**Next**: Test adding/editing products to verify franchise isolation!
