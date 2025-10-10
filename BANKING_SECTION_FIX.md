# Banking Section Fix - Complete

## Issue
Banking section was showing errors because:
1. Component was calling wrong API endpoint (`/api/banks` instead of `/api/settings/banking`)
2. Field names didn't match between UI and API/database

## Changes Made

### 1. API Endpoint Updates
- ✅ Changed `GET /api/banks` → `GET /api/settings/banking`
- ✅ Changed `POST /api/banks` → `POST /api/settings/banking`
- ✅ Changed `PUT /api/banks/:id` → `PUT /api/settings/banking/:id`
- ✅ Changed `DELETE /api/banks/:id` → `DELETE /api/settings/banking/:id`
- ✅ Changed query parameter `org_id` → `franchise_id`

### 2. Interface Updates (BankAccount & BankFormData)
- ✅ `org_id` → `franchise_id`
- ✅ `account_holder` → `account_holder_name`
- ✅ `show_on_invoices` → `show_on_invoice`
- ✅ Removed `show_on_quotes` (field doesn't exist in database)
- ✅ Added `account_type` field

### 3. UI Updates
- ✅ Fixed all display references in bank cards
- ✅ Fixed form input field names
- ✅ Removed "Show on Quotes" switch from form
- ✅ Removed "On Quotes" badge from bank cards
- ✅ Removed "Show on Quotes" badge from view dialog
- ✅ Fixed validation logic
- ✅ Fixed form reset and edit modal logic

### 4. Files Modified
- `/components/settings/banking-section-new.tsx` - Complete field name updates and UI cleanup

## Database Schema (banking_details table)
```sql
- id (uuid)
- franchise_id (uuid)
- bank_name (text)
- account_holder_name (text)
- account_number (text)
- ifsc_code (text)
- branch_name (text)
- account_type (text)
- upi_id (text)
- qr_file_path (text)
- is_primary (boolean)
- show_on_invoice (boolean)  -- Note: singular, not plural
- created_at (timestamp)
- updated_at (timestamp)
```

## Testing
1. ✅ Component compiles without errors
2. ✅ API endpoints updated
3. ✅ Field names match database schema
4. ⏳ Ready for user testing

## Next Steps
1. Test adding a new bank account
2. Test editing existing bank account
3. Test deleting bank account
4. Verify QR code upload works
5. Verify primary bank toggle works
6. Verify "Show on Invoice" toggle works
