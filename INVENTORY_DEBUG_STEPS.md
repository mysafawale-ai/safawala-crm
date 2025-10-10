# 🔍 Inventory Debug Steps

## Issue: No products showing on inventory page despite SQL script success

### Step 1: Check Browser Console for Errors

Open browser console (F12 or Cmd+Option+I) and look for:
- Any red error messages
- Failed API calls
- Authentication errors

### Step 2: Check User Session

In browser console, run:
```javascript
fetch('/api/auth/user')
  .then(r => r.json())
  .then(user => {
    console.log('Current user:', user);
    console.log('Franchise ID:', user.franchise_id);
    console.log('Role:', user.role);
  });
```

### Step 3: Check Network Tab

1. Open Network tab in browser DevTools
2. Refresh the inventory page
3. Look for the API call to fetch products
4. Check the Response - are products being returned?

### Step 4: Verify in Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor
2. Open `products` table
3. Filter by the franchise_id from Step 2
4. Verify 10 products exist with `is_active = true`

### Step 5: Check if fetchProductsForUser is being called

In browser console, check for console.error messages about "Failed to load products"

### Step 6: Manual API Test

In browser console, run:
```javascript
// Test fetching products directly
fetch('/api/auth/user')
  .then(r => r.json())
  .then(user => {
    console.log('User:', user);
    // Now fetch products with Supabase
    return import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(
        'https://qpinyaxkusvuajtmgrss.supabase.co',
        'YOUR_ANON_KEY' // Get from .env.local
      );
      return supabase
        .from('products')
        .select('*')
        .eq('franchise_id', user.franchise_id)
        .eq('is_active', true);
    });
  })
  .then(result => {
    console.log('Products query result:', result);
  });
```

## Common Issues to Check

### Issue 1: User not logged in properly
- Check if safawala_session cookie exists
- Try logging out and logging back in

### Issue 2: Franchise ID mismatch
- User's franchise_id doesn't match products' franchise_id
- Check both in Supabase dashboard

### Issue 3: RLS (Row Level Security) blocking query
- Products table might have RLS policies
- Check if authenticated users can read products

### Issue 4: is_active filter
- Products might have is_active = false
- Check in database

## Quick SQL Checks (Run in Supabase SQL Editor)

```sql
-- 1. Check user
SELECT email, role, franchise_id 
FROM users 
WHERE email = 'mysafawale@gmail.com';

-- 2. Check products count
SELECT COUNT(*) as total_products
FROM products p
JOIN users u ON p.franchise_id = u.franchise_id
WHERE u.email = 'mysafawale@gmail.com'
AND p.is_active = true;

-- 3. List products
SELECT 
    p.product_code,
    p.name,
    p.is_active,
    p.franchise_id,
    u.email as franchise_email
FROM products p
JOIN users u ON p.franchise_id = u.franchise_id
WHERE u.email = 'mysafawale@gmail.com'
ORDER BY p.created_at DESC;
```

## Next Steps

After identifying the issue, we may need to:
1. Fix RLS policies
2. Correct franchise_id mismatches
3. Update the fetchProductsForUser function
4. Add better error handling and logging
