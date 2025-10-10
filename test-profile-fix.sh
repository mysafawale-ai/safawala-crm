#!/bin/bash

# Test Profile Persistence - Quick Validation Script
echo "🧪 Testing Profile Data Persistence Fix..."

# Test if the Settings page is accessible
echo "📡 Testing Settings page accessibility..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/settings

echo ""

# Test Profile API with correct parameters
echo "📊 Testing Profile API with franchise ID..."
curl -s -X GET "http://localhost:3002/api/settings/profile?franchise_id=00000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json" | jq '.'

echo ""

# Test Profile save with required data
echo "💾 Testing Profile save with valid data..."
curl -s -X POST "http://localhost:3002/api/settings/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "franchise_id": "00000000-0000-0000-0000-000000000001",
    "first_name": "Test",
    "last_name": "User", 
    "email": "test@example.com",
    "phone": "1234567890",
    "role": "admin"
  }' | jq '.'

echo ""
echo "✅ Profile persistence test completed!"
echo "🌐 Visit http://localhost:3002/settings to test in browser"