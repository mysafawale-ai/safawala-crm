# Distance Pricing Configuration Guide

## Current Status

### ✅ What's Working
- **Distance Calculation**: 597 km correctly calculated for customer at pincode 410001
- **Auto-fetch System**: Distances are fetched from API and cached
- **UI Display**: Distance shows correctly in the booking sidebar

### ❌ What's Missing
- **Distance Pricing Rules**: NO rules configured
- **Distance Charges**: NO extra charges applied for distance
- **Result**: Price is always base price, regardless of distance

---

## The Problem

Your system calculates:
```
Customer: 410001 pincode
Store: 390001 pincode
Distance: 597 km ✅ CORRECT

Base Price: ₹1,307.00
Distance Charge: ₹0.00 ❌ MISSING
Final Price: ₹1,307.00 (same for all distances!)
```

**Why?** No pricing rules in database telling system how much to charge per distance.

---

## The Solution

Configure distance pricing rules in your database. You have 2 options:

### Option 1: Global Pricing Tiers (Recommended for Beginners)
✅ **Simple** - One set of rules for all packages
✅ **Quick** - Set up once, applies everywhere
✅ **Consistent** - Same distance charges for all

**Example:**
| Distance | Extra Charge |
|----------|--------------|
| 0-50 km | No charge |
| 51-200 km | +10% |
| 201-500 km | +20% |
| 501-1000 km | +30% |
| 1000+ km | +50% |

**For your case (597 km):**
- Base: ₹1,307.00
- Distance tier: 501-1000 km → 30% extra
- Distance charge: ₹1,307 × 0.3 = **₹392.10**
- **Final price: ₹1,699.10**

### Option 2: Per-Variant Pricing (Advanced)
✅ **Flexible** - Different rules for different packages
✅ **Precise** - Fine control over each package
❌ **Complex** - Requires more setup

---

## Quick Setup (5 minutes)

### Step 1: Run SQL File
1. Open **Supabase SQL Editor**
2. Copy content from `SETUP_DISTANCE_PRICING_RULES.sql`
3. Click **Run**

This will create:
- `distance_pricing_tiers` table
- 5 example pricing tiers (0-50km, 51-200km, etc.)

### Step 2: Test
1. **Refresh** your booking page
2. Select customer with pincode 410001
3. Add a package
4. **See the price change!**

**Before:**
- Distance: 597 km
- Price: ₹1,307.00

**After (with 30% tier):**
- Distance: 597 km
- Base: ₹1,307.00
- Distance charge: +₹392.10
- **Total: ₹1,699.10**

---

## Pricing Logic Explained

### How System Calculates Price

```
1. Get customer pincode → 410001
2. Calculate distance → 597 km
3. Get base package price → ₹1,307.00
4. Check distance pricing rules:
   
   Check per-variant rules first:
   ❌ Not found
   
   Check global tiers:
   ✅ Found: 501-1000 km → 1.3x multiplier
   
5. Calculate distance charge:
   Method: Multiplier
   Calculation: ₹1,307.00 × (1.3 - 1) = ₹392.10
   
6. Final price:
   ₹1,307.00 + ₹392.10 = ₹1,699.10
```

### Priority Order
1. **Per-variant pricing** (specific to package variant)
2. **Global pricing tiers** (applies to all packages)
3. **No charge** (if no rules configured)

---

## Example Pricing Tiers

### Conservative (Lower charges)
```sql
(0, 50, 1.0, null),    -- No charge
(51, 200, 1.05, null), -- 5% extra
(201, 500, 1.1, null), -- 10% extra
(501, null, 1.15, null) -- 15% extra
```

### Moderate (Balanced)
```sql
(0, 50, 1.0, null),    -- No charge
(51, 200, 1.1, null),  -- 10% extra
(201, 500, 1.2, null), -- 20% extra
(501, null, 1.3, null) -- 30% extra
```

### Aggressive (Higher charges)
```sql
(0, 50, 1.0, null),    -- No charge
(51, 200, 1.15, null), -- 15% extra
(201, 500, 1.3, null), -- 30% extra
(501, null, 1.5, null) -- 50% extra
```

### Flat Rate (Fixed charges)
```sql
(0, 50, null, 0),      -- ₹0
(51, 200, null, 500),  -- +₹500
(201, 500, null, 1500), -- +₹1,500
(501, null, null, 3000) -- +₹3,000
```

---

## Customizing for Your Business

### Question 1: How much should I charge?
**Consider:**
- Your fuel/transport costs
- Travel time for team
- Competitor pricing
- Customer willingness to pay

**Recommendation:** Start moderate (10-30% extra)

### Question 2: Multiplier vs Flat Rate?
**Multiplier (e.g., 1.2x):**
- ✅ Scales with package value
- ✅ Higher value packages = higher distance charge
- ❌ Less predictable

**Flat Rate (e.g., +₹500):**
- ✅ Predictable for customers
- ✅ Easy to communicate
- ❌ Doesn't scale with package value

**Recommendation:** Use multiplier for flexibility

### Question 3: What distance tiers to use?
**Common tiers:**
- 0-50 km: Local (no charge)
- 51-200 km: Regional (small charge)
- 201-500 km: Long distance (moderate charge)
- 501-1000 km: Very long (high charge)
- 1000+ km: Extreme (very high charge)

**Adjust based on:**
- Your service area
- Where most customers are located
- Transport logistics

---

## Testing Your Setup

### Test Case 1: Local Customer (50 km)
```
Customer: 390050 (50 km away)
Base: ₹1,307.00
Tier: 0-50 km → No charge
Final: ₹1,307.00 ✅
```

### Test Case 2: Regional Customer (150 km)
```
Customer: 395001 (150 km away)
Base: ₹1,307.00
Tier: 51-200 km → 10% extra
Distance charge: ₹130.70
Final: ₹1,437.70 ✅
```

### Test Case 3: Long Distance (597 km)
```
Customer: 410001 (597 km away)
Base: ₹1,307.00
Tier: 501-1000 km → 30% extra
Distance charge: ₹392.10
Final: ₹1,699.10 ✅
```

---

## Troubleshooting

### Price not changing?
1. Check SQL ran successfully
2. Verify `distance_pricing_tiers` table has data:
   ```sql
   SELECT * FROM distance_pricing_tiers WHERE is_active = true;
   ```
3. Hard refresh browser (Cmd+Shift+R)
4. Check browser console for errors

### Wrong distance charge?
1. Verify which tier matches:
   ```sql
   SELECT * FROM distance_pricing_tiers 
   WHERE is_active = true 
   AND 597 BETWEEN min_distance AND COALESCE(max_distance, 999999);
   ```
2. Check multiplier value
3. Manually calculate to verify

### Distance showing 0 km?
1. Check distance_pricing_check.js output
2. Verify auto-fetch is working
3. Check pincode_distances_exact table

---

## Summary

🎯 **Current Status:**
- Distance: ✅ Working (597 km)
- Pricing: ❌ Not configured

🎯 **Action Required:**
- Run `SETUP_DISTANCE_PRICING_RULES.sql`
- Configure pricing tiers
- Test with different customers

🎯 **Expected Result:**
- Distance-based charges applied automatically
- Prices increase with distance
- Fair pricing for customers far away

**Run the SQL file and your distance pricing will work!** 🚀
