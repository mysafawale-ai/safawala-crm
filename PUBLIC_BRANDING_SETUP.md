# 🎨 PUBLIC BRANDING SYSTEM - SETUP GUIDE

## 📋 **Overview**

This system allows you to customize the login page branding **without requiring authentication**. Perfect for white-labeling your CRM!

---

## 📁 **File Structure**

```
/public/
  ├── branding.json       ← Configuration file
  └── logo.png           ← Your company logo
```

---

## 🔧 **Configuration File: `/public/branding.json`**

### **Current Structure:**
```json
{
  "company_name": "Safawala.com",
  "tagline": "Premium Wedding Turban & Accessories",
  "subtitle": "Heritage meets Modern SaaS",
  "logo_url": "/logo.png",
  "primary_color": "#8B4513",
  "secondary_color": "#DAA520"
}
```

### **Fields:**

| Field | Description | Example | Required |
|-------|-------------|---------|----------|
| `company_name` | Company/brand name | "Safawala.com" | Yes |
| `tagline` | Main tagline | "Premium Wedding..." | Yes |
| `subtitle` | Subtitle text | "Heritage meets..." | Yes |
| `logo_url` | Path to logo file | "/logo.png" | Yes |
| `primary_color` | Primary brand color | "#8B4513" | Optional |
| `secondary_color` | Secondary color | "#DAA520" | Optional |

---

## 🎨 **How to Upload Your Logo**

### **Step 1: Prepare Your Logo**

**Requirements:**
```
✅ Format: PNG, JPG, SVG (PNG recommended)
✅ Size: Square aspect ratio (1:1)
✅ Recommended: 512x512px or larger
✅ Background: Transparent PNG works best
✅ File size: Under 1MB (smaller = faster load)
```

**Example Logo Specs:**
```
- Format: PNG with transparency
- Dimensions: 512x512px
- File size: 50-200KB
- Color mode: RGB
- Resolution: 72 DPI (web standard)
```

---

### **Step 2: Upload Logo to Public Folder**

**Method 1: Direct File Upload**
```bash
# Navigate to your project
cd /Applications/safawala-crm

# Copy your logo to public folder
cp /path/to/your/logo.png public/logo.png
```

**Method 2: Via VS Code**
```
1. Open VS Code
2. Navigate to /public folder
3. Drag & drop your logo.png file
4. Confirm replacement if prompted
```

**Method 3: Via Terminal**
```bash
# If your logo has a different name, rename it:
mv public/your-logo.png public/logo.png
```

---

### **Step 3: Update branding.json (if needed)**

**If your logo has a different name:**
```json
{
  "logo_url": "/my-custom-logo.png"
}
```

**If using external URL:**
```json
{
  "logo_url": "https://yourdomain.com/logo.png"
}
```

**If using subdirectory:**
```json
{
  "logo_url": "/images/company-logo.png"
}
```

---

### **Step 4: Test Your Logo**

```bash
# Start dev server (if not running)
pnpm dev

# Open browser to:
http://localhost:3001/
# or
http://localhost:3001/auth/login
```

**Expected Result:**
✅ Your logo appears in the gradient box  
✅ No authentication required  
✅ Logo loads immediately  

---

## 🎨 **Customization Options**

### **Option 1: Change Company Name**

**Edit `branding.json`:**
```json
{
  "company_name": "Your Company Name"
}
```

**Result:**
```
Before: Safawala.com
After:  Your Company Name
```

---

### **Option 2: Change Tagline**

**Edit `branding.json`:**
```json
{
  "tagline": "Your Custom Tagline Here"
}
```

**Result:**
```
Before: Premium Wedding Turban & Accessories
After:  Your Custom Tagline Here
```

---

### **Option 3: Change Subtitle**

**Edit `branding.json`:**
```json
{
  "subtitle": "Your Subtitle or Slogan"
}
```

**Result:**
```
Before: Heritage meets Modern SaaS
After:  Your Subtitle or Slogan
```

---

### **Option 4: Change Brand Colors** (Future Feature)

**Edit `branding.json`:**
```json
{
  "primary_color": "#FF5733",
  "secondary_color": "#3498DB"
}
```

*Note: Color customization will be implemented in future updates.*

---

## 📊 **How It Works**

### **Technical Flow:**

```
1. User visits login page (/ or /auth/login)
   ↓
2. Page loads and shows loading spinner
   ↓
3. Fetches /branding.json from public folder
   ↓
4. Reads logo_url from JSON
   ↓
5. Displays logo in gradient box
   ↓
6. If error: Shows default Crown icon
```

### **Code Implementation:**

```typescript
// Fetch public branding configuration
const response = await fetch('/branding.json')
const branding = await response.json()

if (branding.logo_url) {
  setLogoUrl(branding.logo_url)
}
```

### **Benefits:**

✅ **No Authentication Needed** - Public file, no login required  
✅ **Instant Updates** - Just replace file, no code changes  
✅ **Fast Loading** - Served from public folder (CDN-ready)  
✅ **White-Label Friendly** - Easy to customize per deployment  
✅ **Version Control Safe** - Can gitignore if needed  

---

## 🎯 **Common Use Cases**

### **Use Case 1: Single Brand**
```
Setup: One logo for entire CRM
File: public/logo.png
Config: logo_url: "/logo.png"
```

### **Use Case 2: Multiple Brands (Manual)**
```
Setup: Replace logo.png for each deployment
File: public/logo.png (different per environment)
Config: Same logo_url, different files
```

### **Use Case 3: External Logo Hosting**
```
Setup: Logo hosted on CDN
File: Not needed in public folder
Config: logo_url: "https://cdn.example.com/logo.png"
```

