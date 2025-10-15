# ✅ COUPON SYSTEM - QUICK START GUIDE

## 🎯 What's Been Done

I've implemented a **comprehensive coupon code system** for your Safawala CRM. Here's everything that's ready:

---

## 📦 Files Created

### 1. Database Migration
- **`ADD_COUPON_SYSTEM.sql`** - Complete database migration script
  - Creates `coupons` table
  - Creates `coupon_usage` tracking table
  - Adds `coupon_code` and `coupon_discount` columns to `product_orders` and `package_bookings`
  - Sets up indexes for performance
  - Configures RLS policies for security

### 2. API Endpoints
- **`app/api/coupons/route.ts`** - CRUD operations (GET, POST, PUT, DELETE)
- **`app/api/coupons/validate/route.ts`** - Coupon validation and discount calculation

### 3. UI Components
- **`components/ManageOffersDialog.tsx`** - Full coupon management interface

### 4. Integration Updates
- **`app/create-product-order/page.tsx`** - Added coupon field, validation, and totals calculation
- **`app/bookings/page.tsx`** - Added "Manage Offers" button

### 5. Documentation
- **`COUPON_SYSTEM_COMPLETE.md`** - Comprehensive 600+ line documentation

---

## 🚀 Next Steps (Do These Now!)

### Step 1: Run the Database Migration
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the file: `ADD_COUPON_SYSTEM.sql`
4. Copy ALL contents
5. Paste into SQL Editor
6. Click **Run**

**✅ Expected Result:**
```
Success! 2 rows affected
```

### Step 2: Verify the Migration
Run this query in SQL Editor:
```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('coupons', 'coupon_usage');
```

**✅ Expected Result:**
```
coupons
coupon_usage
```

### Step 3: Create Your First Coupon
1. Go to `/bookings` page
2. Click the **"Manage Offers"** button (new button in header)
3. Fill in the form:
   - **Code:** WELCOME10
   - **Description:** Welcome offer - 10% off
   - **Discount Type:** Percentage Discount
   - **Percentage:** 10
   - **Min Order Value:** 0
   - **Max Discount Cap:** 500
   - Click **"Create Coupon"**

