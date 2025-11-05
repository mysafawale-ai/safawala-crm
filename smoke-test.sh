#!/usr/bin/env bash

# ============================================
# COMPREHENSIVE BARCODE SYSTEM SMOKE TEST
# ============================================
# This script tests the complete barcode system:
# 1. API endpoint functionality
# 2. Product availability  
# 3. Barcode-Product linking
# 4. Frontend form responsiveness

BARCODE_TEST="SAF562036"
API_URL="http://localhost:3000/api/barcode/lookup"
FORM_URL="http://localhost:3000/create-product-order"

echo "============================================"
echo "🚀 BARCODE SYSTEM COMPREHENSIVE TEST"
echo "============================================"
echo ""
echo "Test Barcode: $BARCODE_TEST"
echo "API URL: $API_URL"
echo "Form URL: $FORM_URL"
echo ""

# ============================================
# STEP 1: Check if dev server is running
# ============================================

echo "📋 Step 1: Checking if dev server is running..."

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Dev server is NOT running at http://localhost:3000"
    echo "   Start the dev server with: pnpm dev"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# ============================================
# STEP 2: Test API endpoint - barcode not found first
# ============================================

echo "📋 Step 2: Testing API endpoint..."
echo "   Sending: POST /api/barcode/lookup"
echo "   Payload: { barcode: '$BARCODE_TEST' }"
echo ""

API_RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"barcode\":\"$BARCODE_TEST\"}")

echo "API Response:"
echo "$API_RESPONSE" | jq . 2>/dev/null || echo "$API_RESPONSE"
echo ""

# Check if error or success
if echo "$API_RESPONSE" | grep -q '"error"'; then
    echo "⚠️ API returned an error"
    ERROR_MSG=$(echo "$API_RESPONSE" | jq -r '.error' 2>/dev/null)
    echo "   Error: $ERROR_MSG"
    
    if [ "$ERROR_MSG" = "Barcode not found" ]; then
        echo "   → Barcode SAF562036 does NOT exist in the system"
        echo ""
        echo "📝 ACTION REQUIRED:"
        echo "   1. The barcode needs to be created in Supabase"
        echo "   2. Run: POPULATE_SAMPLE_BARCODES.sql or CREATE_DEDICATED_BARCODES_TABLE.sql"
        echo "   3. Or use the Supabase dashboard to add it manually"
    fi
elif echo "$API_RESPONSE" | grep -q '"success":true'; then
    echo "✅ API found the barcode!"
    PRODUCT_NAME=$(echo "$API_RESPONSE" | jq -r '.product.name' 2>/dev/null)
    PRODUCT_ID=$(echo "$API_RESPONSE" | jq -r '.product.id' 2>/dev/null)
    echo "   Product: $PRODUCT_NAME (ID: $PRODUCT_ID)"
else
    echo "❓ Unexpected API response"
fi

echo ""

# ============================================
# STEP 3: Test form accessibility
# ============================================

echo "📋 Step 3: Testing form accessibility..."

FORM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FORM_URL")

if [ "$FORM_STATUS" = "200" ]; then
    echo "✅ Form is accessible"
else
    echo "⚠️ Form returned status: $FORM_STATUS"
fi

echo ""

# ============================================
# STEP 4: List test scenarios
# ============================================

echo "📋 Step 4: Manual Smoke Test Scenarios"
echo ""
echo "🧪 SCENARIO 1: Test barcode scan in browser"
echo "   1. Open: http://localhost:3000/create-product-order"
echo "   2. Select 'Direct Sale' mode"
echo "   3. Focus on 'Quick Add by Barcode' input"
echo "   4. Type or scan: $BARCODE_TEST"
echo "   5. Press Enter"
echo "   Expected: Product appears in cart"
echo ""

echo "🧪 SCENARIO 2: Test browser console for errors"
echo "   1. Open DevTools Console (F12)"
echo "   2. Filter for: [Barcode Scan]"
echo "   Expected: Green ✅ success messages, no ❌ errors"
echo ""

echo "🧪 SCENARIO 3: Test network request"
echo "   1. Open DevTools Network tab"
echo "   2. Filter for: barcode"
echo "   3. Scan the barcode"
echo "   4. Check POST /api/barcode/lookup request"
echo "   Expected: Status 200, success: true in response"
echo ""

echo "🧪 SCENARIO 4: Test duplicate prevention"
echo "   1. Scan $BARCODE_TEST twice"
echo "   Expected: Quantity increments to 2 (not duplicate line item)"
echo ""

# ============================================
# STEP 5: Database verification command
# ============================================

echo "📊 Database Verification (Run in Supabase SQL Editor)"
echo ""
echo "-- Check if barcode exists:"
echo "SELECT * FROM barcodes WHERE barcode_number = '$BARCODE_TEST';"
echo ""
echo "-- Check linked product:"
echo "SELECT b.*, p.name, p.sale_price FROM barcodes b"
echo "JOIN products p ON b.product_id = p.id"
echo "WHERE b.barcode_number = '$BARCODE_TEST';"
echo ""

# ============================================
# STEP 6: Summary
# ============================================

echo "============================================"
echo "📊 TEST SUMMARY"
echo "============================================"
echo ""
echo "✅ Completed: API endpoint test"
echo "✅ Completed: Form accessibility test"
echo "⏳ Pending: Manual smoke test (open browser)"
echo "⏳ Pending: Database verification (run SQL)"
echo ""

echo "🎯 NEXT ACTIONS:"
echo "1. If barcode not found: Create it in Supabase dashboard"
echo "2. Open http://localhost:3000/create-product-order in browser"
echo "3. Try scanning barcode SAF562036"
echo "4. Check browser console (DevTools F12)"
echo "5. Verify product appears in cart"
echo ""

echo "============================================"
