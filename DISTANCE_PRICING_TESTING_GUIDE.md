# 🧪 Distance Pricing System - Testing Guide

## ✅ Pre-Testing Checklist

- [ ] Database migration completed (`CREATE_DISTANCE_PRICING_TABLE.sql`)
- [ ] Browser cache cleared (⌘ + Shift + R for hard refresh)
- [ ] Logged in as franchise_admin
- [ ] All code changes deployed

---

## 📋 Test Scenario 1: Create Package Hierarchy with Distance Pricing

### Step 1: Create Category
1. Go to **Packages** (sidebar - now labeled "Packages" instead of "Sets")
2. Click **"Add Category"**
3. Fill in:
   - Name: `Wedding Packages`
   - Description: `Complete wedding equipment packages`
4. Click **"Create Category"**
5. ✅ Verify: Category appears in list

### Step 2: Create Variant
1. Click on **"Wedding Packages"** category
2. Click **"Add Variant"** button
3. Fill in:
   - Name: `Premium`
   - Description: `Premium wedding equipment set`
   - Base Price: `10000`
   - Inclusions: `Tables, Chairs, Sound System, Lighting`
4. Click **"Create Variant"**
5. ✅ Verify: Variant card shows with colorful inclusions badges

### Step 3: Add Level with Additional Price
1. Click **"View Levels"** on Premium variant
2. Click **"Add Level"** button
3. Fill in:
   - Level Name: `VIP`
   - Additional Price: `5000`
4. ✅ Verify: Dialog shows live calculation:
   ```
   Total = Variant Base (₹10,000) + Additional (₹5,000) = ₹15,000
   ```
5. Click **"Create Level"**
6. ✅ Verify: Level card displays:
   ```
   ₹10,000 (base) + ₹5,000 (additional) = ₹15,000
   ```

### Step 4: Add Distance Pricing
1. On VIP level card, click **"Distance Pricing"** button
2. Click **"Add Distance Pricing"** button
3. Fill in:
   - Distance Range: `Internal City`
   - Min Distance: `0`
   - Max Distance: `10`
   - Additional Price: `500`
4. ✅ Verify: Beautiful pricing breakdown shows:
   ```
   💰 Total Price Calculation:
   Variant Base:        ₹10,000
   Level Additional:    ₹5,000
   ──────────────────────────
   Level Total:         ₹15,000
   + Distance Charge:   ₹500
   ══════════════════════════
   Final Price:         ₹15,500
   ```
5. Click **"Add Pricing"**
6. ✅ Verify: Distance pricing appears in list

### Step 5: Add More Distance Tiers
Repeat Step 4 for:
- `10-20 km`: ₹1,000 additional
- `20-50 km`: ₹2,000 additional
- `50+ km`: ₹3,500 additional

---

## 📋 Test Scenario 2: Create Package Booking

### Step 1: Navigate to Booking Form
1. Go to **Bookings** → **Create New Package Booking**
2. ✅ Verify: Form loads without errors

### Step 2: Select Customer
**Option A - Existing Customer:**
1. Select customer from dropdown
2. ✅ Verify: Customer details populate

**Option B - New Customer:**
1. Click **"New Customer"**
2. Fill in:
   - Name: `Test Customer`
   - Phone: `9876543210`
   - WhatsApp: `9876543210`
   - Email: `test@example.com`
   - Address: `123 Test Street`
   - Pincode: `390005` (for testing distance calculation)
3. ✅ Verify: All fields accept input

### Step 3: Select Category
1. Click on **"Wedding Packages"** category card
2. ✅ Verify: Category is highlighted/selected

### Step 4: Select Package
1. If multiple packages exist, select one
2. ✅ Verify: Package is highlighted

### Step 5: Select Variant
1. Click on **"Premium"** variant card
2. ✅ Verify: 
   - Variant is highlighted with blue border
   - Shows `+₹10,000` badge
   - Inclusions badges are visible

### Step 6: Select Level (NEW!)
1. ✅ Verify: **"Step 4: Select Level"** section appears
2. Click on **"VIP"** level card
3. ✅ Verify: 
   - Level is highlighted with purple border
   - Shows pricing breakdown:
     ```
     ₹10,000 (base) + ₹5,000 (additional) = ₹15,000
     ```

### Step 7: View Pricing Breakdown (NEW!)
✅ Verify: **"💰 Pricing Breakdown"** card appears with gradient background

**Should show:**
```
Variant Base Price:    ₹10,000
Level Additional:      ₹5,000
──────────────────────────────
Level Total:           ₹15,000
+ Distance Charge:     ₹500  (auto-calculated based on pincode)
══════════════════════════════
Final Price:           ₹15,500
```

### Step 8: Complete Booking Details
1. Select **Event Date** (click calendar icon)
2. Select **Delivery Date**
3. Select **Pickup Date**
4. Add **Notes** (optional): `Test booking for VIP level`
5. Select **Payment Status**: `Pending` or `Partial`
6. Enter **Advance Amount**: `5000` (if partial)
7. Select **Payment Method**: `Cash / Offline Payment`

### Step 9: Submit Booking
1. Click **"Create Booking"** button
2. ✅ Verify:
   - Success message appears
   - Booking is created with correct total: ₹15,500
   - All details are saved properly

---

## 📋 Test Scenario 3: Validation Testing

### Test Required Field Validations
1. Try to submit without selecting customer
   - ✅ Verify: Error "Please select a customer"

2. Try to submit without selecting category
   - ✅ Verify: Error "Please select a category"

3. Try to submit without selecting package
   - ✅ Verify: Error "Please select a package"

4. Try to submit with variant selected but NO level (when levels exist)
   - ✅ Verify: Error "Please select a level for this variant"

5. Try to submit without event date
   - ✅ Verify: Error "Event date is required"

---

## 📋 Test Scenario 4: Edge Cases

### Test 1: Variant WITHOUT Levels
1. Create a new variant without adding any levels
2. Create booking with this variant
3. ✅ Verify: 
   - Level selection step does NOT appear
   - Booking works without level selection
   - Price = Variant Base only

### Test 2: Multiple Levels
1. Add multiple levels to same variant (Basic, Standard, Premium, VIP)
2. Create booking
3. ✅ Verify: All levels appear in selection
4. Switch between levels
5. ✅ Verify: Pricing breakdown updates correctly for each level

### Test 3: No Distance Pricing
1. Create level without distance pricing
2. Create booking
3. ✅ Verify:
   - Pricing breakdown shows Level Total only
   - No distance charge appears
   - Final price = Level Total

### Test 4: Customer with Different Pincodes
Test with various pincodes to verify distance calculation:
- `390007` → 0 km (base location)
- `390005` → ~2 km → Should select 0-10 km tier (₹500)
- `390020` → ~13 km → Should select 10-20 km tier (₹1,000)
- `380001` → ~100 km → Should select 50+ km tier (₹3,500)

✅ Verify: Distance pricing auto-selects correct tier based on pincode

---

## 📋 Test Scenario 5: Database Verification

### Verify in Supabase SQL Editor

#### Check distance_pricing table exists:
```sql
SELECT * FROM distance_pricing LIMIT 10;
```
✅ Verify: Table exists and has data

#### Check proper relationships:
```sql
SELECT 
  dp.id,
  dp.distance_range,
  dp.min_distance_km,
  dp.max_distance_km,
  dp.additional_price,
  pl.name as level_name,
  pv.name as variant_name
FROM distance_pricing dp
JOIN package_levels pl ON dp.package_level_id = pl.id
JOIN package_variants pv ON pl.variant_id = pv.id
WHERE dp.is_active = true;
```
✅ Verify: All joins work correctly

#### Check RLS is disabled:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'distance_pricing';
```
✅ Verify: `rowsecurity` is `false`

---

## 📋 Test Scenario 6: UI/UX Testing

### Visual Elements Checklist
- [ ] Inclusions display with colorful rotating badges (purple, blue, green, orange, pink, teal)
- [ ] Gradient background on inclusions section (purple-50 to blue-50)
- [ ] Level cards show clear base + additional formula
- [ ] Distance pricing breakdown has gradient card background
- [ ] Purple theme for level selection (purple-500 border when selected)
- [ ] Blue theme for distance charge in breakdown
- [ ] Final price is prominently displayed (larger, bold, purple)
- [ ] All calculations update live as user types

### Interaction Testing
- [ ] Click level card → Selects level with purple highlight
- [ ] Type in distance price → Breakdown updates in real-time
- [ ] Switch between levels → Pricing recalculates correctly
- [ ] Change customer pincode → Distance tier updates automatically

---

## 📋 Test Scenario 7: Performance Testing

### Load Testing
1. Create 10 categories
2. Each with 5 variants
3. Each variant with 3 levels
4. Each level with 4 distance tiers

✅ Verify:
- Page loads in < 2 seconds
- No console errors
- All dropdowns populate correctly
- Pricing calculations are instant

---

## 🐛 Known Issues to Check

### Browser Console
Check for:
- [ ] No 401 Unauthorized errors (RLS disabled)
- [ ] No missing column errors
- [ ] No null reference errors
- [ ] No calculation errors (NaN, Infinity)

### Network Tab
Check API calls:
- [ ] `/api/distance-pricing/save` → Status 200
- [ ] Payload includes `package_level_id` (not `variant_id`)
- [ ] Response includes all new column names

---

## ✅ Success Criteria

### All Tests Pass When:
1. ✅ Can create complete package hierarchy (Category → Variant → Level → Distance Pricing)
2. ✅ All pricing formulas display correctly
3. ✅ Live calculations work in real-time
4. ✅ Level selection appears in booking form
5. ✅ Pricing breakdown card shows all components
6. ✅ Distance pricing auto-calculates from customer pincode
7. ✅ Booking saves with correct final price
8. ✅ No console errors or database errors
9. ✅ UI is beautiful and intuitive (Steve Jobs would approve!)
10. ✅ Backward compatibility works (old data still loads)

---

## 🎯 Quick Smoke Test (5 minutes)

For rapid validation:

1. **Hard refresh browser** (⌘ + Shift + R)
2. Go to **Packages** → Create level with additional price → ✅ Shows calculation
3. Add distance pricing → ✅ Shows breakdown with gradient card
4. Go to **Bookings** → Create new → Select all steps → ✅ Level selection appears
5. Check pricing breakdown → ✅ All values correct
6. Submit → ✅ Booking created successfully

If all 6 steps pass → **System is working! 🎉**

---

## 📞 Troubleshooting

### Issue: 401 Unauthorized when saving distance pricing
**Solution:** Verify RLS is disabled:
```sql
ALTER TABLE distance_pricing DISABLE ROW LEVEL SECURITY;
```

### Issue: Distance pricing not appearing in booking
**Solution:** Check data is fetched with correct columns:
- Open browser dev tools → Network tab
- Filter for `package_levels` query
- Verify response includes `distance_pricing` array

### Issue: Pricing calculation shows NaN
**Solution:** Check all prices are valid numbers:
- Variant base_price is set
- Level base_price is set (can be 0)
- Distance additional_price is valid

### Issue: Level selection doesn't appear
**Solution:** 
1. Verify variant has levels: Check `package_levels` table
2. Verify levels have `variant_id` matching selected variant
3. Check browser console for errors

---

## 📝 Test Report Template

```
Date: _____________
Tester: ___________
Environment: Production / Staging

Scenario 1 (Package Creation): ☐ Pass ☐ Fail
Scenario 2 (Booking Creation): ☐ Pass ☐ Fail
Scenario 3 (Validations): ☐ Pass ☐ Fail
Scenario 4 (Edge Cases): ☐ Pass ☐ Fail
Scenario 5 (Database): ☐ Pass ☐ Fail
Scenario 6 (UI/UX): ☐ Pass ☐ Fail
Scenario 7 (Performance): ☐ Pass ☐ Fail

Issues Found:
1. _____________________
2. _____________________
3. _____________________

Overall Status: ☐ Ready for Production ☐ Needs Fixes
```

---

**Happy Testing! 🚀**
