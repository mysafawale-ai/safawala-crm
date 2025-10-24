# 📥 Safa Pricing Data Import Guide

## 🎯 Overview

Your Excel sheet contains pricing for **270 combinations**:
- **10 Categories** (21, 31, 41, 51, 61, 71, 81, 91, 101 Safas)
- **10 Variants** per category (Classic Style, Rajputana, Floral, etc.)
- **3 Levels** per variant (Premium, VIP, VVIP)
- **5 Distance Tiers** per level

---

## 📊 Field Mapping

### ✅ **Fields We Have:**

| Excel Column | Database Table | Field | Type |
|---|---|---|---|
| Category (21, 31...) | `packages_categories` | `name` | "21 Safas", "31 Safas" |
| Package Variant | `package_variants` | `name` | Text |
| Level | `package_levels` | `name` | Premium/VIP/VVIP |
| Price (₹) | `package_levels` | `base_price` | Decimal |
| Inclusions | `package_variants` | `inclusions` | JSONB array |
| 0-10 km, 11-50 km... | `distance_pricing` | `base_price_addition` | Decimal |

### ⚠️ **Fields We Need to Add:**

| Excel Column | Database Table | Field | Status |
|---|---|---|---|
| Extra Safa (₹) | `package_variants` | `extra_safa_price` | ❌ **MISSING** |
| Missing Safa (₹) | `package_variants` | `missing_safa_penalty` | ❌ **MISSING** |

---

## 🚀 Import Steps

### **Step 1: Add Missing Columns**

Run this SQL in Supabase SQL Editor:

```bash
# In Supabase Dashboard → SQL Editor → New Query
```

Copy and paste the contents of:
```
scripts/add-pricing-columns.sql
```

This will add:
- ✅ `extra_safa_price` column
- ✅ `missing_safa_penalty` column
- ✅ `category_id` column to variants
- ✅ `package_levels` table if missing

---

### **Step 2: Install Dependencies**

```bash
cd /Applications/safawala-crm
npm install @supabase/supabase-js
```

---

### **Step 3: Run Import Script**

```bash
node scripts/import-safa-pricing.js
```

**Expected Output:**
```
🚀 Starting import...

📊 Parsed 270 rows from CSV
📦 Found 10 categories

📁 Creating category: 21 Safas
✅ Created category: 21 Safas (abc-123...)
  📝 Creating variant: Classic Style
  ✅ Created variant: Classic Style
    🎚️ Creating level: Premium
    ✅ Created level: Premium (₹4000)
    ✅ Created 5 distance pricing tiers
    ...

🎉 Import complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Statistics:
   Categories: 10
   Variants: 100
   Levels: 300
   Distance Pricing: 1500
━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔍 Verify Import

### **Check Categories:**
```sql
SELECT id, name, franchise_id FROM packages_categories ORDER BY name;
```

Expected: 10 categories (21 Safas → 101 Safas)

### **Check Variants:**
```sql
SELECT 
  c.name as category,
  v.name as variant,
  v.extra_safa_price,
  v.missing_safa_penalty
FROM package_variants v
JOIN packages_categories c ON v.category_id = c.id
ORDER BY c.name, v.name;
```

Expected: 100 variants with prices

### **Check Levels:**
```sql
SELECT 
  c.name as category,
  v.name as variant,
  l.name as level,
  l.base_price
FROM package_levels l
JOIN package_variants v ON l.variant_id = v.id
JOIN packages_categories c ON v.category_id = c.id
WHERE c.name = '21 Safas'
ORDER BY v.name, l.display_order;
```

Expected: 30 levels for "21 Safas" category

### **Check Distance Pricing:**
```sql
SELECT 
  c.name as category,
  v.name as variant,
  l.name as level,
  dp.range,
  dp.base_price_addition
FROM distance_pricing dp
JOIN package_levels l ON dp.package_level_id = l.id
JOIN package_variants v ON l.variant_id = v.id
JOIN packages_categories c ON v.category_id = c.id
WHERE c.name = '21 Safas' 
  AND v.name = 'Classic Style'
  AND l.name = 'Premium'
ORDER BY dp.min_distance_km;
```

Expected: 5 distance tiers (₹500, ₹1000, ₹2000, ₹3000, ₹5000)

---

## 📝 Data Sample

Here's what gets imported for "21 Safas → Classic Style → Premium":

```json
{
  "category": {
    "name": "21 Safas",
    "description": "Premium wedding safa collection for 21 people",
    "franchise_id": "1a518dde-85b7-44ef-8bc4-092f53ddfd99"
  },
  "variant": {
    "name": "Classic Style",
    "description": "Classic Style, 3 VIP Family Safas, Groom Safa not included",
    "extra_safa_price": 100,
    "missing_safa_penalty": 450,
    "inclusions": ["Classic Style", "3 VIP Family Safas", "Groom Safa not included"]
  },
  "level": {
    "name": "Premium",
    "base_price": 4000
  },
  "distance_pricing": [
    { "range": "0-10 km", "price": 500 },
    { "range": "11-50 km", "price": 1000 },
    { "range": "51-250 km", "price": 2000 },
    { "range": "251-500 km", "price": 3000 },
    { "range": "501-2000 km", "price": 5000 }
  ]
}
```

---

## 🎨 UI Display

After import, your Sets page will show:

```
Categories Tab:
├── 21 Safas
├── 31 Safas
├── 41 Safas
└── ... (10 total)

Variants Tab (select "21 Safas"):
├── Classic Style
│   └── Extra Safa: ₹100 | Missing: ₹450 + GST
├── Rajputana Rajwada Styles  
│   └── Extra Safa: ₹120 | Missing: ₹500 + GST
└── ... (10 variants)

Levels Tab (select "Classic Style"):
├── Premium - ₹4,000
├── VIP - ₹4,500
└── VVIP - ₹5,000

Distance Pricing (select "Premium"):
├── 0-10 km: +₹500
├── 11-50 km: +₹1,000
├── 51-250 km: +₹2,000
├── 251-500 km: +₹3,000
└── 501-2000 km: +₹5,000
```

---

## ⚠️ Important Notes

1. **Franchise ID**: Script uses your Surat franchise ID: `1a518dde-85b7-44ef-8bc4-092f53ddfd99`

2. **RLS Bypass**: Uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS policies

3. **Duplicates**: Script will fail if category names already exist. Delete existing data first:
   ```sql
   DELETE FROM distance_pricing;
   DELETE FROM package_levels;
   DELETE FROM package_variants;
   DELETE FROM packages_categories WHERE franchise_id = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';
   ```

4. **GST Note**: "Missing Safa" shows "₹450 + GST" but we store only 450. Add GST calculation in UI.

---

## 🐛 Troubleshooting

### **Error: "column does not exist"**
→ Run `add-pricing-columns.sql` first

### **Error: "permission denied"**
→ Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

### **Error: "duplicate key value"**
→ Categories already exist. Delete or use UPDATE instead of INSERT

### **No data showing in UI**
→ Check franchise isolation filter is working correctly

---

## ✅ Success Checklist

- [ ] SQL columns added (`extra_safa_price`, `missing_safa_penalty`)
- [ ] Import script ran successfully
- [ ] Categories visible in Sets page (only Surat franchise)
- [ ] Variants show correct prices
- [ ] Levels display properly
- [ ] Distance pricing tiers correct
- [ ] Can create bookings with these packages

---

## 📞 Need Help?

Check:
1. Console logs during import
2. Supabase table viewer
3. Browser console on /sets page
4. Network tab for API errors
