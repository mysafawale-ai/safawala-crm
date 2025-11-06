# 📋 Direct Sales Product Order - Booking Details Information

## Overview
This document outlines all the information captured when creating a **Direct Sales Product Order** and what can be displayed in the booking details view.

---

## 📊 Data Captured for Direct Sales Orders

### 1. **Order Information** ✅
| Field | Type | Description |
|-------|------|-------------|
| `order_number` | string | Auto-generated order ID (ORD timestamp) |
| `booking_type` | string | Fixed: "sale" |
| `status` | string | Order status (confirmed, delivered, order_complete, cancelled) |
| `created_at` | timestamp | When order was created |
| `updated_at` | timestamp | Last update time |
| `is_quote` | boolean | Whether this is a quote or actual order |

### 2. **Customer Information** ✅
| Field | Type | Description |
|-------|------|-------------|
| `customer_id` | UUID | Link to customer record |
| `customer.name` | string | Customer full name |
| `customer.phone` | string | Primary contact number |
| `customer.email` | string | Customer email |
| `customer.address` | string | Customer home address |
| `customer.city` | string | City |
| `customer.state` | string | State |
| `customer.pincode` | string | Postal code |

### 3. **Payment Information** ✅
| Field | Type | Description |
|-------|------|-------------|
| `payment_method` | string | Payment method (Cash, Card, Transfer, etc.) |
| `payment_type` | string | full / advance / partial |
| `subtotal_amount` | decimal | Product total before tax |
| `discount_amount` | decimal | Manual discount applied |
| `coupon_code` | string | Applied coupon code (if any) |
| `coupon_discount` | decimal | Discount from coupon |
| `tax_amount` | decimal | GST/tax amount (5%) |
| `total_amount` | decimal | Final invoice total |
| `security_deposit` | decimal | For sales: 0 (not applicable) |
| `amount_paid` | decimal | Amount paid by customer |
| `pending_amount` | decimal | Balance remaining |

### 4. **Delivery Information** ✅ (Optional for Sales)
| Field | Type | Description |
|-------|------|-------------|
| `event_date` | timestamp | When transaction occurred (or today if not set) |
| `event_time` | string | Time of transaction |
| `delivery_date` | timestamp | When goods delivered (optional) |
| `delivery_time` | string | Delivery time (optional) |
| `delivery_address` | string | Where to deliver goods |
| `venue_address` | string | Can store additional location info |

### 5. **Contact Details** ✅
| Field | Type | Description |
|-------|------|-------------|
| `groom_name` | string | Primary contact person name (optional) |
| `groom_whatsapp` | string | WhatsApp number (optional) |
| `groom_address` | string | Contact person address (optional) |
| `bride_name` | string | Secondary contact name (optional) |
| `bride_whatsapp` | string | Secondary WhatsApp (optional) |
| `bride_address` | string | Secondary address (optional) |

### 6. **Order Modifications** ✅
| Field | Type | Description |
|-------|------|-------------|
| `has_modifications` | boolean | Whether products were modified |
| `modifications_details` | text | Description of modifications |
| `modification_date` | timestamp | When modifications made |

### 7. **Additional Information** ✅
| Field | Type | Description |
|-------|------|-------------|
| `event_type` | string | Order context (Wedding, Corporate, etc.) |
| `event_participant` | string | Type of event (Both, Groom, Bride, etc.) |
| `notes` | text | Special instructions or notes |
| `sales_closed_by_id` | UUID | Staff member who created order |
| `franchise_id` | UUID | Which franchise/branch created order |

### 8. **Order Items** ✅
| Field | Type | Description |
|-------|------|-------------|
| `product_id` | UUID | Product being sold |
| `product_name` | string | Product name |
| `quantity` | integer | How many units |
| `unit_price` | decimal | Price per unit |
| `total_price` | decimal | Quantity × Unit Price |
| `category` | string | Product category |

---

## 🎯 Recommended Display Sections

### Section 1: **Order Header** 
```
Order # | Customer | Status | Total Amount | Created Date
```

### Section 2: **Customer Information**
- Name, Phone, Email
- Address, City, State, Pincode
- Additional contacts (if provided)

### Section 3: **Order Details**
- Order Number
- Booking Type: "Product Sale" (badge)
- Status (Confirmed / Delivered / Complete / Cancelled)
- Created Date
- Payment Method

### Section 4: **Payment & Billing**
| Item | Amount |
|------|--------|
| Subtotal | ₹XXX |
| Discount | -₹XXX |
| Coupon Discount | -₹XXX |
| Tax (5%) | +₹XXX |
| **Total** | **₹XXX** |
| Amount Paid | ₹XXX |
| Pending Amount | ₹XXX |

