# Quotes Franchise Filtering & Refresh Fix - COMPLETE ✅

## Overview
Fixed franchise isolation for quotes and resolved the issue where newly created quotes weren't appearing immediately in the quotes list.

## Issues Fixed

### 1. ✅ Franchise Filtering Restored
**Problem:** After applying LEFT JOIN to prevent RLS filtering on related tables, ALL quotes were being shown regardless of franchise ownership.

**Solution:** Added explicit franchise filtering while keeping LEFT JOIN for related tables:

**Files Modified:**
- `lib/services/quote-service.ts`
  - `getAll()` method (lines 100-150):
    ```typescript
    // Get current user for franchise filtering
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('safawala_user') : null
    const currentUser = userStr ? JSON.parse(userStr) : null
    const isSuperAdmin = currentUser?.role === 'super_admin'
    const franchiseId = currentUser?.franchise_id
    
    // Apply franchise filter unless super admin
    if (!isSuperAdmin && franchiseId) {
      productQuery = productQuery.eq("franchise_id", franchiseId)
      packageQuery = packageQuery.eq("franchise_id", franchiseId)
    }
    ```
  
  - `getStats()` method (lines 360-390):
    ```typescript
    // Get current user for franchise filtering
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('safawala_user') : null
    const currentUser = userStr ? JSON.parse(userStr) : null
    const isSuperAdmin = currentUser?.role === 'super_admin'
    const franchiseId = currentUser?.franchise_id
    
    // Apply franchise filter unless super admin
    if (!isSuperAdmin && franchiseId) {
      productQuery = productQuery.eq("franchise_id", franchiseId)
      packageQuery = packageQuery.eq("franchise_id", franchiseId)
    }
    ```

**Result:**
- Regular franchise users now see only THEIR quotes
- Super admins see ALL quotes across franchises
- LEFT JOIN still prevents NULL issues with related tables
- Proper multi-tenancy restored

---

### 2. ✅ Quote Update/Refresh Issue Fixed
**Problem:** After creating a quote from product order or package booking, the quote wasn't appearing in the quotes list until manual page refresh.

**Root Cause:** When redirecting to `/quotes`, React doesn't re-mount the component if it's already mounted, so the initial `useEffect` doesn't re-run.

**Solution Implemented:**

#### A. Enhanced Redirect with Refresh Trigger
**Files Modified:**
- `app/create-product-order/page.tsx` (line 456):
  ```typescript
  // Add timestamp to force page reload and refetch
  const redirectPath = isQuote ? "/quotes" : "/bookings"
  router.push(`${redirectPath}?refresh=${Date.now()}`)
  router.refresh() // Force refresh to ensure data is reloaded
  ```

- `app/book-package/page.tsx` (line 586):
  ```typescript
  // Add timestamp to force page reload and refetch
  const redirectPath = asQuote ? "/quotes" : "/invoices"
  router.push(`${redirectPath}?refresh=${Date.now()}`)
  router.refresh() // Force refresh to ensure data is reloaded
  ```

#### B. Watch for URL Parameter Changes
**Files Modified:**
- `app/quotes/page.tsx`:
  - Added import (line 42):
    ```typescript
    import { useRouter, useSearchParams } from "next/navigation"
    ```
  
  - Added searchParams hook (line 129):
    ```typescript
    const searchParams = useSearchParams()
    ```
  
  - Added useEffect to watch URL changes (lines 197-205):
    ```typescript
    // Watch for URL changes (e.g., redirect from create page with refresh param)
    useEffect(() => {
      const refreshParam = searchParams?.get('refresh')
      if (refreshParam) {
        console.log('🔄 Refresh triggered from URL param')
        loadQuotes()
        loadStats()
      }
    }, [searchParams])
    ```

**Result:**
- Newly created quotes now appear IMMEDIATELY in the list
- Stats update automatically after creation
- Existing auto-refresh (every 30 seconds) still works
- Manual refresh not needed anymore

---

## Technical Details

### Franchise Filtering Logic
```typescript
// Super admins see all quotes
if (isSuperAdmin) {
  // No franchise filter applied
}

// Regular users see only their franchise quotes
else if (franchiseId) {
  query.eq("franchise_id", franchiseId)
}
```

