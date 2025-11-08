# 🔧 FIX: Products Not Adding - Missing Columns

## THE ERROR YOU SAW

```
ERROR: column "product_code" of relation "products" does not exist
```

**Cause:** Your `products` table is missing these columns:
- `product_code`
- `barcode`
- `franchise_id`
- `is_active`

---

## THE FIX - 2 SQL Scripts to Run

### SCRIPT 1: Add Missing Columns (Run FIRST)
**File:** `/Applications/safawala-crm/ADD_MISSING_PRODUCT_COLUMNS.sql`

```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS franchise_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_products_franchise_id ON products(franchise_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
```

**What it does:**
- ✅ Adds missing columns
- ✅ Creates performance indexes
- ✅ Safe (uses `IF NOT EXISTS`)

---

### SCRIPT 2: Insert Products (Run SECOND)
**File:** `/Applications/safawala-crm/INSERT_PRODUCTS_WORKING.sql`

This script inserts 32 products without the missing columns.

---

## STEP-BY-STEP INSTRUCTIONS

### Step 1: Run Column Addition Script
1. Open Supabase SQL Editor
2. Create NEW query
3. Copy content from: `ADD_MISSING_PRODUCT_COLUMNS.sql`
4. Paste into Supabase
5. Click **RUN**
6. Wait for success ✅

### Step 2: Run Product Insertion Script
1. Create ANOTHER new query
2. Copy content from: `INSERT_PRODUCTS_WORKING.sql`
3. Paste into Supabase
4. Click **RUN**
5. Wait for success ✅

---

## VERIFY IT WORKED

After running both scripts:

1. Go to **Tables** → **products**
2. Filter by: `franchise_id = 1a518dde-85b7-44ef-8bc4-092f53ddfd99`
3. You should see 32 new products:
   - 9 Safas
   - 3 Talwar Belts
   - 3 Brooches
   - 3 Malas
   - 3 Dupattas
   - 3 Katars
   - 2 Mods
   - 2 Tilaks

---

## THEN TEST IN YOUR APP

1. Go to: http://localhost:3001/book-package
2. Click "Select Products"
3. You should see all 32 products! ✅

---

## QUICK COPY-PASTE

### Script 1 - Column Addition:
```sql
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR;
ALTER TABLE products ADD COLUMN IF NOT EXISTS franchise_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
CREATE INDEX IF NOT EXISTS idx_products_franchise_id ON products(franchise_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
```

Then run Script 2 (INSERT_PRODUCTS_WORKING.sql) - it has 32 insert statements.

---

**Now do this and products will finally be added!** 🚀
