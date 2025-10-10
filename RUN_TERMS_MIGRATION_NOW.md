# 🚀 RUN THIS SQL IN SUPABASE NOW

## ⚡ Quick Migration for Terms & Conditions

Copy and paste this in **Supabase SQL Editor**:

```sql
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
```

Click **"Run"**

---

## ✅ Expected Output

```
✓ Success. No rows returned
```

---

## 🎯 Then Test

1. Go to **Settings > Company**
2. Scroll to bottom
3. See **"Terms & Conditions"** textarea
4. Enter some text
5. Click **Save Company Information**
6. Reload page - should persist! ✅

---

## 📝 Example to Test With

```
1. Payment due within 30 days
2. Late fee: 2% per month  
3. Returns within 7 days
4. Contact: info@safawala.com
```

---

**That's it!** Takes 10 seconds. 🚀
