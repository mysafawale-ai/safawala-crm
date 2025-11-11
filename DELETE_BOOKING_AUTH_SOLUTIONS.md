# 🔐 Delete Booking Authentication - Multiple Solutions

## Current Issue
The delete booking API is returning a **404 error** because the authentication isn't being properly passed with the DELETE request.

## API Already Has Auth ✅
The backend API (`/app/api/bookings/[id]/route.ts`) already uses `requireAuth` middleware correctly:
```typescript
const auth = await requireAuth(request, 'staff')
if (!auth.success) {
  return NextResponse.json(auth.response, { status: 401 })
}
```

---

## Solution 1: Add Credentials to Fetch (SIMPLEST ⭐ Recommended)

### What to do:
Simply add `credentials: 'include'` to your fetch call to ensure cookies are sent.

### Implementation:
```typescript
const handleDeleteBooking = async (bookingId: string, source?: string) => {
  showConfirmation({
    title: "Delete booking?",
    description: "This will permanently delete the booking and its items. This action cannot be undone.",
    confirmText: "Delete",
    variant: "destructive",
    onConfirm: async () => {
      try {
        const normalized = source === 'package_bookings' ? 'package_booking'
          : source === 'product_orders' ? 'product_order'
          : source === 'direct_sales' ? 'direct_sales'
          : 'unified'
        const url = `/api/bookings/${bookingId}${source ? `?type=${normalized}` : ''}`
        
        // ✅ ADD THIS: Include credentials for authentication
        const res = await fetch(url, { 
          method: 'DELETE',
          credentials: 'include'  // 👈 This sends auth cookies
        })
        
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: 'Failed to delete' }))
          throw new Error(error || 'Failed to delete booking')
        }
        toast({ title: 'Deleted', description: 'Booking deleted successfully' })
        refresh()
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to delete booking', variant: 'destructive' })
      }
    }
  })
}
```

### ✅ Pros:
- **Minimal code change** (one line!)
- Uses existing Supabase session cookies
- Consistent with other API calls in the app
- No additional state management needed

### ❌ Cons:
- Relies on cookies being present
- Browser must support credentials

---

## Solution 2: Get and Send Auth Token Explicitly

### What to do:
Retrieve the Supabase session token and send it as a Bearer token in the Authorization header.

### Implementation:
```typescript
const handleDeleteBooking = async (bookingId: string, source?: string) => {
  showConfirmation({
    title: "Delete booking?",
    description: "This will permanently delete the booking and its items. This action cannot be undone.",
    confirmText: "Delete",
    variant: "destructive",
    onConfirm: async () => {
      try {
        // ✅ Get auth token from Supabase
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.access_token) {
          throw new Error('Not authenticated')
        }
        
        const normalized = source === 'package_bookings' ? 'package_booking'
          : source === 'product_orders' ? 'product_order'
          : source === 'direct_sales' ? 'direct_sales'
          : 'unified'
        const url = `/api/bookings/${bookingId}${source ? `?type=${normalized}` : ''}`
        
        // ✅ Send token in Authorization header
        const res = await fetch(url, { 
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({ error: 'Failed to delete' }))
          throw new Error(error || 'Failed to delete booking')
        }
        toast({ title: 'Deleted', description: 'Booking deleted successfully' })
        refresh()
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to delete booking', variant: 'destructive' })
      }
    }
  })
}
```

### ✅ Pros:
- **Explicit authentication** - you know exactly what's being sent
- Works even if cookies are disabled
- Can check auth state before making request
- More portable across different environments

### ❌ Cons:
- Slightly more code
- Adds an extra async call to get session
- Requires `createClient` import (already imported)

---

## Solution 3: Reusable Authenticated Fetch Utility (BEST FOR SCALE)

### What to do:
Create a reusable utility function that handles authentication for all API calls.

### Implementation:

#### Step 1: Create utility file
```typescript
// /lib/api-client.ts

import { createClient } from "@/lib/supabase/client"

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean
}

/**
 * Authenticated fetch wrapper that automatically includes auth credentials
 */
export async function apiFetch(url: string, options: ApiFetchOptions = {}) {
  const { requireAuth = true, headers = {}, ...fetchOptions } = options
  
  const supabase = createClient()
  
  // Get session if auth is required
  let authHeaders = {}
  if (requireAuth) {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('Authentication required')
    }
    
    authHeaders = {
      'Authorization': `Bearer ${session.access_token}`
    }
  }
  
  // Make fetch call with auth headers
  const response = await fetch(url, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  })
  
  // Parse JSON response
  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`)
  }
  
  return { data, response }
}
```

#### Step 2: Use in bookings page
```typescript
import { apiFetch } from "@/lib/api-client"

const handleDeleteBooking = async (bookingId: string, source?: string) => {
  showConfirmation({
    title: "Delete booking?",
    description: "This will permanently delete the booking and its items. This action cannot be undone.",
    confirmText: "Delete",
    variant: "destructive",
    onConfirm: async () => {
      try {
        const normalized = source === 'package_bookings' ? 'package_booking'
          : source === 'product_orders' ? 'product_order'
          : source === 'direct_sales' ? 'direct_sales'
          : 'unified'
        const url = `/api/bookings/${bookingId}${source ? `?type=${normalized}` : ''}`
        
        // ✅ Simple authenticated call
        await apiFetch(url, { method: 'DELETE' })
        
        toast({ title: 'Deleted', description: 'Booking deleted successfully' })
        refresh()
      } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Failed to delete booking', variant: 'destructive' })
      }
    }
  })
}
```

### ✅ Pros:
- **Reusable** across entire application
- Centralized auth logic
- Consistent error handling
- Easy to add retry logic, logging, etc.
- Can be extended with interceptors

### ❌ Cons:
- Requires creating a new utility file
- More upfront work
- Needs to be imported wherever used

---

## Comparison Table

| Feature | Solution 1 | Solution 2 | Solution 3 |
|---------|-----------|-----------|-----------|
| **Lines of Code** | +1 line | +8 lines | +50 lines (reusable) |
| **Complexity** | Very Simple | Simple | Moderate |
| **Reusability** | No | No | Yes |
| **Maintenance** | Easy | Easy | Centralized |
| **Auth Visibility** | Hidden | Explicit | Abstracted |
| **Best For** | Quick fix | Single use | Enterprise app |

---

## 🎯 Recommendation

**For immediate fix:** Use **Solution 1** (add `credentials: 'include'`)

**For long-term:** Use **Solution 3** (create reusable utility) and migrate all fetch calls to use it.

**For middle ground:** Use **Solution 2** if you want explicit control without creating utilities.

---

## 🔍 Why Current Code Fails

The current code:
```typescript
const res = await fetch(url, { method: 'DELETE' })
```

Does NOT send authentication cookies by default due to CORS and security policies. The backend API receives an unauthenticated request and returns 404 (from the authentication check failing).

## ✅ Quick Fix (Choose One)

**Option A - Minimal Change:**
```typescript
const res = await fetch(url, { 
  method: 'DELETE',
  credentials: 'include'  // 👈 Add this
})
```

**Option B - Explicit Auth:**
```typescript
const supabase = createClient()
const { data: { session } } = await supabase.auth.getSession()

const res = await fetch(url, { 
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
})
```

---

## 🚀 Which One Should You Choose?

1. **Need it working NOW?** → Solution 1
2. **Want explicit control?** → Solution 2
3. **Building for scale?** → Solution 3
4. **Multiple developers?** → Solution 3
5. **Quick prototype?** → Solution 1

Let me know which solution you prefer, and I'll implement it for you!
