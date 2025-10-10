# 🔴 Customer Creation Error - FIXED

## Error Found:
```
Error creating customer: Error: Could not find the 'created_by' column 
of 'customers' in the schema cache
```

## Root Cause:
The `customers` table is **missing the `created_by` column** that the API is trying to insert.

## Fix:
Run this SQL in Supabase SQL Editor:

### Quick Fix (Just created_by):
```sql
-- Add created_by column
ALTER TABLE customers ADD COLUMN created_by UUID REFERENCES users(id);

-- Set existing customers' created_by to their franchise admin
UPDATE customers c
SET created_by = (
    SELECT u.id 
    FROM users u 
    WHERE u.franchise_id = c.franchise_id 
    AND u.role IN ('franchise_admin', 'super_admin')
    ORDER BY u.created_at ASC 
    LIMIT 1
)
WHERE c.created_by IS NULL;
```

### Complete Fix (All missing columns):
Run: `scripts/fixes/fix-customers-table-complete.sql`

This adds:
- ✅ `created_by` (who created the customer)
- ✅ `updated_by` (who last updated - for future)
- ✅ All other expected columns (name, phone, email, etc.)

## After Running the Fix:

1. **Refresh the page** at `localhost:3000/customers/new`
2. **Try creating a customer again**
3. Should work! ✅

## Why This Happened:

The API code expects `created_by`:
```typescript
// app/api/customers/route.ts line 135
.insert({
  name, phone, email, address,
  franchise_id: franchiseId,
  created_by: userId,  // ← This column was missing!
})
```

But the database table didn't have it.

## Files Created:

1. `/scripts/fixes/add-created-by-to-customers.sql` - Quick fix
2. `/scripts/fixes/fix-customers-table-complete.sql` - Complete fix

## Next Steps:

1. ✅ Copy the SQL from `fix-customers-table-complete.sql`
2. ✅ Paste into Supabase SQL Editor
3. ✅ Run it
4. ✅ Refresh browser and try creating customer again
5. ✅ Should work! 🎉
