# 📋 Customer Form Data Persistence - Manual Verification Guide

## Overview
This guide provides step-by-step instructions to manually verify that the customer form data is saved correctly and consistently across all operations.

---

## 🧪 Test Scenario 1: Valid Data Creation & Persistence

### Step 1: Fill Customer Form with Valid Data
**Test Data:**
```json
{
  "name": "John Doe Test Customer",
  "email": "john.doe.test@example.com", 
  "phone": "9876543210",
  "whatsapp": "9876543210",
  "address": "123 Test Street, Apartment 4B",
  "city": "Mumbai",
  "state": "Maharashtra", 
  "pincode": "400001"
}
```

### Step 2: Submit Form & Capture API Request/Response
**Expected API Call:**
- **Method**: POST
- **URL**: `/api/customers`
- **Headers**: `Content-Type: application/json`

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": "uuid-generated-id",
    "customer_code": "CUS-001234",
    "name": "John Doe Test Customer",
    "email": "john.doe.test@example.com",
    "phone": "9876543210",
    "whatsapp": "9876543210", 
    "address": "123 Test Street, Apartment 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "franchise_id": "franchise-uuid",
    "created_at": "2025-09-21T...",
    "updated_at": "2025-09-21T..."
  }
}
```

**✅ Verification Checklist:**
- [ ] Response status code is **201 Created**
- [ ] Response contains `"success": true`
- [ ] Response includes confirmation message
- [ ] All submitted data appears correctly in response
- [ ] Customer gets auto-generated ID and customer_code
- [ ] Timestamps (created_at, updated_at) are present
- [ ] franchise_id is properly assigned

### Step 3: Verify Data Persistence - Reload & Check UI
**Actions:**
1. Note the customer ID from the creation response
2. Refresh/reload the customers page
3. Navigate to customer list
4. Search for the created customer
5. Click to view customer details

**✅ Verification Checklist:**
- [ ] Customer appears in the customer list
- [ ] All form fields show the exact values that were submitted
- [ ] No data corruption or missing fields
- [ ] Customer code is displayed correctly
- [ ] Timestamps are shown properly

### Step 4: Database Verification (Supabase)
**Database Query:**
```sql
SELECT * FROM customers 
WHERE email = 'john.doe.test@example.com' 
ORDER BY created_at DESC 
LIMIT 1;
```

**✅ Verification Checklist:**
- [ ] Record exists in database with correct ID
- [ ] All field values match exactly what was submitted
- [ ] `created_at` timestamp is accurate (within last few minutes)
- [ ] `updated_at` equals `created_at` for new records
- [ ] `franchise_id` is properly assigned
- [ ] No NULL values in required fields

---

## 🔄 Test Scenario 2: Data Updates & Modifications

### Step 1: Edit Existing Customer
**Updated Test Data:**
```json
{
  "name": "John Doe UPDATED",
  "email": "john.doe.updated@example.com",
  "phone": "9876543211", 
  "address": "456 Updated Street, Floor 2",
  "city": "Pune",
  "state": "Maharashtra",
  "pincode": "411001"
}
```

### Step 2: Submit Update & Capture API Response
**Expected API Call:**
- **Method**: PUT
- **URL**: `/api/customers/{customer-id}`

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Customer updated successfully", 
  "data": {
    "id": "same-uuid-as-before",
    "name": "John Doe UPDATED",
    "email": "john.doe.updated@example.com",
    "phone": "9876543211",
    "address": "456 Updated Street, Floor 2", 
    "city": "Pune",
    "pincode": "411001",
    "created_at": "original-timestamp",
    "updated_at": "new-timestamp-after-original"
  }
}
```

**✅ Verification Checklist:**
- [ ] Response status code is **200 OK**
- [ ] Updated fields reflect new values
- [ ] `created_at` timestamp remains unchanged
- [ ] `updated_at` timestamp is newer than `created_at`
- [ ] Customer ID remains the same

### Step 3: Verify Update Persistence
**Database Query:**
```sql
SELECT * FROM customers 
WHERE id = 'customer-uuid-here';
```

**✅ Verification Checklist:**
- [ ] All updated fields are saved correctly
- [ ] Original creation timestamp preserved
- [ ] Updated timestamp reflects the modification time
- [ ] No data from the update is lost
- [ ] UI reflects all changes immediately

---

## ❌ Test Scenario 3: Invalid Data Validation

### Test Invalid Email Format
**Test Data:**
```json
{
  "name": "Test User",
  "email": "invalid-email-format",
  "phone": "9876543210",
  "pincode": "400001"
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Invalid email format",
  "field": "email"
}
```

### Test Missing Required Fields
**Test Data:**
```json
{
  "email": "test@example.com"
  // Missing name, phone, pincode
}
```

**Expected Error Response:**
```json
{
  "success": false,
  "error": "VALIDATION_ERROR", 
  "message": "Name is required and must be a non-empty string",
  "field": "name"
}
```