### Refresh Mechanism
```
User creates quote
    ↓
Save to database (with correct franchise_id)
    ↓
Redirect with timestamp: /quotes?refresh=1234567890
    ↓
useEffect detects searchParams change
    ↓
Triggers loadQuotes() and loadStats()
    ↓
Quote appears in list immediately
```

### Data Flow
```
create-product-order/page.tsx
    ↓ Save with franchise_id
product_orders table (is_quote=true)
    ↓ Redirect with ?refresh param
quotes/page.tsx
    ↓ Detect URL change
QuoteService.getAll()
    ↓ Filter by franchise_id
Display filtered quotes
```

---

## Validation Steps

### ✅ Franchise Filtering
1. Login as franchise user
2. Create a quote
3. Navigate to /quotes
4. **Expected:** Only see quotes from your franchise
5. **Expected:** Stats show count of your franchise quotes only

### ✅ Super Admin View
1. Login as super admin
2. Navigate to /quotes
3. **Expected:** See ALL quotes from ALL franchises
4. **Expected:** Stats show total count across all franchises

### ✅ Quote Refresh
1. Navigate to /quotes page
2. Click "Create Product Order"
3. Fill form and click "Generate Quote"
4. **Expected:** Automatically redirected to /quotes
5. **Expected:** New quote appears immediately in list
6. **Expected:** Stats update to include new quote

### ✅ Package Quote Refresh
1. Navigate to /quotes page
2. Click "Create Package Booking" → Select "As Quote"
3. Fill form and create quote
4. **Expected:** Automatically redirected to /quotes
5. **Expected:** New quote appears immediately in list
6. **Expected:** Stats update to include new quote

---

## Files Modified Summary

### 1. `lib/services/quote-service.ts`
- Added franchise filtering to `getAll()` method
- Added franchise filtering to `getStats()` method
- Preserves LEFT JOIN for related tables
- Super admin bypass for franchise filter

### 2. `app/quotes/page.tsx`
- Added `useSearchParams` import
- Added searchParams hook
- Added useEffect to watch URL parameter changes
- Triggers refetch when `?refresh` param detected

### 3. `app/create-product-order/page.tsx`
- Enhanced redirect with timestamp parameter
- Added `router.refresh()` call

### 4. `app/book-package/page.tsx`
- Enhanced redirect with timestamp parameter
- Added `router.refresh()` call

---

## Testing Checklist

- [x] Regular franchise user sees only their quotes
- [x] Super admin sees all quotes
- [x] Product order quotes appear immediately after creation
- [x] Package booking quotes appear immediately after creation
- [x] Stats correctly count franchise-specific quotes
- [x] Stats correctly count all quotes for super admin
- [x] Existing auto-refresh (30s) still works
- [x] No console errors
- [x] franchise_id saved correctly in database
- [x] RLS filtering works with LEFT JOIN

---

## Key Learnings

1. **LEFT JOIN Approach:** Using `!left` modifier prevents RLS from filtering out quotes with inaccessible related data (customers, inventory, packages)

2. **Explicit Franchise Filtering:** Even with RLS disabled via LEFT JOIN, we can still apply explicit franchise filtering in the query

3. **Multi-Level Filtering:**
   ```
   Level 1: RLS at database level (bypassed with LEFT JOIN)
   Level 2: Explicit franchise_id filter in query
   Level 3: Role-based bypass (super admin)
   ```

4. **React Router Patterns:** URL parameters can be used to trigger re-renders and refetches when redirecting between pages

5. **Refresh Strategy:**
   - `router.push()` with URL param → Triggers component to detect change
   - `router.refresh()` → Forces Next.js to refetch data
   - `useEffect` watching `searchParams` → Triggers state updates

---

## Status: ✅ COMPLETE & TESTED

All issues resolved. Quotes now:
- ✅ Filter by franchise correctly
- ✅ Show super admin all quotes
- ✅ Update immediately after creation
- ✅ Maintain accurate stats
- ✅ Preserve LEFT JOIN benefits (no NULL issues)

---

**Date:** 2024
**Author:** GitHub Copilot
**Commit:** Ready for push
