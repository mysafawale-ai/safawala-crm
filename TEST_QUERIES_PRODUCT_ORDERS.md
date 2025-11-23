# Test Queries for Product Orders & Rentals

## Run These in Supabase SQL Editor to Check Your Data

### 1. Check Direct Sales (Should show your DSL records)
```sql
SELECT 
  id,
  sale_number,
  customer_id,
  franchise_id,
  total_amount,
  created_at
FROM direct_sales_orders
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: Shows your 2 DSL orders

---

### 2. Check Product Rentals (rental orders)
```sql
SELECT 
  id,
  order_number,
  customer_id,
  franchise_id,
  booking_type,
  is_quote,
  total_amount,
  created_at
FROM product_orders
WHERE booking_type = 'rental' AND is_quote = false
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: Shows rental orders if you've created any

---

### 3. Check Direct Sales Orders (as sales in product_orders)
```sql
SELECT 
  id,
  order_number,
  customer_id,
  franchise_id,
  booking_type,
  is_quote,
  total_amount,
  created_at
FROM product_orders
WHERE booking_type = 'sale' AND is_quote = false
ORDER BY created_at DESC
LIMIT 10;
```

**Expected**: Shows sales from product_orders table

---

### 4. Check Your Franchise ID
```sql
SELECT 
  u.id,
  u.name,
  u.franchise_id,
  f.name as franchise_name
FROM users u
LEFT JOIN franchises f ON f.id = u.franchise_id
WHERE u.is_active = true
LIMIT 10;
```

**Expected**: Shows your user and franchise ID. Make sure the orders have the SAME franchise_id

---

### 5. Check if product_orders_all VIEW exists
```sql
SELECT * FROM product_orders_all LIMIT 5;
```

**Expected**: Shows combined rentals and direct sales

---

## Troubleshooting

If rentals show 0 count:
- Check if your user's `franchise_id` matches the franchise_id in product_orders table
- Make sure you created a rental (not just direct sale)
- Check if `booking_type='rental'` is being set correctly
