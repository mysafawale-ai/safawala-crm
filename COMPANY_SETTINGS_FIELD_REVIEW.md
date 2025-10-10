# 📋 Company Settings Tab - Field Comparison

## Current UI Fields (Company Tab)

Based on your screenshot and code, the Company tab currently shows:

### ✅ Fields Present in UI:
1. **Company Name** * (Required)
2. **Email Address**
3. **Phone Number**
4. **GST Number**
5. **Address** (Textarea)
6. **City**
7. **State**
8. **Website**

---

## Supabase `company_settings` Table Schema

According to `/scripts/create-settings-schema.sql`, the database has:

### ✅ Fields in Database:
| Field | Type | UI Status | Notes |
|-------|------|-----------|-------|
| `id` | UUID | N/A | Primary key (auto) |
| `franchise_id` | UUID | N/A | Foreign key (auto) |
| `company_name` | VARCHAR(255) | ✅ Present | Required field |
| `email` | VARCHAR(255) | ✅ Present | |
| `phone` | VARCHAR(20) | ✅ Present | |
| `gst_number` | VARCHAR(20) | ✅ Present | |
| `address` | TEXT | ✅ Present | |
| `city` | VARCHAR(100) | ✅ Present | |
| `state` | VARCHAR(100) | ✅ Present | |
| `website` | VARCHAR(255) | ✅ Present | |
| **`logo_url`** | TEXT | ❌ **MISSING** | Logo image URL |
| **`signature_url`** | TEXT | ❌ **MISSING** | Signature image URL |
| `created_at` | TIMESTAMP | N/A | Auto timestamp |
| `updated_at` | TIMESTAMP | N/A | Auto timestamp |

---

## 🔴 Missing Fields in UI

### 1. **Logo URL** (`logo_url`)
- **Type:** TEXT (URL to uploaded logo image)
- **Purpose:** Company logo for invoices, quotes, and branding
- **Recommended UI:** File upload component with image preview

### 2. **Signature URL** (`signature_url`)
- **Type:** TEXT (URL to uploaded signature image)
- **Purpose:** Authorized signature for invoices and quotes
- **Recommended UI:** File upload component with image preview

---

## 📊 Additional Fields from Other SQL Files

Checking `/scripts/add-missing-company-settings-columns.sql`:

### ⚠️ Potentially Missing:
| Field | Type | Purpose | UI Status |
|-------|------|---------|-----------|
| `timezone` | VARCHAR(100) | Timezone for reports/timestamps | ❌ Not in UI |
| `currency` | VARCHAR(3) | Default currency (INR, USD, etc.) | ❌ Not in UI |
| `country` | VARCHAR(100) | Country name | ❌ Not in UI |
| `pincode` | VARCHAR(10) | Postal/ZIP code | ❌ Not in UI |
| `business_type` | VARCHAR(50) | Type of business | ❌ Not in UI |
| `pan_number` | VARCHAR(20) | PAN for Indian businesses | ❌ Not in UI |

---

## ✅ Recommendation: Add Missing Fields

### Priority 1: Essential for Invoices
```tsx
// Add these to company-info-section.tsx

1. Logo Upload (logo_url)
   - File input with image preview
   - Supported formats: PNG, JPG, SVG
   - Max size: 2MB
   - Displays on invoices/quotes

2. Signature Upload (signature_url)
   - File input with image preview
   - Supported formats: PNG, JPG
   - Max size: 1MB
   - Appears on invoice footer
```

### Priority 2: Business Details
```tsx
3. Pincode/ZIP Code
4. Country (default: India)
5. PAN Number (for Indian GST compliance)
6. Timezone (for scheduling)
7. Currency (default: INR)
```

---

## 🎨 UI Mockup for Missing Fields

### Logo & Signature Section
```tsx
<div className="space-y-6 border-t pt-6">
  <h3 className="text-lg font-semibold">Branding Assets</h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Logo Upload */}
    <div className="space-y-2">
      <Label>Company Logo</Label>
      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        {logoPreview ? (
          <img src={logoPreview} className="max-h-32 mx-auto" />
        ) : (
          <div className="text-gray-400">
            <Upload className="h-8 w-8 mx-auto mb-2" />
            <p>Click to upload logo</p>
          </div>
        )}
        <input type="file" accept="image/*" />
      </div>
    </div>
    
    {/* Signature Upload */}
    <div className="space-y-2">
      <Label>Authorized Signature</Label>
      <div className="border-2 border-dashed rounded-lg p-4 text-center">
        {signaturePreview ? (
          <img src={signaturePreview} className="max-h-32 mx-auto" />
        ) : (
          <div className="text-gray-400">
            <Upload className="h-8 w-8 mx-auto mb-2" />
            <p>Click to upload signature</p>
          </div>
        )}
        <input type="file" accept="image/*" />
      </div>
    </div>
  </div>
</div>
```

### Additional Details Section
```tsx
<div className="space-y-6 border-t pt-6">
  <h3 className="text-lg font-semibold">Additional Details</h3>
  
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="space-y-2">
      <Label>Pincode</Label>
      <Input placeholder="400001" />
    </div>
    
    <div className="space-y-2">
      <Label>Country</Label>
      <Input placeholder="India" />
    </div>
    
    <div className="space-y-2">
      <Label>Currency</Label>
      <Select defaultValue="INR">
        <option value="INR">₹ INR</option>
        <option value="USD">$ USD</option>
      </Select>
    </div>
  </div>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label>PAN Number</Label>
      <Input placeholder="ABCDE1234F" />
    </div>
    
    <div className="space-y-2">
      <Label>Timezone</Label>
      <Select defaultValue="Asia/Kolkata">
        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
        <option value="Asia/Dubai">Asia/Dubai (GST)</option>
      </Select>
    </div>
  </div>
</div>
```

---

## 🔧 Implementation Steps

### Step 1: Update TypeScript Interface
```typescript
// company-info-section.tsx
interface CompanyInfoData {
  company_name: string
  email: string
  phone: string
  gst_number: string
  address: string
  city: string
  state: string
  website: string
  logo_url?: string        // ADD
  signature_url?: string   // ADD
  pincode?: string         // ADD
  country?: string         // ADD
  pan_number?: string      // ADD
  timezone?: string        // ADD
  currency?: string        // ADD
}
```

### Step 2: Add File Upload Handler
```typescript
const handleFileUpload = async (file: File, field: 'logo_url' | 'signature_url') => {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  })
  
  const { url } = await response.json()
  handleInputChange(field, url)
}
```

### Step 3: Create Upload API Route
```typescript
// app/api/upload/route.ts
// Use Supabase Storage to upload images
// Return public URL
```

---

## 📝 Summary

### Currently Have: ✅ 8/13 fields
1. Company Name ✅
2. Email ✅
3. Phone ✅
4. GST Number ✅
5. Address ✅
6. City ✅
7. State ✅
8. Website ✅

### Missing: ❌ 5 Essential Fields
9. **Logo URL** ❌ (Critical for branding)
10. **Signature URL** ❌ (Critical for invoices)
11. Pincode ❌
12. PAN Number ❌
13. Timezone/Currency ❌

---

## 🎯 Next Steps

1. **Priority 1:** Add Logo & Signature upload fields
2. **Priority 2:** Add Pincode, Country, PAN fields
3. **Priority 3:** Add Timezone & Currency dropdowns
4. **Optional:** Add more fields based on business needs

Would you like me to implement the missing fields now?