### Test Invalid Phone Number
**Test Data:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "phone": "123",  // Too short
  "pincode": "400001"
}
```

### Test Invalid Pincode
**Test Data:**
```json
{
  "name": "Test User", 
  "email": "test@example.com",
  "phone": "9876543210",
  "pincode": "12345"  // Only 5 digits instead of 6
}
```

**✅ Validation Verification Checklist:**
- [ ] All invalid submissions return **400 Bad Request**
- [ ] Error messages are clear and specific
- [ ] No incomplete/invalid data is saved to database
- [ ] UI shows appropriate error messages
- [ ] User can correct errors and resubmit

---

## 🛡️ Test Scenario 4: Security & XSS Protection

### Test XSS Attack Prevention
**Malicious Test Data:**
```json
{
  "name": "<script>alert('xss')</script>",
  "email": "test@example.com",
  "phone": "9876543210", 
  "address": "<img src=x onerror=alert('xss')>",
  "pincode": "400001"
}
```

**✅ Security Verification Checklist:**
- [ ] Malicious scripts are blocked (400 Bad Request)
- [ ] No XSS payloads are saved to database
- [ ] HTML tags are properly sanitized
- [ ] SQL injection attempts are prevented
- [ ] Error message doesn't reveal internal system details

---

## 🗑️ Test Scenario 5: Customer Deletion

### Step 1: Delete Customer
**API Call:**
- **Method**: DELETE
- **URL**: `/api/customers/{customer-id}`

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Customer \"John Doe UPDATED\" deleted successfully",
  "data": {
    "id": "customer-uuid",
    "name": "John Doe UPDATED"
  }
}
```

### Step 2: Verify Deletion
**Database Query:**
```sql
SELECT * FROM customers WHERE id = 'customer-uuid-here';
```

**✅ Deletion Verification Checklist:**
- [ ] Response status code is **200 OK**
- [ ] Customer no longer appears in UI lists
- [ ] Database record is removed (or marked as deleted)
- [ ] Attempting to GET deleted customer returns **404 Not Found**
- [ ] Related records are handled appropriately (cascade/prevent)

---

## 📊 Test Scenario 6: Audit Logging Verification

### Check Audit Logs Table
**Database Query:**
```sql
SELECT * FROM audit_logs 
WHERE table_name = 'customers' 
ORDER BY timestamp DESC 
LIMIT 10;
```

**✅ Audit Log Verification Checklist:**
- [ ] CREATE operation logged with complete new data
- [ ] UPDATE operation logged with old vs new values
- [ ] DELETE operation logged with final data state  
- [ ] READ operations logged (if configured)
- [ ] User information captured (IP, User Agent, etc.)
- [ ] Timestamps are accurate
- [ ] Sensitive data is properly redacted

---

## 🔍 Advanced Verification Steps

### 1. Concurrent Access Testing
- [ ] Multiple users editing same customer simultaneously
- [ ] Data conflicts handled gracefully
- [ ] Last-write-wins or proper conflict resolution

### 2. Performance Verification
- [ ] Form submission completes within 2-3 seconds
- [ ] Large customer lists load efficiently
- [ ] Search functionality responds quickly
- [ ] Database queries are optimized

### 3. Edge Cases
- [ ] Very long text inputs (stress test field limits)
- [ ] Special characters (Unicode, emojis, etc.)
- [ ] Network interruption during submission
- [ ] Browser refresh during form submission

### 4. Mobile/Responsive Testing
- [ ] Form works correctly on mobile devices
- [ ] Touch interactions function properly
- [ ] Data persistence consistent across devices

---

## 📋 Final Verification Checklist

### ✅ Core Functionality
- [ ] Customer creation works with valid data
- [ ] All form fields save correctly
- [ ] Data persists across page reloads
- [ ] Updates overwrite data correctly
- [ ] Deletions remove data properly

### ✅ Data Integrity  
- [ ] Database records match submitted data exactly
- [ ] Timestamps are accurate and consistent
- [ ] No data corruption or truncation
- [ ] Foreign keys (franchise_id) are valid

### ✅ Validation & Security
- [ ] Invalid data is rejected with clear error messages
- [ ] Required fields are enforced
- [ ] XSS attempts are blocked
- [ ] SQL injection is prevented

### ✅ API Responses
- [ ] Success responses include proper status codes (200/201)
- [ ] Error responses include helpful messages (400/404/500)
- [ ] Response data structure is consistent
- [ ] All required fields are included in responses

### ✅ Audit & Monitoring
- [ ] All operations are logged in audit table
- [ ] User context is captured accurately
- [ ] Error logs provide sufficient debugging information
- [ ] Performance metrics are within acceptable ranges

---

## 🎯 Success Criteria

**The customer form data persistence is considered VERIFIED when:**

1. **100% of valid submissions** save correctly to database
2. **100% of invalid submissions** are rejected with appropriate errors
3. **All CRUD operations** (Create, Read, Update, Delete) work flawlessly
4. **Data integrity** is maintained across all operations
5. **Security measures** effectively prevent malicious inputs
6. **Audit logs** capture complete operational history
7. **Performance** meets acceptable response time standards
8. **UI consistency** reflects backend data accurately

**If any verification step fails, the issue should be resolved before considering the system production-ready.**