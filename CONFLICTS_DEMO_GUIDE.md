# Conflicts Demo Guide

This guide helps you SEE the date-aware availability conflicts inside the Product Selection dialog.

## 1) Seed demo data

Run the SQL below in your Supabase SQL Editor (SQL → New query):

- Open `SEED_CONFLICT_DEMO.sql`
- Copy all and paste into SQL editor
- Click Run

What it does:
- Ensures you have a customer and a franchise
- Creates a product named "Conflict Demo Safa" with stock 10
- Creates two product orders:
  - 2025-10-09: quantity 3 (D-2)
  - 2025-10-12: quantity 6 (D+1)

## 2) Set event date in booking wizard

- Go to `/book-package`
- Step 2 (Customer & Event): set Event Date to `2025-10-11`

Why 2025-10-11?
- The dialog checks [D−2, D+2] → 2025-10-09 to 2025-10-13
- Our demo orders fall on 10/09 and 10/12, so you’ll see conflicts

## 3) Open product selection dialog

- In Step 1, choose any package and add a variant (opens dialog)
- In the dialog:
  - Use the category chips to select the category containing "Conflict Demo Safa" (Demo Safas)
  - Look at the product card:
    - "Booked: 9" in the window
    - Availability badge:
      - If stock_available is 10, you should see "Low • 1 left"
    - Click the "Details" button:
      - Last 2 days → shows 2025-10-09 (×3)
      - Next 2 days → shows 2025-10-12 (×6)

## 4) Try reserving beyond availability

- Increase Qty beyond available (e.g., set 2 if only 1 is left)
- The + button is disabled when it would exceed availability
- If you force it via input, the Reserve button will show an error

## 5) Reset / Cleanup (optional)

- To reset the product’s stock:
  - In SQL editor: `UPDATE products SET stock_available = stock_total, stock_booked = 0 WHERE name = 'Conflict Demo Safa';`
- To remove demo orders:
  - `DELETE FROM product_order_items WHERE order_id IN (SELECT id FROM product_orders WHERE order_number IN ('ORD-DEMO-1','ORD-DEMO-2'));`
  - `DELETE FROM product_orders WHERE order_number IN ('ORD-DEMO-1','ORD-DEMO-2');`

## Notes
- Conflicts are currently calculated from product orders (product_order_items + product_orders). If you later attach products directly to package bookings, we can include those too.
- If you use multiple franchises and want franchise-aware conflicts, we can filter by `franchise_id` as a follow-up.
