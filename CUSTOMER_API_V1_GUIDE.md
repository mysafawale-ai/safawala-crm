# Customer API v1 - Unified Management System

## Overview

The new **Customer API v1** (`/api/v1/customers`) provides a unified, simplified approach to managing customer records **without foreign key constraints**. This API handles all CRUD operations with automatic cascade deletion of related records (returns, orders, bookings).

## Key Features

✅ **No Foreign Keys** - Direct cascade delete logic in application layer
✅ **Franchise Isolation** - Automatic filtering by franchise  
✅ **Soft Delete by Default** - Safe deletion with `is_active` flag
✅ **Hard Delete Option** - Cascade deletes all related records when requested
✅ **Duplicate Prevention** - Phone number validation per franchise
✅ **Search Support** - Search by name, phone, or email
✅ **Active-only Filter** - Returns only active customers by default

## API Endpoints

### 1. GET /api/v1/customers - List Customers

Retrieve all customers for the current franchise.

**Query Parameters:**
- `search` (optional) - Search by name, phone, or email
- `includeInactive` (optional, default=false) - Include deactivated customers

**Request:**
```bash
curl -X GET "https://mysafawala.com/api/v1/customers?search=John&includeInactive=false"
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "whatsapp": "9876543210",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "pincode": "400001",
      "franchise_id": "f123",
      "is_active": true,
      "created_at": "2025-11-09T10:00:00Z",
      "updated_at": "2025-11-09T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

### 2. POST /api/v1/customers - Create Customer

Create a new customer record.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "whatsapp": "9876543210",
  "address": "123 Main St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "pincode": "400001"
}
```

**Validation:**
- `name` - Required, non-empty string
- `phone` - Required, minimum 10 digits
- `email`, `whatsapp`, `address`, `city`, `state`, `pincode` - Optional

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@example.com",
    "franchise_id": "f123",
    "is_active": true,
    "created_by": "user-id",
    "created_at": "2025-11-09T10:00:00Z"
  }
}
```

**Error (409 - Conflict):**
```json
{
  "error": "Customer with this phone number already exists"
}
```

---

### 3. PUT /api/v1/customers - Update Customer

Update an existing customer record.

**Request Body:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Jane Doe",
  "phone": "9876543211",
  "email": "jane@example.com",
  "whatsapp": "9876543211",
  "address": "456 Oak St",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001"
}
```

**Required Fields:**
- `id` - Customer ID (UUID)
- `name` - Non-empty string
- `phone` - Minimum 10 digits

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Jane Doe",
    "phone": "9876543211",
    "updated_by": "user-id",
    "updated_at": "2025-11-09T11:00:00Z"
  }
}
```

---

### 4. DELETE /api/v1/customers - Delete Customer

Delete a customer with two options: soft delete (default) or hard delete.

**Query Parameters:**
- `id` - Required, Customer UUID
- `hard` - Optional (default=false)
  - `false` - Soft delete: mark as inactive
  - `true` - Hard delete: cascade delete customer + all related records

**Soft Delete (Default - Safe):**
```bash
curl -X DELETE "https://mysafawala.com/api/v1/customers?id=550e8400-e29b-41d4-a716-446655440000"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Customer deactivated"
}
```

**Hard Delete (Cascade):**
```bash
curl -X DELETE "https://mysafawala.com/api/v1/customers?id=550e8400-e29b-41d4-a716-446655440000&hard=true"
```

**Response (200):**
```json
{
  "success": true,
  "message": "Customer and all related records deleted",
  "hard": true
}
```

**Cascade Behavior (Hard Delete):**
When hard deleting, the API automatically deletes:
1. All `returns` where `customer_id = {id}`
2. All `product_orders` where `customer_id = {id}`
3. All `package_bookings` where `customer_id = {id}`
4. Finally, the customer record itself

---

## Error Responses

### 400 - Bad Request
```json
{
  "error": "Name is required"
}
```

### 401 - Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 - Access Denied
```json
{
  "error": "Access denied"
}
```

### 404 - Not Found
```json
{
  "error": "Customer not found"
}
```

### 409 - Conflict
```json
{
  "error": "Customer with this phone number already exists"
}
```

### 500 - Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Migration Guide

### Remove Foreign Key Constraint

To remove the foreign key constraint from the database:

```sql
-- File: sql/REMOVE_CUSTOMER_FOREIGN_KEY.sql
ALTER TABLE returns
DROP CONSTRAINT IF EXISTS returns_customer_id_fkey;
```

Execute this SQL migration in Supabase SQL Editor.

### Update Frontend Components

Change references from:
```typescript
// Old API
POST /api/customers
PUT /api/customers
DELETE /api/delete (with entity parameter)