### Section 5: **Delivery Information** (if applicable)
- Delivery Date & Time
- Delivery Address
- Venue/Location

### Section 6: **Products Ordered**
- Table with: Product Name | Qty | Unit Price | Total Price | Category

### Section 7: **Contact Person(s)**
- Primary Contact: Name, Phone, Address
- Secondary Contact (if applicable): Name, Phone, Address

### Section 8: **Modifications** (if applicable)
- Whether order had modifications
- Modification details
- Modification date

### Section 9: **Notes & Special Instructions**
- Any special instructions provided

### Section 10: **Staff & Administrative**
- Created by (Sales Staff)
- Franchise/Branch
- Last Updated

---

## 🔄 Comparison: Rental vs Direct Sale

| Section | Rental | Direct Sale |
|---------|--------|-------------|
| **Items Table** | ✅ Clickable "Items" | ❌ Hidden (—) |
| **Delivery Date** | Optional | Optional |
| **Return Date** | Required | N/A (not shown) |
| **Security Deposit** | ✅ Tracked | ❌ N/A (0) |
| **Event Participation** | Groom/Bride details | Optional contact info |
| **Payment Model** | Rental + Deposit | Final sale amount |
| **Modifications** | N/A | Optional |
| **Status** | Complex (pending selection, confirmed, delivered, returned) | Simpler (confirmed, delivered, complete) |

---

## 📝 Form Fields Used When Creating Direct Sale

```typescript
const formData = {
  // Basic
  booking_type: "sale",
  
  // Customer (linked)
  customer_id: selectedCustomer.id,
  
  // Payment
  payment_method: "Cash / Offline Payment",
  payment_type: "full" | "advance" | "partial",
  custom_amount: 0,
  deposit_amount: 0,
  discount_amount: 0,
  coupon_code: "",
  coupon_discount: 0,
  
  // Dates (all optional for sales)
  event_date: "",
  event_time: "10:00",
  delivery_date: "",
  delivery_time: "09:00",
  
  // Contact Info (optional)
  groom_name: "",
  groom_whatsapp: "",
  groom_address: "",
  bride_name: "",
  bride_whatsapp: "",
  bride_address: "",
  
  // Location
  venue_address: "",
  delivery_address: "",
  
  // Event Context
  event_type: "Wedding",
  event_participant: "Both",
  
  // Modifications
  has_modifications: false,
  modifications_details: "",
  modification_date: "",
  modification_time: "10:00",
  
  // Notes
  notes: "",
}

// Plus: Selected Products with Quantities
items: [
  { product_id, product_name, quantity, unit_price, total_price, category },
  ...
]
```

---

## 🎨 Suggested UI Layout

```
┌─────────────────────────────────────────────┐
│  Order #ORD2937... | 28/11/2025             │
│  Customer: Rajesh Kumar | ₹115.5 | Confirmed│
└─────────────────────────────────────────────┘

│ 👤 Customer Information
├─ Name: Rajesh Kumar
├─ Phone: 1234567890
├─ Email: rajesh@example.com
└─ Address: 123 Main St, Mumbai, MH 400001

│ 💳 Payment & Billing
├─ Payment Method: Cash
├─ Payment Type: Full Payment
├─ Subtotal: ₹100
├─ Discount: -₹0
├─ Tax: +₹5
├─ Total: ₹115.5
├─ Amount Paid: ₹115.5
└─ Pending: ₹0

│ 🚚 Delivery Info
├─ Delivery Date: 28/11/2025
├─ Delivery Address: Office, Mumbai
└─ Notes: Handle with care

│ 🛍️ Products Ordered (1 item)
├─ Product A | Qty: 1 | ₹100 | Furniture
└─ (Click to view details)

│ 📋 Additional Info
├─ Event Type: Wedding
├─ Modifications: No
├─ Status: Confirmed
└─ Created: 06/11/2025
```

---

## ✅ Implementation Checklist

- [ ] Create dedicated direct sales booking view component
- [ ] Display all payment information clearly
- [ ] Show delivery details if available
- [ ] Display products table with quantities and prices
- [ ] Show customer contact information
- [ ] Display modifications if present
- [ ] Add action buttons: Edit, Download Invoice, Print, etc.
- [ ] Handle optional fields gracefully (show "—" if not set)
- [ ] Make it distinct from rental booking view
- [ ] Add status indicators with color coding

---

## 🎯 Next Steps

1. Check the current booking view for rental orders
2. Create similar structure for direct sales
3. Adapt sections to be sales-specific
4. Test with real data
5. Add invoice/receipt generation if needed

