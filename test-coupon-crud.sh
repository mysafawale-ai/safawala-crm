#!/bin/bash
# COUPON SYSTEM CRUD TEST SCRIPT
# This script tests all coupon CRUD operations

echo "🧪 COUPON SYSTEM CRUD TEST"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_BASE="http://localhost:3000"

echo "📋 Test 1: GET /api/coupons (List all coupons)"
echo "----------------------------------------------"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/api/coupons")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAIL${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

echo "📋 Test 2: POST /api/coupons (Create new coupon)"
echo "----------------------------------------------"
COUPON_DATA='{
  "code": "TEST10",
  "description": "Test coupon - 10% off",
  "discount_type": "percentage",
  "discount_value": 10,
  "min_order_value": 0,
  "max_discount": 500,
  "usage_limit": null,
  "per_user_limit": null,
  "valid_from": "2025-10-15",
  "valid_until": "2025-12-31",
  "is_active": true
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/coupons" \
  -H "Content-Type: application/json" \
  -d "$COUPON_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Status: $HTTP_CODE"
    COUPON_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "Created Coupon ID: $COUPON_ID"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAIL${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

echo "📋 Test 3: POST /api/coupons/validate (Validate coupon)"
echo "----------------------------------------------"
VALIDATE_DATA='{
  "code": "TEST10",
  "orderValue": 5000
}'

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_BASE/api/coupons/validate" \
  -H "Content-Type: application/json" \
  -d "$VALIDATE_DATA")
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
else
    echo -e "${RED}❌ FAIL${NC} - Status: $HTTP_CODE"
    echo "Response: $BODY"
fi
echo ""

echo "📋 Test 4: PUT /api/coupons (Update coupon)"
echo "----------------------------------------------"
if [ -n "$COUPON_ID" ]; then
    UPDATE_DATA='{
      "id": "'"$COUPON_ID"'",
      "discount_value": 15,
      "description": "Updated test coupon - 15% off"
    }'

    RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$API_BASE/api/coupons" \
      -H "Content-Type: application/json" \
      -d "$UPDATE_DATA")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $HTTP_CODE"
        echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $HTTP_CODE"
        echo "Response: $BODY"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} - No coupon ID from create test"
fi
echo ""

echo "📋 Test 5: DELETE /api/coupons (Delete coupon)"
echo "----------------------------------------------"
if [ -n "$COUPON_ID" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$API_BASE/api/coupons?id=$COUPON_ID")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✅ PASS${NC} - Status: $HTTP_CODE"
        echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAIL${NC} - Status: $HTTP_CODE"
        echo "Response: $BODY"
    fi
else
    echo -e "${YELLOW}⚠️  SKIP${NC} - No coupon ID from create test"
fi
echo ""

echo "=========================="
echo "🏁 TESTS COMPLETE"
echo ""
echo "NOTE: Tests may fail with 401/500 if not logged in or database not set up"
echo "To fix: 1) Login to the app first, 2) Run ADD_COUPON_SYSTEM.sql in Supabase"
