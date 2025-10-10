# Safawala CRM - Customer Management System

This README provides instructions for setting up the customer management module and related database tables in Safawala CRM.

## Database Setup

### 1. Create Required Tables

Run the following SQL script in your Supabase SQL Editor to create the necessary tables:

```sql
-- Script location: /scripts/create-customer-tables.sql
-- Run this script to create all customer management tables
```

The script will create the following tables:
- `customer_staff_assignments`: Links customers to staff members
- `customer_notes`: Stores notes related to customer interactions
- `customer_activity_logs`: Tracks all customer-related activities
- Also adds additional columns to the customers table if needed

### 2. Populate Test Data

If you need test data, run the following SQL script:

```sql
-- Script location: /scripts/populate-customer-data.sql
-- Run this script to populate the tables with test data
```

This will create:
- Sample franchises if they don't exist
- Staff members for each franchise
- Customers linked to franchises
- Staff assignments for customers
- Customer notes and activity logs

## Application Setup

### 1. Environment Variables

Ensure your `.env.local` file has the correct Supabase configuration:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Run the Application

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

## Troubleshooting

If customers are not displaying:

1. Check console for API errors
2. Verify your user has the correct franchise access
3. Run the following script in the browser console to clear cached data:

```javascript
// Clear all cached data
localStorage.removeItem('safawala_data_cache');
// Refresh the page
window.location.reload();
```

## Customer Management Features

The updated customer management system includes:

### Backend Features
- Franchise-based access control for customers
- Staff assignments for customers
- Customer notes and activity tracking
- Filtering by status and search terms
- Pagination for customer lists

### Frontend Features
- Customer cards showing franchise information
- Staff assignment details
- Status indicators
- Quick actions (view, edit, WhatsApp, delete)

## Data Model

### Customer
- Basic customer details (name, contact info, address)
- Linked to a franchise
- Optional staff assignments
- Status (active, inactive, etc.)

### Customer Staff Assignment
- Links customers to staff members
- Different roles (primary, support)
- Assignment tracking

### Customer Notes
- Notes related to customer interactions
- Creation tracking

### Customer Activity Logs
- Tracks all customer-related activities
- Different activity types (call, email, visit, etc.)

## API Endpoints

- `GET /api/customers`: List customers with filtering options
- `POST /api/customers`: Create a new customer
- `GET /api/customers/:id`: Get a specific customer
- `PUT /api/customers/:id`: Update a customer
- `DELETE /api/customers/:id`: Delete a customer