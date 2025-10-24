# ✅ Extra Safa Price & Missing Safa Penalty - Implementation Complete

## 🎯 What Was Added

Two new fields for package variants:

1. **Extra Safa Price (₹)** - Charge for additional safas beyond the standard package
2. **Missing Safa Penalty (₹)** - Penalty charge if safas are lost or damaged

---

## 📋 Changes Made

### 1. **Database Schema** ✅
**File:** `scripts/add-extra-safa-columns.sql`

```sql
ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS extra_safa_price NUMERIC(10,2) DEFAULT 0;

ALTER TABLE package_variants 
ADD COLUMN IF NOT EXISTS missing_safa_penalty NUMERIC(10,2) DEFAULT 0;
```

**Action Required:** Run this SQL in Supabase SQL Editor

---

### 2. **TypeScript Interface** ✅
**File:** `app/sets/sets-client.tsx`

```typescript
interface PackageVariant {
  id: string
  name: string
  description: string
  base_price: number
  extra_safa_price?: number      // ✅ NEW
  missing_safa_penalty?: number  // ✅ NEW
  inclusions?: string[]
  package_levels?: PackageLevel[]
  is_active: boolean
}
```

---

### 3. **Form State** ✅
**File:** `app/sets/sets-client.tsx`

```typescript
const [variantForm, setVariantForm] = useState({
  name: "",
  description: "",
  extra_price: "0.00",
  extra_safa_price: "0.00",        // ✅ NEW
  missing_safa_penalty: "0.00",    // ✅ NEW
  inclusions: "",
})
```

---

### 4. **API Payload** ✅
**File:** `app/sets/sets-client.tsx` - `handleCreateVariant()`

```typescript
const extraSafaPrice = Number.parseFloat(variantForm.extra_safa_price)
const missingSafaPenalty = Number.parseFloat(variantForm.missing_safa_penalty)

const payload: any = {
  name: variantForm.name.trim(),
  description: variantForm.description.trim(),
  base_price: basePrice,
  extra_safa_price: isNaN(extraSafaPrice) ? 0 : extraSafaPrice,
  missing_safa_penalty: isNaN(missingSafaPenalty) ? 0 : missingSafaPenalty,
  // ... rest of fields
}
```

---

### 5. **Edit Handler** ✅
**File:** `app/sets/sets-client.tsx` - `handleEditVariant()`

```typescript
const handleEditVariant = (variant: PackageVariant) => {
  setEditingVariant(variant)
  setVariantForm({
    name: variant.name,
    description: variant.description,
    extra_price: variant.base_price.toString(),
    extra_safa_price: (variant.extra_safa_price || 0).toString(),       // ✅ NEW
    missing_safa_penalty: (variant.missing_safa_penalty || 0).toString(), // ✅ NEW
    inclusions: variant.inclusions ? variant.inclusions.join(", ") : "",
  })
  setDialogs((prev) => ({ ...prev, createVariant: true }))
}
```

---

### 6. **UI Form Fields** ✅
**File:** `app/sets/sets-client.tsx` - Create/Edit Variant Dialog

```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="extra-safa-price">Extra Safa Price (₹)</Label>
    <Input
      id="extra-safa-price"
      type="number"
      min="0"
      step="0.01"
      placeholder="Price per extra safa"
      value={variantForm.extra_safa_price}
      onChange={(e) => setVariantForm((prev) => ({ 
        ...prev, 
        extra_safa_price: e.target.value 
      }))}
    />
    <p className="text-xs text-gray-500 mt-1">Charge for additional safas</p>
  </div>
  
  <div>
    <Label htmlFor="missing-safa-penalty">Missing Safa Penalty (₹)</Label>
    <Input
      id="missing-safa-penalty"
      type="number"
      min="0"
      step="0.01"
      placeholder="Penalty for missing safas"
      value={variantForm.missing_safa_penalty}
      onChange={(e) => setVariantForm((prev) => ({ 
        ...prev, 
        missing_safa_penalty: e.target.value 
      }))}
    />
    <p className="text-xs text-gray-500 mt-1">Charge if safas are lost/damaged</p>
  </div>
</div>
```

