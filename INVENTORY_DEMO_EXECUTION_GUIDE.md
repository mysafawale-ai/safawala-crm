# 🚀 Quick Guide: Add Demo Inventory

## Step-by-Step Instructions

### Method 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy the SQL Script**
   ```bash
   # In your terminal, run:
   cat scripts/inventory/add-demo-inventory-mysafawale.sql
   ```
   - Or open the file and copy all contents

4. **Paste and Execute**
   - Paste the SQL into the editor
   - Click "Run" button
   - Wait for success message

5. **Verify**
   - You should see: "15 products inserted successfully!"
   - Check the output for franchise_id confirmation

---

### Method 2: View the Script First

```bash
# View the entire script:
cat /Applications/safawala-crm/scripts/inventory/add-demo-inventory-mysafawale.sql

# Or open in your editor:
code /Applications/safawala-crm/scripts/inventory/add-demo-inventory-mysafawale.sql
```

---

## What Gets Created

### 15 Demo Products:

1. **Sherwanis (3 items)**
   - Royal Blue Sherwani Set - ₹25,000 (₹5,000 rental)
   - Premium Red Sherwani - ₹45,000 (₹8,000 rental)
   - Classic Cream Sherwani - ₹15,000 (₹3,000 rental)

2. **Lehengas (3 items)**
   - Designer Bridal Lehenga - ₹75,000 (₹15,000 rental)
   - Heavy Work Lehenga - ₹50,000 (₹10,000 rental)
   - Traditional Red Lehenga - ₹25,000 (₹5,000 rental)

3. **Jewelry Sets (3 items)**
   - Kundan Necklace Set - ₹35,000 (₹7,000 rental)
   - Polki Bridal Set - ₹28,000 (₹5,500 rental)
   - Temple Jewelry Set - ₹8,000 (₹1,500 rental)

4. **Wedding Decor (2 items)**
   - Crystal Wedding Mandap - ₹50,000 (₹15,000 rental)
   - Floral Stage Decoration - ₹25,000 (₹8,000 rental)

5. **Furniture (2 items)**
   - Premium Chiavari Chairs (Set of 50) - ₹500 each (₹50 rental)
   - Round Banquet Tables (Set of 10) - ₹3,000 (₹500 rental)

6. **Sound Equipment (2 items)**
   - Professional DJ Sound System - ₹15,000 (₹5,000 rental)
   - LED Stage Lighting Setup - ₹8,000 (₹3,000 rental)

**Total Stock**: 350+ items

---

## After Running the Script

### Test It Works:

1. **Login to your app**
   ```
   Email: mysafawale@gmail.com
   Password: [your password]
   ```

2. **Navigate to Inventory**
   - Go to: http://localhost:3000/inventory
   - You should see 15 products

3. **Verify Details**
   - Check product codes (auto-generated)
   - Check stock levels
   - Check pricing (rental vs sale)
   - Check categories

4. **Test Filtering**
   - Search for "Sherwani"
   - Search for "Lehenga"
   - Check stock status badges

---

## Troubleshooting

### Issue: "Franchise not found"
**Solution**: Make sure mysafawale@gmail.com user exists and has a franchise_id
```sql
SELECT email, franchise_id, name FROM users WHERE email = 'mysafawale@gmail.com';
```

### Issue: "Category not found"
**Solution**: The script auto-creates categories, but verify:
```sql
SELECT id, name FROM categories WHERE is_active = true;
```

### Issue: "Duplicate product_code"
**Solution**: Product codes are random. If collision occurs, just run the script again.

---

## Next Steps

After demo data is loaded:

1. ✅ Test viewing inventory
2. ✅ Test adding new products
3. ✅ Test editing products
4. ✅ Test deleting products
5. ✅ Test franchise isolation (login as different user)
6. ✅ Test super admin view (sees all franchises)

---

## Files Reference

- **SQL Script**: `scripts/inventory/add-demo-inventory-mysafawale.sql`
- **Full Docs**: `INVENTORY_ISOLATION_COMPLETE.md`
- **This Guide**: `INVENTORY_DEMO_QUICKSTART.md`

---

**Ready to run!** 🚀
