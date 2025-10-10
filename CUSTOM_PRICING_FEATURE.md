# Custom Pricing Override Feature

## Feature Overview
Added ability to override calculated package prices with custom amounts. Useful when you want to offer special pricing, discounts, or negotiate prices with customers.

---

## What's New

### ✅ Custom Pricing Toggle
- **Location:** Package booking Step 3 (Review) - Right sidebar
- **Button:** "Use Custom" / "Using Custom"
- **Auto-fills:** Pre-fills with currently calculated values when enabled

### ✅ Custom Price Inputs
When enabled, you can set:
1. **Package Price** (before GST)
2. **Deposit Amount**

Auto-calculated:
- **GST (5%)** - Calculated automatically
- **Grand Total** - Package Price + GST
- **Remaining** - Grand Total - Deposit

---

## How It Works

### Standard Pricing (Default)
```
Items added to cart
  ↓
System calculates:
- Base price per package
- Distance addon
- Quantity multiplier
- Security deposit
  ↓
Subtotal = All items combined
GST = Subtotal × 5%
Grand Total = Subtotal + GST
  ↓
Choose payment type:
- Full
- Advance (50%)
- Partial (custom amount)
```

### Custom Pricing (Override)
```
Items added to cart
  ↓
Toggle "Use Custom" button
  ↓
Enter custom amounts:
- Package Price: ₹50,000 (your custom price)
- Deposit: ₹25,000 (your custom deposit)
  ↓
System calculates:
- GST = ₹50,000 × 5% = ₹2,500
- Grand Total = ₹50,000 + ₹2,500 = ₹52,500
- Remaining = ₹52,500 - ₹25,000 = ₹27,500
  ↓
Saved to database with custom_pricing flag
```

---

## UI Features

### Custom Pricing Section
Located in the right sidebar, after the totals section:

```
┌─────────────────────────────────────┐
│ Override with Custom Price    [Use] │
├─────────────────────────────────────┤
│ Package Price (before GST)          │
│ ┌─────────────────────────────────┐ │
│ │ 50000                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Deposit Amount                      │
│ ┌─────────────────────────────────┐ │
│ │ 25000                           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ─────────────────────────────────── │
│ Package Price:        ₹50,000.00    │
│ GST (5%):             ₹2,500.00     │
│ Grand Total:          ₹52,500.00    │
│ Deposit:              ₹25,000.00    │
│ Remaining:            ₹27,500.00    │
└─────────────────────────────────────┘
```

### Visual Indicators
- **Amber badge** shows "Custom Pricing" when enabled
- **Gray background** for custom pricing inputs
- **Color-coded** summary (green for total, blue for deposit)

---

## Database Schema

### New Columns in `package_bookings`
```sql
use_custom_pricing boolean DEFAULT false
  -- True when custom pricing was used

custom_package_price numeric(10,2)
  -- Custom package price (before GST)

custom_deposit numeric(10,2)
  -- Custom deposit amount
```

### Example Data
```sql
-- Standard booking
{
  "use_custom_pricing": false,
  "custom_package_price": null,
  "custom_deposit": null,
  "total_amount": 52500.00,  -- Calculated
  "paid_amount": 52500.00
}

-- Custom pricing booking
{
  "use_custom_pricing": true,
  "custom_package_price": 50000.00,  -- Your custom price
  "custom_deposit": 25000.00,        -- Your custom deposit
  "total_amount": 52500.00,          -- 50000 + GST
  "paid_amount": 25000.00            -- Deposit
}
```

---

## Use Cases

### 1. Special Discount
**Scenario:** Customer is a repeat client, you want to offer 10% off

**Action:**
1. Add packages normally
2. Toggle "Use Custom"
3. Calculated: ₹50,000 → Enter: ₹45,000 (10% off)
4. Set deposit as needed

### 2. Package Deal
**Scenario:** Customer books multiple services, you negotiate a flat rate

**Action:**
1. Add all packages
2. Toggle "Use Custom"
3. Enter negotiated package price (e.g., ₹1,00,000)
4. Set deposit (e.g., 50% = ₹50,000)

### 3. Seasonal Promotion
**Scenario:** Running a wedding season promotion

**Action:**
1. Add selected packages
2. Toggle "Use Custom"
3. Apply promotional pricing
4. Set promotional deposit terms

### 4. VIP Customer
**Scenario:** Corporate client with special pricing agreement

**Action:**
1. Add packages
2. Toggle "Use Custom"
3. Enter pre-agreed corporate rate
4. Set deposit per contract

---

