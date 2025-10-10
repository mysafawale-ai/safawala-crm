# 🚀 Quick Start: Add Demo Inventory

## Step 1: Run the SQL Script

### Option A: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Copy the script from: `scripts/inventory/add-demo-inventory-mysafawale.sql`
6. Paste into editor
7. Click "Run" (or press Cmd/Ctrl + Enter)
8. Wait for success message: "✅ Successfully added 8 demo products"

### Option B: Via Terminal (if you have psql)
```bash
# If you have database URL in environment
psql $DATABASE_URL -f scripts/inventory/add-demo-inventory-mysafawale.sql
```

---

## Step 2: Test the Inventory

### Test as Franchise Admin (mysafawale@gmail.com):
```
1. Login: http://localhost:3000
   Email: mysafawale@gmail.com
   Password: [your password]

2. Navigate to: Inventory → Inventory Management
   URL: http://localhost:3000/inventory

3. Expected Results:
   ✅ See 8 demo products
   ✅ All products belong to "Dahod ni Branch"
   ✅ Total stock: 31 items, 27 available, 2 booked
   
4. Try adding a new product:
   - Click "Add Product"
   - Fill form
   - Save
   - ✅ Product auto-assigned to your franchise
   
5. Try editing a product:
   - Click on any product → Edit
   - Make changes
   - Save
   - ✅ Changes saved successfully
```

### Test as Super Admin (admin@safawala.com):
```
1. Logout and login as: admin@safawala.com

2. Navigate to: http://localhost:3000/inventory

3. Expected Results:
   ✅ See ALL products from ALL franchises
   ✅ See mysafawale products + other franchise products
   ✅ Can edit ANY product from ANY franchise
```

---

## Step 3: Verify Isolation

### Quick Verification Query (Run in Supabase SQL Editor):
```sql
-- Check mysafawale inventory
SELECT 
    COUNT(*) as total_products,
    f.name as franchise_name,
    f.code as franchise_code
FROM products p
JOIN franchises f ON p.franchise_id = f.id
JOIN users u ON u.franchise_id = f.id
WHERE u.email = 'mysafawale@gmail.com'
GROUP BY f.name, f.code;

-- Expected: 8 products for "Dahod ni Branch" (DHD)
```

---

## 📦 Demo Products Summary

**5 Sherwanis (Groom Wear):**
- Royal Blue Sherwani (L) - ₹5,000/rental
- Golden Sherwani (XL) - ₹6,000/rental
- Maroon Velvet Sherwani (M) - ₹7,000/rental
- Ivory Sherwani Set (L) - ₹4,500/rental
- Black Sherwani (XL) - ₹5,500/rental

**3 Lehengas (Bride Wear):**
- Red Bridal Lehenga - ₹15,000/rental
- Pink Designer Lehenga - ₹12,000/rental
- Golden Silk Lehenga - ₹14,000/rental

---

## ✅ Success Criteria

After running the script and testing:

- [ ] Script executed without errors
- [ ] mysafawale@gmail.com sees exactly 8 products
- [ ] All products show "Dahod ni Branch" franchise
- [ ] Can add new products (auto-assigned to franchise)
- [ ] Can edit existing products from franchise
- [ ] Cannot edit products from other franchises
- [ ] Super admin sees ALL products from ALL franchises

---

## 🔧 Troubleshooting

### Issue: "Franchise not found for mysafawale@gmail.com"
**Solution:** User doesn't exist or has no franchise_id assigned
```sql
-- Check user's franchise
SELECT email, franchise_id FROM users WHERE email = 'mysafawale@gmail.com';

-- If franchise_id is NULL, assign one:
UPDATE users 
SET franchise_id = (SELECT id FROM franchises WHERE code = 'DHD' LIMIT 1)
WHERE email = 'mysafawale@gmail.com';
```

### Issue: "No products showing on inventory page"
**Solution:** Check if products were inserted
```sql
-- Verify products exist
SELECT COUNT(*) FROM products WHERE is_active = true;

-- Check franchise assignment
SELECT p.name, f.name as franchise 
FROM products p 
LEFT JOIN franchises f ON p.franchise_id = f.id
LIMIT 5;
```

### Issue: "Can see all products (isolation not working)"
**Solution:** Clear browser cache and re-login
```bash
# Or check if user role is correctly set
# User should NOT be 'super_admin' for isolation to work
```

---

## 📚 Additional Documentation

- **Full Implementation Details:** `INVENTORY_ISOLATION_COMPLETE.md`
- **SQL Script:** `scripts/inventory/add-demo-inventory-mysafawale.sql`
- **API Documentation:** Check `/app/api/auth/user/route.ts`

---

## 🎯 Next Steps After Demo

1. **Add More Products:** Use the "Add Product" button in UI
2. **Create Product Categories:** Set up your category structure
3. **Upload Product Images:** Add photos to each product
4. **Test Bookings:** Try creating bookings with demo products
5. **Configure Stock Levels:** Set reorder points for each item

---

**Need Help?** Check the main documentation file: `INVENTORY_ISOLATION_COMPLETE.md`
