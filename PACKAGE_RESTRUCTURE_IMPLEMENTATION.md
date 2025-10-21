# Package Restructure Implementation Guide

## ✅ What's Been Done

### 1. Fixed Booking Items API Error
**File:** `app/api/bookings/[id]/items/route.ts`
- Fixed foreign key references for package_booking_items
- Now correctly joins with package_sets and package_variants tables
- Error "10 booking(s) had errors loading items" should be resolved

### 2. Created New Database Structure
**File:** `CREATE_PACKAGE_LEVELS_TABLE.sql`
- Created `package_levels` table (shown as "Variants" in UI)
- Added columns to `package_variants`: category_id, display_order, franchise_id
- Added `level_id` to `distance_pricing` table
- Created all necessary indexes and foreign keys
- Enabled Row Level Security

### 3. Updated Data Fetching Logic  
**File:** `app/sets/page.tsx`
- Modified to fetch variants directly from categories (no more package_sets)
- Fetches levels under each variant
- Fetches distance pricing under each level
- Maintains franchise isolation

## 🔧 Required Manual Steps

### Step 1: Run SQL in Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/xplnyaxkusvuajtmorss/sql
2. Open and run: `CREATE_PACKAGE_LEVELS_TABLE.sql`
3. Verify tables created:
```sql
SELECT * FROM package_levels LIMIT 1;
SELECT category_id FROM package_variants LIMIT 1;
SELECT level_id FROM distance_pricing LIMIT 1;
```

### Step 2: Migrate Existing Data

Run these queries in Supabase SQL Editor:

```sql
-- A. Link variants to categories (via their parent package_set)
UPDATE package_variants pv
SET category_id = ps.category_id,
    franchise_id = ps.franchise_id
FROM package_sets ps
WHERE pv.package_id = ps.id
AND pv.category_id IS NULL;

-- B. Create default levels (Raja, VIP, VVIP) for each variant
INSERT INTO package_levels (
    variant_id,
    name,
    description,
    base_price,
    display_order,
    franchise_id
)
SELECT 
    pv.id as variant_id,
    level_name,
    level_description,
    pv.base_price + price_increment,
    display_order,
    pv.franchise_id
FROM package_variants pv
CROSS JOIN (
    VALUES 
        ('Raja', 'Standard tier with essential features', 0, 1),
        ('VIP', 'Premium tier with enhanced features', 5000, 2),
        ('VVIP', 'Ultimate tier with all premium features', 10000, 3)
) AS levels(level_name, level_description, price_increment, display_order)
WHERE NOT EXISTS (
    SELECT 1 FROM package_levels pl 
    WHERE pl.variant_id = pv.id 
    AND pl.name = level_name
);

-- C. Migrate distance pricing to new structure
UPDATE distance_pricing dp
SET level_id = (
    SELECT pl.id 
    FROM package_levels pl 
    WHERE pl.variant_id = dp.variant_id 
    AND pl.name = 'Raja'  -- Default to Raja level
    LIMIT 1
)
WHERE level_id IS NULL;

-- D. Verify migration
SELECT 
    pc.name as category,
    pv.name as variant_package,
    pl.name as level_variant,
    pl.base_price
FROM packages_categories pc
LEFT JOIN package_variants pv ON pv.category_id = pc.id
LEFT JOIN package_levels pl ON pl.variant_id = pv.id
ORDER BY pc.name, pv.display_order, pl.display_order
LIMIT 20;
```

### Step 3: Update UI Component (TODO)

**File to update:** `app/sets/sets-client.tsx`

Changes needed:
1. Rename "Packages" → display as "Packages" (actually variants)
2. Rename "Variants" → display as "Variants" (actually levels)
3. Update all forms and dialogs
4. Update delete confirmations

### Step 4: Test Everything

1. Navigate to /sets page
2. Verify categories show
3. Click on category → see packages (variants)
4. Click on package → see variants (levels): Raja, VIP, VVIP
5. Test adding/editing/deleting
6. Test distance pricing

## 📊 New Structure

```
Categories (packages_categories)
  ├── Category: "30 Safas"
  │   ├── Package (variant): "Standard 30 Set"
  │   │   ├── Variant (level): "Raja" (₹25,000)
  │   │   ├── Variant (level): "VIP" (₹30,000)
  │   │   └── Variant (level): "VVIP" (₹35,000)
  │   └── Package (variant): "Premium 30 Set"
  │       ├── Variant (level): "Raja" (₹30,000)
  │       └── Variant (level): "VIP" (₹35,000)
  └── Category: "31 Safa"
      └── ...
```

## 🎯 Benefits

1. **More Flexible**: Add any pricing tier (not just standard/premium)
2. **Clearer**: Simpler hierarchy for users
3. **Customizable**: Different levels per package
4. **Scalable**: Easy to add new tiers

## ⚠️ Backward Compatibility

- Old `package_sets` table is NOT deleted
- Booking system still references old structure
- Need to update booking creation later
- For now, both structures coexist

## 🚀 Next Steps

1. ✅ Run CREATE_PACKAGE_LEVELS_TABLE.sql
2. ✅ Run data migration queries
3. ⏳ Update UI component labels
4. ⏳ Test all functionality
5. ⏳ Update booking creation to use new structure
6. ⏳ Remove old package_sets references

## 📝 Notes

- Level names are customizable per package
- Default levels: Raja, VIP, VVIP
- Can add more levels as needed
- Distance pricing now tied to levels, not variants
