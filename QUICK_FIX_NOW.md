# ⚡ QUICK FIX - Run This in Supabase Now!

## 🔴 Error: "Operation Failed - Server error while save company information"

## ✅ Solution: Run This SQL

**Open Supabase Dashboard → SQL Editor → Paste this:**

```sql
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
```

**Click:** Run

**Done!** ✅

---

## Test Again:
1. Go to Settings > Company
2. Fill pincode: `390011` (Vadodara - from your screenshot)
3. Click Save
4. Should work now! 🎉

---

**What was wrong?** Database didn't have the new columns we added in the code.

**Time to fix:** 10 seconds ⚡
