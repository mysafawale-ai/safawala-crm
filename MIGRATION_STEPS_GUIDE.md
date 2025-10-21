# 🚀 Step-by-Step Migration Guide

## Run These Scripts in Order (No Errors!)

Each script is **safe to run multiple times** and handles existing objects gracefully.

### 📋 Step 1: Create Table
**File:** `STEP_1_CREATE_TABLE.sql`
- Creates `package_levels` table
- Uses `IF NOT EXISTS` - safe to rerun
- ✅ Run this first

### 📋 Step 2: Add Columns
**File:** `STEP_2_ADD_COLUMNS.sql`
- Adds `category_id`, `display_order`, `franchise_id` to `package_variants`
- Adds `level_id` to `distance_pricing`
- Checks if columns exist before adding
- ✅ Run this second

### 📋 Step 3: Create Indexes
**File:** `STEP_3_CREATE_INDEXES.sql`
- Creates performance indexes
- Uses `IF NOT EXISTS` - safe to rerun
- ✅ Run this third

### 📋 Step 4: Enable Security
**File:** `STEP_4_ENABLE_RLS.sql`
- Enables Row Level Security
- Drops existing policy before creating (handles duplicates)
- ✅ Run this fourth

### 📋 Step 5: Create Trigger
**File:** `STEP_5_CREATE_TRIGGER.sql`
- Creates `updated_at` trigger
- Drops existing trigger before creating
- ✅ Run this fifth

### 📋 Step 6: Migrate Data
**File:** `STEP_6_MIGRATE_DATA.sql`
- Links variants to categories
- Creates Raja, VIP, VVIP levels
- Links distance pricing
- Checks for existing data
- ✅ Run this sixth

### 📋 Step 7: Verify
**File:** `STEP_7_VERIFY.sql`
- Shows your new data structure
- Displays counts and hierarchy
- ✅ Run this last to confirm everything worked

---

## 🎯 After Running All Steps

Your structure will be:
```
Categories (30 Safas, 31 Safa)
  └── Variants (imjmk, Desi, Basic) - shown directly
      └── Levels (Raja, VIP, VVIP)
          └── Distance Pricing
```

## ✅ Expected Results

After Step 7 verification, you should see:
- Categories count
- Package Variants count (linked to categories)
- Package Levels count (Raja, VIP, VVIP for each variant)
- Distance Pricing count (linked to levels)

## 🔧 If You Get Errors

Each step is designed to be safe, but if you hit an error:
1. Read the error message
2. The script likely worked partially
3. Just rerun the same step - it will skip what's already done
4. Continue to next step

## 🚀 Ready to Go!

Copy each file content into Supabase SQL Editor and run in order!