### **Use Case 4: Development vs Production**
```
Setup: Different logos per environment
Dev: public/logo-dev.png
Prod: public/logo.png
Config: Update logo_url per environment
```

---

## 🔍 **Troubleshooting**

### **Issue 1: Logo Not Showing**

**Possible Causes:**
```
❌ File name mismatch
   Solution: Ensure logo.png matches branding.json

❌ File not in public folder
   Solution: Move logo to /public/logo.png

❌ Wrong file path
   Solution: Use "/logo.png" not "logo.png"

❌ Cache issue
   Solution: Hard refresh (Ctrl+Shift+R)
```

---

### **Issue 2: Logo Appears Distorted**

**Possible Causes:**
```
❌ Non-square image
   Solution: Resize to 1:1 aspect ratio

❌ Too small resolution
   Solution: Use at least 512x512px

❌ Wrong image format
   Solution: Convert to PNG with transparency
```

---

### **Issue 3: Logo Too Large/Small**

**Current Display:**
```
Fixed size: 48x48px (h-12 w-12)
Object-fit: contain (maintains aspect ratio)
```

**To Change Size (Code Edit Required):**
```tsx
// In login pages, change:
className="h-12 w-12"  // Current
className="h-16 w-16"  // Larger
className="h-8 w-8"    // Smaller
```

---

### **Issue 4: JSON Parse Error**

**Possible Causes:**
```
❌ Invalid JSON syntax
   Solution: Validate at jsonlint.com

❌ Missing comma or quote
   Solution: Check all commas and quotes

❌ Extra trailing comma
   Solution: Remove last comma in object
```

**Valid JSON:**
```json
{
  "company_name": "Test",
  "logo_url": "/logo.png"
}
```

**Invalid JSON:**
```json
{
  "company_name": "Test",
  "logo_url": "/logo.png",  ← Extra comma!
}
```

---

## 📝 **Quick Setup Checklist**

```
□ Create /public/branding.json file
□ Configure company_name, tagline, subtitle
□ Set logo_url path
□ Upload logo to /public/ folder
□ Match logo filename with logo_url
□ Test on login page
□ Verify logo displays correctly
□ Check on mobile/tablet views
□ Test with different browsers
□ Deploy to production
```

---

## 🚀 **Deployment Notes**

### **Production Deployment:**

1. **Vercel/Netlify:**
   ```
   ✅ public/ folder automatically deployed
   ✅ Files served from CDN
   ✅ Fast global delivery
   ```

2. **Custom Server:**
   ```bash
   # Ensure public folder is included in build
   pnpm build
   
   # Verify files exist in build output
   ls -la .next/static/
   ```

3. **Environment Variables:**
   ```bash
   # Optional: Override logo via env var
   NEXT_PUBLIC_LOGO_URL=https://cdn.example.com/logo.png
   ```

---

## 🎨 **Example Configurations**

### **Example 1: Tech Company**
```json
{
  "company_name": "TechCorp Solutions",
  "tagline": "Innovation in Every Line of Code",
  "subtitle": "Powering the Future of Business",
  "logo_url": "/logo.png",
  "primary_color": "#007BFF",
  "secondary_color": "#6C757D"
}
```

### **Example 2: Restaurant Chain**
```json
{
  "company_name": "Delicious Eats",
  "tagline": "Farm to Table Excellence",
  "subtitle": "Fresh. Local. Sustainable.",
  "logo_url": "/restaurant-logo.png",
  "primary_color": "#28A745",
  "secondary_color": "#FFC107"
}
```

### **Example 3: Fashion Brand**
```json
{
  "company_name": "Elegance Boutique",
  "tagline": "Timeless Style, Modern Grace",
  "subtitle": "Redefining Fashion",
  "logo_url": "https://cdn.elegance.com/logo.png",
  "primary_color": "#E91E63",
  "secondary_color": "#9C27B0"
}
```

---

## 📊 **File Size Optimization**

### **Logo Optimization Tips:**

```bash
# Using ImageMagick
convert logo.png -resize 512x512 -quality 85 logo-optimized.png

# Using online tools
- TinyPNG.com (best compression)
- Squoosh.app (Google's tool)
- ImageOptim (Mac app)

# Expected Results:
Original: 2MB
Optimized: 50-200KB (10x smaller!)
```

---

## 🎉 **Complete Example**

### **Full Setup:**

**1. Create branding.json:**
```json
{
  "company_name": "Safawala.com",
  "tagline": "Premium Wedding Turban & Accessories",
  "subtitle": "Heritage meets Modern SaaS",
  "logo_url": "/logo.png"
}
```

**2. Upload logo.png:**
```
File: /public/logo.png
Size: 512x512px
Format: PNG with transparency
Size: 150KB
```

**3. Test:**
```
Visit: http://localhost:3001/
Result: ✅ Logo shows in gradient box
```

**4. Deploy:**
```bash
git add public/branding.json public/logo.png
git commit -m "Add custom branding"
git push
```

---

## 🔐 **Security Notes**

✅ **Safe for Public Access:**
- Files in /public are meant to be public
- No sensitive data should be in branding.json
- Logo is publicly accessible (like any website logo)

⚠️ **What NOT to Put:**
- API keys
- Passwords
- Database credentials
- Private franchise data

---

## 📞 **Support**

**Need Help?**
1. Check this guide first
2. Verify file paths and names
3. Test with default logo first
4. Check browser console for errors

---

**🎨 Your login page is now fully customizable without any authentication!**

**Created:** October 2025  
**Status:** ✅ Complete & Production Ready  
**Files:** branding.json, logo.png  
**Location:** /public folder
