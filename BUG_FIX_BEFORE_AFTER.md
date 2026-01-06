# Item Persistence Bug - Before & After Comparison

## THE PROBLEM
User creates booking → Adds products → Saves → Edits booking → Items are GONE ❌

## ROOT CAUSE

```
SAVE (handleCreateOrder):
  invoiceItems = [{ product_id: 5, quantity: 2, unit_price: 1000 }]
  INSERT INTO product_order_items VALUES (order_id, 5, 2, 1000, 2000)
  ✅ Saved successfully

LOAD (loadExistingOrder - BROKEN):
  SELECT * FROM product_order_items
  LEFT JOIN products ON product_id = products.id
  
  Problem: If product deleted or RLS blocks products table
  Result: { product_id: 5, product_name: NULL, barcode: NULL }
  ❌ Item appears as "Unknown Product" or missing
```

## SOLUTION: DENORMALIZATION

### Database Schema Change
```sql
-- BEFORE
CREATE TABLE product_order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES product_orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL,
  total_price DECIMAL
);

-- AFTER (add denormalized columns)
ALTER TABLE product_order_items ADD COLUMN product_name TEXT;
ALTER TABLE product_order_items ADD COLUMN barcode TEXT;
ALTER TABLE product_order_items ADD COLUMN category TEXT;
ALTER TABLE product_order_items ADD COLUMN image_url TEXT;

CREATE TABLE product_order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES product_orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  unit_price DECIMAL,
  total_price DECIMAL,
  -- DENORMALIZED (stored directly, no JOIN needed)
  product_name TEXT,
  barcode TEXT,
  category TEXT,
  image_url TEXT
);
```

### Code Flow - BEFORE (BROKEN)
```typescript
// SAVE
const item = { product_id: 5, quantity: 2, unit_price: 1000 }
INSERT INTO product_order_items VALUES (order_id, 5, 2, 1000, 2000)
// ❌ product_name NOT saved - will be NULL

// LOAD
SELECT * FROM product_order_items
LEFT JOIN products ON product_id = products.id
// ❌ If products.id = 5 is deleted → join returns NULL
// ❌ Item shows as "Unknown Product"
```

### Code Flow - AFTER (FIXED)
```typescript
// SAVE (now includes all product details)
const item = {
  product_id: 5,
  product_name: "Barati Safa",        // ← NOW SAVED
  barcode: "SAF-001",                 // ← NOW SAVED
  category: "Wedding",                // ← NOW SAVED
  image_url: "https://...",           // ← NOW SAVED
  quantity: 2,
  unit_price: 1000,
  total_price: 2000
}
INSERT INTO product_order_items VALUES (
  order_id, 5,
  "Barati Safa", "SAF-001", "Wedding", "https://...",
  2, 1000, 2000
)
// ✅ ALL product details stored directly

// LOAD (no JOIN needed)
SELECT * FROM product_order_items WHERE order_id = ?
// Result includes:
// { product_id: 5, product_name: "Barati Safa", barcode: "SAF-001", ... }
// ✅ Works even if products.id = 5 is deleted
// ✅ No RLS issues - reading from own table
```

## DATA COMPARISON

### BEFORE (Broken)
```
product_orders table:
├── id: "order-123"
├── order_number: "INV/123"
└── ...

product_order_items table:
├── id: "item-456"
├── order_id: "order-123"
├── product_id: 5              ← ONLY this
├── quantity: 2
├── unit_price: 1000
├── total_price: 2000
└── (product_name: NULL)       ← ❌ Not stored
    (barcode: NULL)            ← ❌ Need to JOIN products
    (category: NULL)
    (image_url: NULL)

products table:
├── id: 5
├── name: "Barati Safa"
├── barcode: "SAF-001"
└── ...

LOADING with JOIN:
- If product.id = 5 is deleted → JOIN fails
- If RLS blocks products table → JOIN fails
- Result: NULL values appear → "Unknown Product"
```

### AFTER (Fixed)
```
product_orders table:
├── id: "order-123"
├── order_number: "INV/123"
└── ...

product_order_items table:
├── id: "item-456"
├── order_id: "order-123"
├── product_id: 5
├── product_name: "Barati Safa"      ← ✅ Stored directly
├── barcode: "SAF-001"                ← ✅ Stored directly
├── category: "Wedding"               ← ✅ Stored directly
├── image_url: "https://..."          ← ✅ Stored directly
├── quantity: 2
├── unit_price: 1000
└── total_price: 2000

LOADING (simple SELECT):
- No JOIN needed
- product.id deletion doesn't matter
- RLS policies don't affect reading own table
- Result: All fields populated → Item displays correctly ✅
```

## TESTING CHECKLIST

- [ ] Apply migration to Supabase
- [ ] Create new booking with products
- [ ] Verify items save with all details in database
- [ ] Edit the booking
- [ ] Verify items display correctly (not "Unknown Product")
- [ ] Check console logs show denormalized data
- [ ] Verify product details visible in edit view
- [ ] Test with quote → convert to booking flow

## PERFORMANCE IMPACT

**Positive:**
- Eliminates expensive LEFT JOIN on product table
- Faster load times (direct column read vs join)
- Indexes on product_name and barcode for searching

**Storage:**
- Minor increase: ~200 bytes per item (product_name, barcode, category, image_url strings)
- Negligible for typical order volumes

## ROOT CAUSE OF ORIGINAL BUG

The code was following a "normalized" database pattern:
- Store only IDs in order_items
- JOIN with products table to fetch details

This pattern fails when:
1. Product gets deleted (hard delete, not soft delete)
2. RLS policies restrict access to products table
3. Products table has restrictive security filters

The lost/damaged items system already worked around this by denormalizing all data, proving this pattern is necessary for reliability.
