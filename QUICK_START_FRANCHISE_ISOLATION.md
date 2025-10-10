# 🚀 QUICK START - Franchise Isolation Implementation

## ⚡ 3-Step Setup

### 1️⃣ Create Super Admin HQ Franchise (2 minutes)
**Run in Supabase SQL Editor:**
```
Copy from: scripts/CREATE_SUPER_ADMIN_HQ_FRANCHISE.sql
Click RUN
```
✅ Creates HQ franchise (HQ001)
✅ Assigns super admin to HQ
✅ Sets up company settings

---

### 2️⃣ Implement Middleware in APIs (Per route)
**Use the middleware layer:**

```typescript
import { 
  getFranchiseContext,
  applyFranchiseFilter,
  getFranchiseIdForCreate,
  canAccessFranchise 
} from "@/lib/middleware/franchise-isolation"

// In your API route:
export async function GET() {
  const context = await getFranchiseContext()
  
  let query = supabase.from("customers").select("*")
  query = applyFranchiseFilter(query, context)
  // Super Admin: No filter (sees all)
  // Franchise Admin: Filtered by their franchise_id
  
  const { data } = await query
  return NextResponse.json({ data })
}
```

---

### 3️⃣ Test Both User Types

**Test Super Admin:**
```sql
-- Should see HQ franchise
SELECT * FROM users WHERE id = auth.uid();

-- Should see ALL customers
SELECT COUNT(*) FROM customers;
```

**Test Franchise Admin:**
```sql
-- Should see their franchise only
SELECT COUNT(*) FROM customers;
```

---

## 📁 Files You Got

| File | Purpose |
|------|---------|
| `CREATE_SUPER_ADMIN_HQ_FRANCHISE.sql` | Creates HQ franchise for super admin |
| `franchise-isolation.ts` | Middleware for franchise filtering |
| `EXAMPLE_API_WITH_FRANCHISE_ISOLATION.ts` | Complete API example |
| `FRANCHISE_ISOLATION_ARCHITECTURE.md` | Full documentation |

---

## 🎯 What You Achieve

✅ **Super Admin**:
- Views ALL franchise data (customers, bookings, invoices)
- Has own HQ franchise for personal operations
- Can manage all franchises

✅ **Franchise Admin**:
- Sees ONLY their franchise data
- Cannot access other franchises
- Full control within their franchise

✅ **Security**:
- RLS policies at database level
- Middleware filtering at API level
- Access validation at operation level
- Zero data leaks between franchises

---

## 📞 Next Steps

1. **Run HQ franchise SQL** (Step 1 above)
2. **Apply middleware to your API routes** (See EXAMPLE file)
3. **Test with different user roles**
4. **Update UI to show franchise context**

---

**Ready to implement!** Start with Step 1! 🎉
