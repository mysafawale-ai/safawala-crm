# 📦 Inventory Import/Export Feature - Complete Guide

## Overview

Comprehensive inventory backup and restore system with **full product data and images** support. Export all products from one franchise and import them to another with complete data integrity.

**Status**: ✅ **LIVE** (Commit: `4d15f1c`)

---

## 🎯 What Can Be Imported/Exported

### ✅ Product Data (Fully Supported)
- **Core Details**
  - Product name, code, description
  - Brand, size, color, material
  - Category, subcategory
  
- **Pricing**
  - Sale price (₹)
  - Rental price (₹)
  - Cost price (₹)
  - Security deposit (₹)
  
- **Stock Information**
  - Total stock quantity
  - Available stock
  - Booked quantity
  - Damaged quantity
  - In-laundry quantity
  - Reorder level

- **Metadata**
  - Product images (base64 encoded, auto-uploaded)
  - Barcode (if existing)
  - QR code
  - Active/inactive status
  - Usage count
  - Damage count
  - Storage location
  - Creation/update timestamps

- **Categories**
  - All category associations
  - Subcategory relationships

---

## 🚀 Usage

### Export Products

#### From UI
1. Go to **Inventory** page
2. Click **Import/Export** button
3. Click **Download Inventory**
4. JSON file downloads with all products + images

#### From API
```bash
curl -X GET https://your-domain.com/api/inventory/export \
  -H "Authorization: Bearer {session_token}"
```

**Response:**
```json
{
  "version": "1.0",
  "exportDate": "2025-11-09T10:30:00Z",
  "franchiseId": "abc-123-def",
  "productCount": 25,
  "products": [
    {
      "id": "product-id",
      "product_code": "PROD-001",
      "name": "Wedding Turban",
      "price": 5000,
      "rental_price": 800,
      "cost_price": 2000,
      "security_deposit": 500,
      "stock_total": 10,
      "stock_available": 8,
      "category": "turban",
      "image_url": "https://...",
      "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      ...
    }
  ],
  "categories": ["turban", "sehra", "necklace", ...]
}
```

---

### Import Products

#### From UI
1. Go to **Inventory** page
2. Click **Import/Export** button
3. **Configure Options:**
   - ✅ **Overwrite existing**: Update products with duplicate codes
   - ✅ **Reset stock to 0**: Don't restore exported quantities
   - ✅ **Import images**: Upload product photos
   - ✅ **Skip duplicates**: Skip rather than error on duplicates

4. Click **Select File to Import**
5. Choose previously exported `.json` file
6. View import results with success/failure breakdown

#### From API
```bash
curl -X POST https://your-domain.com/api/inventory/import \
  -H "Content-Type: application/json" \
  -d '{
    "importData": {...},
    "targetFranchiseId": "optional-franchise-uuid",
    "options": {
      "overwriteExisting": false,
      "resetStock": true,
      "importImages": true,
      "skipDuplicates": false
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "summary": {
    "total": 25,
    "successful": 24,
    "failed": 1,
    "imagesUploaded": 24
  },
  "successfulImports": [
    {
      "code": "PROD-001",
      "action": "created",
      "id": "new-product-id"
    },
    {
      "code": "PROD-002",
      "action": "updated"
    }
  ],
  "failedImports": [
    {
      "code": "PROD-003",
      "reason": "Duplicate product code (use overwriteExisting option)"
    }
  ]
}
```

---

## 🔧 Technical Details

### Export Endpoint
**URL**: `GET /api/inventory/export`
**Auth**: Required (minRole: 'readonly')
**Response**: JSON with base64 images
**File Format**: `inventory-export-YYYY-MM-DD.json`

**Workflow:**
1. Fetch all products for current franchise
2. For each product with image_url:
   - Fetch image from Supabase Storage
   - Convert to base64
   - Embed in JSON
3. Return complete dataset

### Import Endpoint
**URL**: `POST /api/inventory/import`
**Auth**: Required (minRole: 'franchise_admin')
**Body**: Complete export JSON + options
**Response**: Import summary with success/failure details

**Workflow:**
1. Validate import data format
2. For each product:
   - Check for duplicates
   - If overwrite enabled: update existing
   - If new: create with new UUID
   - If image data: upload to Supabase Storage
   - Save product to database
3. Return detailed summary

### Image Handling
- **Format**: Base64-encoded JPEG
- **Storage**: Supabase Storage (`product-images` bucket)
- **Naming**: `{timestamp}-{product_code}.jpg`
- **URL**: Public URLs generated automatically
- **Fallback**: If image upload fails, product imports anyway

---

## 🔐 Security & Isolation

### Franchise Isolation
- ✅ Export: Only your franchise's products
- ✅ Import: Only to your franchise (super_admin can override)
- ✅ Non-admins: Cannot import to other franchises

### Authentication
- ✅ Export requires: `readonly` role or higher
- ✅ Import requires: `franchise_admin` role or higher
- ✅ Super admins: Can import to any franchise

