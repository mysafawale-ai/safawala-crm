# 🎯 FINAL STEP: Run This SQL in Supabase

## ⚡ Quick Action Required

Copy the SQL below and run it in your **Supabase SQL Editor**:

---

## 📋 SQL Migration Script

```sql
-- Add pincode and pan_number columns to company_settings table
-- Run this migration to support new company information fields

-- Check if columns exist and add them if they don't
DO $$ 
BEGIN
    -- Add pincode column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'pincode'
    ) THEN
        ALTER TABLE company_settings 
        ADD COLUMN pincode VARCHAR(10);
        
        RAISE NOTICE 'Added pincode column to company_settings';
    ELSE
        RAISE NOTICE 'Column pincode already exists in company_settings';
    END IF;

    -- Add pan_number column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'company_settings' 
        AND column_name = 'pan_number'
    ) THEN
        ALTER TABLE company_settings 
        ADD COLUMN pan_number VARCHAR(10);
        
        RAISE NOTICE 'Added pan_number column to company_settings';
    ELSE
        RAISE NOTICE 'Column pan_number already exists in company_settings';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'company_settings'
AND column_name IN ('pincode', 'pan_number')
ORDER BY column_name;
```

---

## 🔧 How to Run

### Step 1: Go to Supabase
1. Open your **Supabase Dashboard**
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run the Migration
1. Click **"New Query"** button
2. Copy the SQL above (lines 13-48)
3. Paste into the SQL editor
4. Click **"Run"** or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

### Step 3: Verify Success
You should see this output:
```
✅ NOTICE: Added pincode column to company_settings
✅ NOTICE: Added pan_number column to company_settings

Results:
┌──────────────┬───────────┬─────────────────────────┬─────────────┐
│ column_name  │ data_type │ character_maximum_length│ is_nullable │
├──────────────┼───────────┼─────────────────────────┼─────────────┤
│ pan_number   │ varchar   │ 10                      │ YES         │
│ pincode      │ varchar   │ 10                      │ YES         │
└──────────────┴───────────┴─────────────────────────┴─────────────┘
```

---

## ✅ After Running Migration

1. **Refresh your app** (if dev server is running)
2. Navigate to **Settings > Company** tab
3. You'll see two new fields:
   - **Pincode** (below State field)
   - **PAN Number** (next to Pincode)
4. Enter test values and click "Save"
5. Reload page to confirm data persists

---

## 🎉 That's It!

Everything else is already done:
- ✅ UI components updated
- ✅ API routes updated
- ✅ TypeScript interfaces updated
- ✅ Auto-uppercase for PAN Number
- ✅ Form validation included

Just run the SQL and you're good to go! 🚀