## Setup Instructions

### Step 1: Run Database Migration
Open Supabase SQL Editor and run:
```sql
-- File: ADD_CUSTOM_PRICING_COLUMNS.sql
```

This adds:
- `use_custom_pricing` column
- `custom_package_price` column
- `custom_deposit` column
- Index for filtering custom pricing bookings

### Step 2: Refresh Application
Hard refresh your browser (Cmd+Shift+R)

### Step 3: Test
1. Go to `/book-package`
2. Add customer and packages
3. Go to Step 3 (Review)
4. Click "Use Custom" button
5. Enter custom amounts
6. Verify calculations
7. Create booking

---

## Features

### ✅ Smart Pre-fill
When you toggle "Use Custom", it pre-fills with calculated values so you can easily adjust

### ✅ Auto-calculate GST
GST is always calculated automatically at 5% of package price

### ✅ Real-time Preview
See grand total, deposit, and remaining amount update as you type

### ✅ Validation
- Package price must be >= 0
- Deposit must be >= 0
- Deposit cannot exceed grand total (enforced in UI)

### ✅ Visual Feedback
- Amber badge shows custom pricing is active
- Clear summary shows all amounts
- Standard payment options hidden when custom pricing enabled

---

## Differences from Standard Pricing

| Feature | Standard Pricing | Custom Pricing |
|---------|-----------------|----------------|
| Price Calculation | Automatic (items + distance) | Manual entry |
| Payment Type Options | Full/Advance/Partial | Custom deposit only |
| GST Calculation | Automatic (5%) | Automatic (5%) |
| Deposit | Based on payment type | Manual entry |
| Items Detail | Preserved | Preserved |
| Invoice Display | Shows item breakdown | Shows custom amount |

---

## Important Notes

### ⚠️ Items Still Required
- You still need to add items to the booking
- Items are saved to database for reference
- Custom price overrides the calculated total
- Items help you remember what was included

### ⚠️ Security Deposit Separate
- Security deposit is separate from custom pricing
- Still calculated from items
- Added to the booking separately

### ⚠️ Quotes vs Bookings
- Custom pricing works for both quotes and confirmed bookings
- Flag is saved so you know which bookings used custom pricing

---

## Reporting Queries

### Find All Custom Pricing Bookings
```sql
SELECT 
  pb.id,
  pb.created_at,
  c.name as customer_name,
  pb.custom_package_price,
  pb.total_amount,
  pb.paid_amount
FROM package_bookings pb
JOIN customers c ON pb.customer_id = c.id
WHERE pb.use_custom_pricing = true
ORDER BY pb.created_at DESC;
```

### Average Discount Given
```sql
SELECT 
  pb.id,
  pb.custom_package_price as custom_price,
  SUM(pbi.total_price * pbi.quantity) as calculated_price,
  (SUM(pbi.total_price * pbi.quantity) - pb.custom_package_price) as discount_amount,
  ROUND(((SUM(pbi.total_price * pbi.quantity) - pb.custom_package_price) / SUM(pbi.total_price * pbi.quantity) * 100), 2) as discount_percent
FROM package_bookings pb
JOIN package_booking_items pbi ON pbi.booking_id = pb.id
WHERE pb.use_custom_pricing = true
GROUP BY pb.id, pb.custom_package_price
ORDER BY discount_percent DESC;
```

### Revenue Impact
```sql
SELECT 
  COUNT(*) as custom_pricing_bookings,
  SUM(CASE WHEN use_custom_pricing THEN custom_package_price ELSE total_amount END) as total_revenue,
  AVG(CASE WHEN use_custom_pricing THEN custom_package_price ELSE total_amount END) as avg_booking_value
FROM package_bookings
WHERE created_at >= date_trunc('month', now());
```

---

## Benefits

✅ **Flexibility** - Negotiate prices with customers
✅ **Special Offers** - Easy to apply discounts and promotions
✅ **VIP Pricing** - Handle special customer agreements
✅ **Quick Adjustments** - Change pricing without recalculating items
✅ **Audit Trail** - Track which bookings used custom pricing
✅ **Transparent** - Shows both custom and calculated amounts

---

## Summary

🎯 **Custom Pricing Override** - Manually set package prices when needed

🎯 **Auto-calculate GST** - GST always calculated at 5%

🎯 **Flexible Deposits** - Set custom deposit amounts

🎯 **Database Tracked** - Saved with special flag for reporting

🎯 **Easy Toggle** - One button to switch between modes

Perfect for handling discounts, special offers, VIP pricing, and negotiated deals!
