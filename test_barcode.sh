#!/bin/bash

echo "🔍 BARCODE SCANNING SYSTEM AUDIT - SAF562036"
echo "=============================================="
echo ""

# This script will help debug the barcode scanning issue
# We need to check:
# 1. Does the barcode exist in database?
# 2. Is it linked to a product?
# 3. Is the product data complete?
# 4. Is the API working?
# 5. Are there any franchise issues?

cat << 'SQL' > /tmp/check_barcode.sql
-- Check 1: Does barcode exist?
SELECT 'STEP 1: Barcode Existence' as check_name;
SELECT b.id, b.barcode_number, b.product_id, b.is_active, b.barcode_type
FROM barcodes b
WHERE b.barcode_number = 'SAF562036'
LIMIT 1;

-- Check 2: Is it linked to a product?
SELECT 'STEP 2: Product Link' as check_name;
SELECT p.id, p.name, p.category, p.sale_price, p.rental_price, p.security_deposit, p.franchise_id
FROM barcodes b
JOIN products p ON b.product_id = p.id
WHERE b.barcode_number = 'SAF562036'
LIMIT 1;

-- Check 3: All barcodes for this product
SELECT 'STEP 3: All Barcodes for Product' as check_name;
SELECT b.barcode_number, b.barcode_type, b.is_active
FROM barcodes b
WHERE b.product_id = (
  SELECT product_id FROM barcodes WHERE barcode_number = 'SAF562036' LIMIT 1
)
ORDER BY b.created_at DESC;

-- Check 4: Product alternative codes
SELECT 'STEP 4: Product Codes' as check_name;
SELECT product_code, barcode_number, alternate_barcode_1, alternate_barcode_2, sku, code
FROM products
WHERE id = (
  SELECT product_id FROM barcodes WHERE barcode_number = 'SAF562036' LIMIT 1
);

-- Check 5: Count total barcodes in system
SELECT 'STEP 5: System Stats' as check_name;
SELECT COUNT(*) as total_barcodes, COUNT(DISTINCT product_id) as products_with_barcodes
FROM barcodes WHERE is_active = true;
SQL

echo "SQL Commands prepared in /tmp/check_barcode.sql"
