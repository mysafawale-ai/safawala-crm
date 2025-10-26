# Product Images Storage Setup Guide

## Overview
This guide explains how to set up Supabase Storage for custom product images uploaded during the package booking flow.

## Features
- **Public bucket** for product images
- **5MB file size limit** per image
- **Supported formats**: JPEG, JPG, PNG, WebP, GIF
- **Automatic upload** from camera capture or file selection
- **Base64 to Storage conversion** - converts captured images to optimized storage URLs
- **RLS policies** for secure authenticated uploads

## Setup Instructions

### 1. Run SQL Script
Open your Supabase Dashboard → SQL Editor and run:
```sql
/Applications/safawala-crm/SETUP_PRODUCT_IMAGES_STORAGE.sql
```

### 2. Verify Bucket Creation
Go to **Storage** in Supabase Dashboard and verify:
- Bucket name: `product-images`
- Public: ✅ Yes
- File size limit: 5 MB
- Allowed MIME types: image/jpeg, image/jpg, image/png, image/webp, image/gif

### 3. Test Upload
1. Go to Book Package page
2. Click "Add Custom Product"
3. Take a photo or choose an image
4. Fill in product details
5. Click "Create Product"
6. Verify image appears in Storage → product-images bucket

## How It Works

### Image Upload Flow
1. **User captures/selects image** → Converted to base64 data URL
2. **On product creation** → Base64 detected and processed:
   - Convert base64 to Blob
   - Generate unique filename: `product-{timestamp}-{random}.{ext}`
   - Upload to `product-images` bucket
   - Get public URL
   - Save URL to `products.image_url`

### Filename Pattern
```
product-1729934567890-x7k2m9.jpg
└─────┘ └──────────────┘ └────┘ └─┘
prefix   timestamp      random  ext
```

### Storage URL Structure
```
https://[project-ref].supabase.co/storage/v1/object/public/product-images/product-1729934567890-x7k2m9.jpg
```

## RLS Policies

| Policy | Action | Who | Purpose |
|--------|--------|-----|---------|
| Public Access | SELECT | Everyone | View product images publicly |
| Upload | INSERT | Authenticated | Upload new images |
| Update | UPDATE | Authenticated | Modify existing images |
| Delete | DELETE | Authenticated | Remove images |

## Error Handling

### Upload Failures
- If storage upload fails, product is created **without image**
- User sees toast: "Image upload failed, creating product without image"
- Product creation continues normally

### Permission Errors
- Camera access denied → Toast error
- Storage policy violation → Product created without image

## Benefits Over Base64

| Aspect | Base64 (Old) | Storage (New) |
|--------|--------------|---------------|
| Database size | ❌ Large (~33% overhead) | ✅ Small (URL only) |
| Performance | ❌ Slow queries | ✅ Fast queries |
| CDN caching | ❌ No | ✅ Yes |
| Image optimization | ❌ No | ✅ Possible |
| Bandwidth | ❌ High | ✅ Low |

## Code Changes

### Before
```typescript
image_url: customProductData.image_url // Direct base64
```

### After
```typescript
// Convert base64 → Upload to storage → Get public URL
const { data } = await supabase.storage
  .from('product-images')
  .upload(fileName, blob)

const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(fileName)

image_url: publicUrl
```

## Maintenance

### Cleanup Unused Images
```sql
-- Find products with deleted images
SELECT id, name, image_url
FROM products
WHERE image_url LIKE '%product-images%'
AND NOT EXISTS (
  SELECT 1 FROM storage.objects
  WHERE bucket_id = 'product-images'
  AND name = substring(products.image_url from '.*/(.+)$')
);
```

### Storage Usage
```sql
-- Check bucket size
SELECT 
  bucket_id,
  COUNT(*) as file_count,
  pg_size_pretty(SUM(metadata->>'size')::bigint) as total_size
FROM storage.objects
WHERE bucket_id = 'product-images'
GROUP BY bucket_id;
```

## Support
- File format issues → Check `allowed_mime_types` in bucket settings
- Upload failures → Check browser console for detailed errors
- RLS errors → Verify user is authenticated
