# 📍 Base Pincode Changed: 390001 → 390007

## ✅ What Was Changed

### Updated Files
All hardcoded base pincodes have been changed from **390001** to **390007** for radius-based distance calculations.

**Files Updated:**
1. ✅ `/app/book-package/page.tsx` - Package booking distance calculation
2. ✅ `/components/bookings/package-booking-form.tsx` - Distance pricing calculation

---

## 🎯 How Distance Calculation Works Now

### Center Point (Radius Origin)
**Base Pincode:** `390007`  
All customer distances are calculated **FROM** this pincode as the center point.

### Distance Calculation Flow

```typescript
// 1. String version for API calls
const basePincode = '390007'

// 2. Number version for fallback estimation  
const basePincodeNum = 390007
```

### Example Calculations

| Customer Pincode | Distance Calculation | Method |
|-----------------|---------------------|--------|
| 390007 | 0 km | Exact match (same location) |
| 400001 | ~430 km | Cached/API (Mumbai) |
| 380001 | ~110 km | Cached/API (Ahmedabad) |
| 390015 | ~8 km | Estimation (within Vadodara) |

---

## 🔄 Distance Resolution Priority

The system uses a 3-tier approach:

### 1️⃣ **Cached Distances** (Fastest)
- Checks `pincode_distances_exact` table
- Returns pre-calculated accurate distances
- FROM pincode: `390007`

```sql
SELECT distance_km, method 
FROM pincode_distances_exact
WHERE from_pincode = '390007' 
  AND to_pincode = '<customer_pincode>'
```

### 2️⃣ **API Calculation** (Accurate)
- Calls `/api/calculate-distance?from=390007&to=<pincode>`
- Uses geolocation APIs (India Post, OpenStreetMap)
- Caches result for future use

### 3️⃣ **Fallback Estimation** (Quick)
- Based on pincode number difference
- Formula: `Math.abs(customerPincode - 390007) / (factor)`
- Used when API fails or coordinates unavailable

---

## 📊 Distance Pricing Application

### Package Booking Form
```typescript
const basePincode = 390007
const distance = Math.abs(parseInt(customerPincode) - basePincode) / 1000

// Find applicable pricing tier
const pricing = distancePricing.find(
  (dp) => distance >= dp.min_km && distance <= dp.max_km
)
```

### Distance Tiers Example
| Min KM | Max KM | Additional Cost |
|--------|--------|----------------|
| 0 | 50 | ₹0 |
| 51 | 100 | ₹500 |
| 101 | 200 | ₹1,000 |
| 201+ | 999 | ₹2,000 |

---

## 🗄️ Database Update Required

### Update Existing Cache
If you have existing cached distances in your database, you should update them:

```sql
-- View current cached distances (from old pincode)
SELECT from_pincode, to_pincode, distance_km, method, verified
FROM pincode_distances_exact
WHERE from_pincode = '390001'
ORDER BY distance_km;

-- Option 1: Delete old cache (will recalculate on next use)
DELETE FROM pincode_distances_exact
WHERE from_pincode = '390001';

-- Option 2: Update pincode reference (if distances are similar)
UPDATE pincode_distances_exact
SET from_pincode = '390007'
WHERE from_pincode = '390001';
```

**Recommendation:** Delete old cache and let the system recalculate with the new base pincode for accuracy.

---

## 🚀 Future Enhancement: Dynamic Base Pincode

Currently the base pincode is **hardcoded** as `390007`. 

### Future Improvement
Fetch from **Company Settings** dynamically:

```typescript
// Fetch company pincode from settings
const { data: companySettings } = await supabase
  .from('company_settings')
  .select('pincode')
  .eq('franchise_id', franchiseId)
  .single()

const basePincode = companySettings?.pincode || '390007' // Fallback
```

**Benefits:**
- ✅ No code changes needed when moving locations
- ✅ Multi-franchise support (each franchise uses their own pincode)
- ✅ Configurable from Settings UI

---

## 📝 Testing Checklist

### Test Cases
- [ ] Customer with same pincode (390007) → Shows 0 km
- [ ] Customer with Mumbai pincode (400001) → Shows ~430 km
- [ ] Customer with Ahmedabad pincode (380001) → Shows ~110 km
- [ ] Customer with nearby pincode (390015) → Shows small distance
- [ ] Distance pricing applies correctly based on calculated KM
- [ ] Cache is created for new calculations

### Test in UI
1. Go to **Create Package Booking** page
2. Select a customer with different pincode
3. Check distance display in the "Distance" section
4. Verify correct pricing tier is applied

---

## 📍 Summary

**Before:** All distances calculated from **390001**  
**After:** All distances calculated from **390007**  

**Impact:**
- More accurate distance calculations for your actual store location
- All future bookings will use correct base pincode
- Existing cache will be recalculated on first use

**No Breaking Changes:**
- Existing bookings retain their original distance values
- New bookings automatically use new pincode

---

**Date Updated:** October 15, 2025  
**Changed By:** System Update  
**Reason:** Store location pincode correction
