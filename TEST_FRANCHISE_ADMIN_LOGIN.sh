#!/bin/bash

# Test Franchise Admin Login Issue
# Usage: ./TEST_FRANCHISE_ADMIN_LOGIN.sh "franchise-admin@email.com" "password123"

EMAIL="${1:-}"
PASSWORD="${2:-}"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: ./TEST_FRANCHISE_ADMIN_LOGIN.sh <email> <password>"
  echo ""
  echo "Examples:"
  echo "  ./TEST_FRANCHISE_ADMIN_LOGIN.sh admin@franchise.com password123"
  echo ""
  exit 1
fi

API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="$API_URL/api/auth/login"

echo "================================================"
echo "Testing Franchise Admin Login"
echo "================================================"
echo ""
echo "Email: $EMAIL"
echo "Endpoint: $ENDPOINT"
echo ""
echo "Sending login request..."
echo ""

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

echo "RESPONSE:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "================================================"
echo ""

# Check if login successful
if echo "$RESPONSE" | grep -q '"id"'; then
  echo "✅ LOGIN SUCCESSFUL"
  echo ""
  echo "User data:"
  echo "$RESPONSE" | jq '.user' 2>/dev/null || echo "$RESPONSE"
else
  echo "❌ LOGIN FAILED"
  echo ""
  if echo "$RESPONSE" | grep -q "Invalid email or password"; then
    echo "Issue: Invalid credentials or user not found"
    echo ""
    echo "Next steps:"
    echo "1. Verify email is correct (check database for exact email)"
    echo "2. Verify password is correct"
    echo "3. Check if is_active = true in database"
    echo ""
    echo "Database query:"
    echo "  SELECT id, email, role, franchise_id, is_active, password_hash"
    echo "  FROM users WHERE email ILIKE '$EMAIL';"
  else
    echo "Error from server:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
  fi
fi

echo ""
echo "================================================"