// New API
POST /api/v1/customers
PUT /api/v1/customers
DELETE /api/v1/customers?id={id}&hard={true|false}
```

---

## Usage Examples

### JavaScript/TypeScript

**Create Customer:**
```typescript
const response = await fetch('/api/v1/customers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'John Doe',
    phone: '9876543210',
    email: 'john@example.com',
    city: 'Mumbai'
  })
})
const { success, data } = await response.json()
```

**Delete Customer (Soft):**
```typescript
const response = await fetch('/api/v1/customers?id=customer-uuid', {
  method: 'DELETE'
})
const result = await response.json()
```

**Delete Customer (Hard - Cascade):**
```typescript
const response = await fetch('/api/v1/customers?id=customer-uuid&hard=true', {
  method: 'DELETE'
})
const result = await response.json()
// All returns, orders, bookings for this customer are also deleted
```

**Update Customer:**
```typescript
const response = await fetch('/api/v1/customers', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'customer-uuid',
    name: 'Jane Doe',
    phone: '9876543211'
  })
})
const { success, data } = await response.json()
```

**List Customers:**
```typescript
const response = await fetch('/api/v1/customers?search=John')
const { success, data, count } = await response.json()
```

---

## Features Comparison

| Feature | Old API | New API v1 |
|---------|---------|-----------|
| Create Customer | ✅ | ✅ |
| Update Customer | ✅ | ✅ |
| Delete Customer | ✅ (Foreign Key Error) | ✅ (Always Works) |
| Soft Delete | ✅ | ✅ |
| Hard Delete | ❌ (Cascades from FK) | ✅ (Application Layer) |
| Related Record Cascade | ❌ (Database constraint) | ✅ (Application-managed) |
| No FK Constraints | ❌ | ✅ |
| Cleaner Error Handling | ❌ | ✅ |

---

## Technical Details

### Franchise Isolation
- All queries automatically filtered by user's franchise_id
- Super admins can access all franchises
- Non-super-admins are restricted to their franchise

### Soft Delete
- Default behavior: marks customer as `is_active = false`
- Related records NOT automatically deactivated
- Customer can be reactivated

### Hard Delete
- Permanently deletes customer record
- Cascades to delete related records:
  - returns
  - product_orders
  - package_bookings
- Cannot be undone

### Authentication
- Requires staff-level access or higher
- Franchise isolation enforced per request
- User ID tracked in `created_by`/`updated_by`

---

## Status Codes Reference

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success (GET/PUT) | Customer updated |
| 201 | Created (POST) | New customer created |
| 400 | Bad Request | Missing required field |
| 401 | Unauthorized | Not authenticated |
| 403 | Forbidden | Wrong franchise access |
| 404 | Not Found | Customer doesn't exist |
| 409 | Conflict | Phone number duplicate |
| 500 | Server Error | Database error |

---

## Notes

- The API v1 is production-ready and deployed to Vercel
- Old `/api/customers` and `/api/delete` endpoints still work
- Gradual migration recommended (not required)
- No database schema changes needed for the API to work
- Optional: Run SQL migration to remove FK constraint for complete independence

**Last Updated:** November 9, 2025
**Commit:** 03bdcdd