### Step 4: Test the Coupon
1. Go to **Create Product Order** (`/create-product-order`)
2. Select a customer
3. Add some products (total > ₹1000)
4. Scroll to the **"Coupon Code"** field (it's after the Discount field)
5. Enter: **WELCOME10**
6. Click **"Apply"**
7. ✅ You should see: "Coupon Applied: -₹XXX.XX" in green

---

## 🎨 Features You Can Use

### 3 Discount Types

#### 1️⃣ Percentage Discount
- Example: 10% off, 20% off
- Can set max discount cap (e.g., max ₹500)
- Calculated: `(orderValue × percentage) / 100`

#### 2️⃣ Flat Discount
- Example: ₹200 off, ₹500 off
- Fixed amount deducted
- Simple and straightforward

#### 3️⃣ Free Shipping (Placeholder)
- Currently returns ₹0 discount
- Can customize for shipping calculations

### Advanced Controls

✅ **Minimum Order Value** - "Spend ₹5000 to use this coupon"  
✅ **Usage Limits** - "Only 100 people can use this"  
✅ **Per-User Limits** - "Each customer can use once"  
✅ **Date Ranges** - "Valid from Oct 15 to Oct 31"  
✅ **Active/Inactive** - Turn coupons on/off without deleting  
✅ **Franchise Isolation** - Coupons are private to your franchise  

---

## 💡 How It Works

### For Customers:
1. Customer adds products to cart
2. Staff enters coupon code at checkout
3. System validates the coupon (checks expiry, limits, min value)
4. Discount automatically applies to totals
5. Order is saved with coupon details

### For Admins:
1. Click **"Manage Offers"** on Bookings page
2. See all existing coupons in right panel
3. Create new coupon using left panel form
4. Edit or delete existing coupons
5. View usage statistics (how many times used)

---

## 📊 Calculation Example

**Order Details:**
- Subtotal: ₹10,000
- Manual Discount: -₹500
- **Coupon (MEGA20 - 20% off, max ₹2000):**
  - 20% of ₹9,500 = ₹1,900 ✅
  - Under max cap of ₹2,000 ✅
  - **Coupon Discount: -₹1,900**
- Amount after discounts: ₹7,600
- GST (5%): ₹380
- **Grand Total: ₹7,980**

**Total Savings: ₹2,400** (₹500 + ₹1,900)

---

## 🔒 Security Features

✅ **Server-side validation** - No client-side bypass possible  
✅ **Franchise isolation** - Can't use other franchise's coupons  
✅ **Row Level Security** - Database-level access control  
✅ **Usage tracking** - Prevents double-counting  
✅ **Expiry checks** - Automatic date validation  

---

## 📱 Where to Find Things

### Create Coupons:
`/bookings` → Click **"Manage Offers"** button

### Use Coupons:
`/create-product-order` → Scroll to **"Coupon Code"** field

### View Usage:
Run this SQL query:
```sql
SELECT 
  c.code,
  COUNT(cu.id) as times_used,
  SUM(cu.discount_applied) as total_discount_given
FROM coupons c
LEFT JOIN coupon_usage cu ON cu.coupon_id = c.id
GROUP BY c.id, c.code
ORDER BY times_used DESC;
```

---

## 🎓 Sample Coupons to Create

### 1. Welcome Offer
- Code: `WELCOME10`
- Type: Percentage (10%)
- Max Discount: ₹500
- Per User: 1 time

### 2. Weekend Special
- Code: `WEEKEND500`
- Type: Flat (₹500)
- Min Order: ₹3,000
- Valid: Friday-Sunday only

### 3. Mega Sale
- Code: `MEGA20`
- Type: Percentage (20%)
- Max Discount: ₹2,000
- Min Order: ₹5,000
- Limit: 50 total uses

### 4. VIP Customer
- Code: `VIP1000`
- Type: Flat (₹1,000)
- Min Order: ₹10,000
- No expiry
- Unlimited uses

---

## 🐛 Troubleshooting

### "Coupon code already exists"
- Each code must be unique
- Try a different code or edit the existing one

### "Minimum order value not met"
- Add more items to cart
- Or reduce the minimum in coupon settings

### "Coupon expired"
- Check the "Valid Until" date
- Update the date or create a new coupon

### "This coupon has reached its maximum usage limit"
- Increase the usage limit
- Or create a new coupon with a different code

### Coupon not applying discount
- Check if it's active (toggle in Manage Offers)
- Verify it's not expired
- Ensure minimum order value is met
- Check console for validation errors

---

## 📈 Analytics Queries

### Top 10 Most Used Coupons
```sql
SELECT code, usage_count, discount_type, discount_value
FROM coupons
ORDER BY usage_count DESC
LIMIT 10;
```

### Total Discounts Given This Month
```sql
SELECT 
  SUM(coupon_discount) as total_coupon_discounts
FROM product_orders
WHERE created_at >= date_trunc('month', CURRENT_DATE)
  AND coupon_code IS NOT NULL;
```

### Customers Who Used Coupons
```sql
SELECT 
  c.name,
  COUNT(DISTINCT cu.coupon_id) as different_coupons_used,
  SUM(cu.discount_applied) as total_savings
FROM coupon_usage cu
JOIN customers c ON c.id = cu.customer_id
GROUP BY c.id, c.name
ORDER BY total_savings DESC;
```

---

## ✨ What's Next?

Once you've tested the basic functionality, you can:

1. **Create seasonal coupons** (Diwali, New Year, Holi)
2. **Set up referral codes** (unique per customer)
3. **Track marketing campaign effectiveness**
4. **Analyze which discounts drive most sales**
5. **Create bulk coupons** for social media campaigns

---

## 📞 Need Help?

All the code is committed and pushed to GitHub. The comprehensive documentation is in:
- `COUPON_SYSTEM_COMPLETE.md` (600+ lines, includes everything)

**Database Migration:** `ADD_COUPON_SYSTEM.sql`  
**Management UI:** `components/ManageOffersDialog.tsx`  
**Validation API:** `app/api/coupons/validate/route.ts`  
**CRUD API:** `app/api/coupons/route.ts`  

---

**🎉 Your coupon system is ready to go! Just run the database migration and start creating offers!**