### Data Integrity
- ✅ Product codes validated
- ✅ Pricing preserved accurately
- ✅ Stock levels integrity checked
- ✅ UUIDs regenerated (no ID conflicts)
- ✅ Timestamps updated appropriately

---

## 📊 Import Options Explained

### Option 1: Overwrite Existing (Default: OFF)
```
OFF: Skip products with duplicate codes
ON:  Update existing products
```
Use **ON** when:
- Restoring from backup
- Syncing inventory across franchises
- Updating product details in bulk

Use **OFF** when:
- Adding new products
- Testing import
- Merging from external sources

### Option 2: Reset Stock (Default: ON)
```
ON:  All products import with stock_available = 0
OFF: Restore exported stock quantities
```
Use **ON** when:
- Setting up new franchise
- You'll recount inventory manually
- Avoiding data discrepancies

Use **OFF** when:
- Full backup/restore
- Migrating franchises
- Keeping exact quantities

### Option 3: Import Images (Default: ON)
```
ON:  Upload product photos to Supabase Storage
OFF: Skip images, use URLs from original file
```
Use **ON** when:
- First-time import
- Images need storage in target franchise
- Fresh deployment

Use **OFF** when:
- Avoiding image duplication
- Keeping original URLs
- Testing/fast import

### Option 4: Skip Duplicates (Default: OFF)
```
OFF: Error on duplicate codes (unless overwriteExisting=ON)
ON:  Skip products with duplicate codes
```
Use **ON** when:
- Selective import
- Handling partial imports
- Merging multiple exports

Use **OFF** when:
- Need to know about all conflicts
- Requiring manual resolution

---

## 🎯 Use Cases

### 1. **Backup & Restore**
Export regularly, restore if data lost:
```
1. Export → Save to cloud storage
2. If disaster: Import → Full recovery
```

### 2. **Franchise Setup**
Copy products from main to new franchise:
```
1. Export from main franchise
2. Import to new franchise
3. Reset stock as needed
```

### 3. **Multi-Franchise Sync**
Keep inventory consistent:
```
1. Export from master franchise
2. Import to all others with overwrite
```

### 4. **Bulk Updates**
Update pricing/details for many products:
```
1. Export current inventory
2. Edit exported JSON locally
3. Import with overwrite=ON
```

### 5. **Inventory Migration**
Move from old system to Safawala:
```
1. Export from old system as JSON
2. Transform to import format
3. Import with reset stock
```

---

## 📋 File Format Reference

### Export JSON Structure
```json
{
  "version": "1.0",
  "exportDate": "2025-11-09T10:30:00Z",
  "franchiseId": "abc-123-def",
  "productCount": 2,
  "products": [
    {
      "id": "uuid-1",
      "product_code": "PROD-001",
      "name": "Wedding Turban",
      "description": "Traditional wedding turban",
      "brand": "Safawala",
      "category": "turban",
      "price": 5000,
      "rental_price": 800,
      "cost_price": 2000,
      "security_deposit": 500,
      "stock_total": 10,
      "stock_available": 8,
      "stock_booked": 2,
      "stock_damaged": 0,
      "stock_in_laundry": 0,
      "reorder_level": 3,
      "image_url": "https://...",
      "imageBase64": "base64_encoded_image_data",
      "barcode": "P00000000001",
      "is_active": true,
      "created_at": "2025-10-15T08:00:00Z",
      "updated_at": "2025-11-09T10:00:00Z"
    }
  ],
  "categories": ["turban", "sehra", "necklace"]
}
```

---

## ⚠️ Limitations & Notes

- **Image Size**: Large images may slow export (embedded in JSON)
- **Product Codes**: Must be unique per franchise
- **Stock History**: Not exported (only current stock)
- **Bookings**: Not included in export
- **Max Products**: No hard limit, but large exports (500+) may take time

---

## 🧪 Testing

### Test Export
```bash
# Export should return 200 with JSON
curl -X GET /api/inventory/export -H "Authorization: Bearer {token}"

# Verify JSON structure
# Check for products array
# Check for categories array
# Verify imageBase64 fields populated
```

### Test Import (New Products)
```bash
# Import with skip duplicates, reset stock
# Verify all products created
# Verify images uploaded
# Check stock levels reset to 0
```

### Test Import (Overwrite)
```bash
# Edit exported file
# Change prices
# Import with overwriteExisting=ON
# Verify prices updated
```

---

## 🐛 Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Export returns 401 | Not authenticated | Login first, check token |
| Export returns empty | No products in franchise | Add products first |
| Import fails on duplicate | Code exists + overwrite OFF | Use overwriteExisting=ON |
| Images don't upload | Storage bucket issue | Check Supabase Storage permissions |
| File too large | Many products + images | Try smaller exports |
| Import hangs | Large dataset | Increase request timeout |

---

## 📞 Support

- **Bugs**: Check console for error messages
- **Questions**: Review this guide or contact support
- **Feature requests**: Open GitHub issue

---

**Last Updated**: November 9, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready
