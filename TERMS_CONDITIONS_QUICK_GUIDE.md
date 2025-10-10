# ✅ Terms & Conditions - Quick Summary

## 🎉 Added to Company Settings!

A new **Terms & Conditions** field has been added to the Company Settings tab.

---

## 📍 Where to Find It

**Settings > Company** tab → Scroll to bottom (above Save button)

---

## 🎨 What It Looks Like

```
┌─────────────────────────────────────────┐
│ GST Number | PAN Number                 │
├─────────────────────────────────────────┤
│                                         │
│ Terms & Conditions                      │
│ ┌─────────────────────────────────────┐ │
│ │ Enter default terms and conditions  │ │
│ │ for invoices and quotes...          │ │
│ │                                     │ │
│ │ (6 rows of text)                    │ │
│ │                                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ These terms will be automatically       │
│ included in all invoices and quotes     │
│                                         │
│            [Save Company Information]   │
└─────────────────────────────────────────┘
```

---

## ⚡ Quick Setup

### Step 1: Run This SQL in Supabase

```sql
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
```

### Step 2: Enter Your Terms
1. Go to Settings > Company
2. Scroll to bottom
3. Enter your default terms
4. Click Save

### Step 3: Done! ✅
Your terms will be saved and ready to use in invoices/quotes.

---

## 💡 Example Terms

```
1. Payment due within 30 days of invoice date
2. Late payment fee: 2% per month
3. Returns accepted within 7 days
4. All products have 1-year warranty
5. Contact: info@safawala.com
```

---

## 📊 What Changed

| File | Change |
|------|--------|
| `company-info-section.tsx` | Added textarea field |
| `app/api/settings/company/route.ts` | Added API handling |
| `scripts/add-terms-conditions-column.sql` | Migration script |

---

## 🎯 Purpose

These terms will automatically appear on:
- 📄 All invoices
- 📋 All quotes  
- 📝 All estimates

Enter once, use everywhere! ⚡

---

## ⚠️ Important

**Run the SQL migration first** before using the field!

Without it, you'll get a database error when saving.

---

**Status:** ✅ Ready to use after migration!