---

## 🚀 Testing Steps

### 1. **Add Database Columns**
```bash
# In Supabase SQL Editor:
# Copy and paste contents of scripts/add-extra-safa-columns.sql
```

### 2. **Verify UI**
1. Navigate to `/sets` page
2. Select any category
3. Click "Create New Variant" or edit existing variant
4. You should see two new fields side-by-side:
   - **Extra Safa Price (₹)**
   - **Missing Safa Penalty (₹)**

### 3. **Test Create**
1. Fill in variant details:
   - Name: "Test Variant"
   - Description: "Test description"
   - Base Price: 5000
   - **Extra Safa Price: 100** ✅ NEW
   - **Missing Safa Penalty: 450** ✅ NEW
   - Inclusions: "Safa, Kalgi"
2. Click "Create Variant"
3. Check database to verify fields are saved

### 4. **Test Edit**
1. Click edit icon on a variant
2. Values should load in the form including:
   - Extra Safa Price
   - Missing Safa Penalty
3. Modify values and save
4. Verify changes are persisted

---

## 📊 Example Usage

### Scenario: 21 Safas - Classic Style Package

```
Base Price: ₹4,000
Extra Safa Price: ₹100/piece
Missing Safa Penalty: ₹450/piece

Customer Orders:
- Base: 21 safas = ₹4,000
- Adds 5 extra safas = ₹500 (5 × ₹100)
- Total: ₹4,500

Returns:
- Missing 2 safas = ₹900 penalty (2 × ₹450)
- Refund: ₹4,500 - ₹900 = ₹3,600
```

---

## 🔍 Database Query

To verify the data:

```sql
SELECT 
  c.name as category,
  v.name as variant,
  v.base_price,
  v.extra_safa_price,
  v.missing_safa_penalty
FROM package_variants v
JOIN packages_categories c ON v.category_id = c.id
WHERE v.extra_safa_price > 0
ORDER BY c.name, v.name;
```

---

## ✅ Checklist

- [x] Database columns added (`extra_safa_price`, `missing_safa_penalty`)
- [x] TypeScript interface updated
- [x] Form state includes new fields
- [x] API payload sends new fields to Supabase
- [x] Edit handler loads new fields
- [x] Form reset clears new fields
- [x] UI shows input fields for both values
- [x] Validation handles NaN/empty values (defaults to 0)
- [ ] Run SQL script in Supabase
- [ ] Test creating variant with new fields
- [ ] Test editing variant with new fields
- [ ] Verify data in database

---

## 🎨 UI Screenshot Preview

```
┌─────────────────────────────────────────┐
│ Create New Variant                      │
├─────────────────────────────────────────┤
│ Variant Name:                           │
│ [Classic Style________________]         │
│                                         │
│ Description:                            │
│ [Multi-line text area________]          │
│                                         │
│ Base Price (₹):                         │
│ [4000_________________________]         │
│                                         │
│ Inclusions (comma-separated):           │
│ [Safa, Kalgi, Necklace_______]          │
│                                         │
│ ┌─────────────────┬────────────────┐   │
│ │ Extra Safa (₹)  │ Missing Safa   │   │
│ │ [100___]        │ [450___]       │   │
│ │ Charge for      │ Penalty for    │   │
│ │ additional safas│ lost/damaged   │   │
│ └─────────────────┴────────────────┘   │
│                                         │
│         [Cancel]  [Create Variant]      │
└─────────────────────────────────────────┘
```

---

## 🔗 Related Files

- ✅ `app/sets/sets-client.tsx` - Main UI component
- ✅ `scripts/add-extra-safa-columns.sql` - Database migration
- ✅ `scripts/add-pricing-columns.sql` - Complete schema (includes these + more)
- ✅ `scripts/import-all-safa-pricing.js` - Import script with these fields

---

**Status:** ✅ **COMPLETE** - Ready to test!
