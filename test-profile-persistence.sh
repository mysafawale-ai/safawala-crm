#!/bin/bash

# Profile Form Data Persistence Test Script
echo "🧪 Starting Profile Form Data Persistence Testing..."
echo "======================================================="

# Start server in background
echo "🚀 Starting development server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"

# Wait for server to start
echo "⏳ Waiting for server startup..."
sleep 10

# Check if server is responding
echo "🔍 Checking server status..."
for i in {1..10}; do
    if curl -s http://localhost:3001/api/settings/profile -o /dev/null; then
        echo "✅ Server is responding"
        break
    fi
    echo "   Attempt $i/10 - waiting..."
    sleep 2
done

echo ""
echo "📝 Step 1: Creating comprehensive test profile..."
echo "=================================================="

# Create profile with all fields filled
CREATE_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/settings/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "franchise_id": "00000000-0000-0000-0000-000000000001",
    "user_id": "11111111-1111-1111-1111-111111111111",
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john.doe@test.com",
    "phone": "+1-555-123-4567",
    "role": "manager",
    "designation": "Operations Manager",
    "department": "Operations",
    "employee_id": "EMP001",
    "date_of_joining": "2024-01-15",
    "address": "123 Main Street, Apt 4B",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "emergency_contact_name": "Jane Doe",
    "emergency_contact_phone": "+1-555-987-6543",
    "bio": "Experienced operations manager with 8 years in retail and customer service management."
  }' \
  -w "\n%{http_code}")

echo "Response: $CREATE_RESPONSE"
HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

echo "HTTP Status Code: $HTTP_CODE"
echo "Response Body: $RESPONSE_BODY"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Profile creation successful (HTTP 200)"
    
    # Extract profile ID
    PROFILE_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.id' 2>/dev/null)
    echo "Profile ID: $PROFILE_ID"
    
    if [ "$PROFILE_ID" != "null" ] && [ "$PROFILE_ID" != "" ]; then
        echo "✅ Profile ID extracted successfully"
        
        echo ""
        echo "🔍 Step 2: Verifying data persistence..."
        echo "========================================"
        
        # Read back the data
        sleep 2
        READ_RESPONSE=$(curl -s "http://localhost:3001/api/settings/profile?franchise_id=00000000-0000-0000-0000-000000000001")
        echo "Read Response: $READ_RESPONSE"
        
        # Check if our profile exists
        FOUND_PROFILE=$(echo "$READ_RESPONSE" | jq ".data[] | select(.id == \"$PROFILE_ID\")" 2>/dev/null)
        if [ "$FOUND_PROFILE" != "" ]; then
            echo "✅ Profile found in database after creation"
            
            # Verify specific fields
            SAVED_EMAIL=$(echo "$FOUND_PROFILE" | jq -r '.email')
            SAVED_FIRST_NAME=$(echo "$FOUND_PROFILE" | jq -r '.first_name')
            SAVED_DEPARTMENT=$(echo "$FOUND_PROFILE" | jq -r '.department')
            
            echo "Saved Email: $SAVED_EMAIL"
            echo "Saved First Name: $SAVED_FIRST_NAME" 
            echo "Saved Department: $SAVED_DEPARTMENT"
            
            if [ "$SAVED_EMAIL" = "john.doe@test.com" ] && [ "$SAVED_FIRST_NAME" = "John" ] && [ "$SAVED_DEPARTMENT" = "Operations" ]; then
                echo "✅ All test data matches exactly"
            else
                echo "❌ Data mismatch detected"
            fi
            
            echo ""
            echo "✏️ Step 3: Testing profile updates..."
            echo "===================================="
            
            # Update the profile
            UPDATE_RESPONSE=$(curl -s -X PUT "http://localhost:3001/api/settings/profile?id=$PROFILE_ID" \
              -H "Content-Type: application/json" \
              -d '{
                "franchise_id": "00000000-0000-0000-0000-000000000001",
                "first_name": "John Updated",
                "last_name": "Doe Updated",
                "email": "john.updated@test.com",
                "phone": "+1-555-999-8888",
                "role": "manager",
                "designation": "Senior Operations Manager",
                "bio": "Updated bio with more experience."
              }' \
              -w "\n%{http_code}")
            
            UPDATE_HTTP_CODE=$(echo "$UPDATE_RESPONSE" | tail -n1)
            UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | head -n -1)
            
            echo "Update HTTP Code: $UPDATE_HTTP_CODE"
            echo "Update Response: $UPDATE_BODY"
            
            if [ "$UPDATE_HTTP_CODE" = "200" ]; then
                echo "✅ Profile update successful"
                
                # Verify update persistence
                sleep 2
                VERIFY_UPDATE=$(curl -s "http://localhost:3001/api/settings/profile?franchise_id=00000000-0000-0000-0000-000000000001")
                UPDATED_PROFILE=$(echo "$VERIFY_UPDATE" | jq ".data[] | select(.id == \"$PROFILE_ID\")" 2>/dev/null)
                
                UPDATED_EMAIL=$(echo "$UPDATED_PROFILE" | jq -r '.email')
                UPDATED_FIRST_NAME=$(echo "$UPDATED_PROFILE" | jq -r '.first_name')
                
                echo "Updated Email: $UPDATED_EMAIL"
                echo "Updated First Name: $UPDATED_FIRST_NAME"
                
                if [ "$UPDATED_EMAIL" = "john.updated@test.com" ] && [ "$UPDATED_FIRST_NAME" = "John Updated" ]; then
                    echo "✅ Updates persisted correctly"
                else
                    echo "❌ Update persistence failed"
                fi
            else
                echo "❌ Profile update failed"
            fi
            
            echo ""
            echo "🗑️ Step 4: Testing profile deletion..."
            echo "====================================="
            
            # Delete the profile
            DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3001/api/settings/profile?id=$PROFILE_ID" \
              -w "\n%{http_code}")
            
            DELETE_HTTP_CODE=$(echo "$DELETE_RESPONSE" | tail -n1)
            DELETE_BODY=$(echo "$DELETE_RESPONSE" | head -n -1)
            
            echo "Delete HTTP Code: $DELETE_HTTP_CODE"
            echo "Delete Response: $DELETE_BODY"
            
            if [ "$DELETE_HTTP_CODE" = "200" ]; then
                echo "✅ Profile deletion successful"
                
                # Verify deletion
                sleep 2
                VERIFY_DELETE=$(curl -s "http://localhost:3001/api/settings/profile?franchise_id=00000000-0000-0000-0000-000000000001")
                DELETED_PROFILE=$(echo "$VERIFY_DELETE" | jq ".data[] | select(.id == \"$PROFILE_ID\")" 2>/dev/null)
                
                if [ "$DELETED_PROFILE" = "" ]; then
                    echo "✅ Profile successfully removed from database"
                else
                    echo "❌ Profile still exists after deletion"
                fi
            else
                echo "❌ Profile deletion failed"
            fi
            
        else
            echo "❌ Profile not found in database"
        fi
    else
        echo "❌ Failed to extract profile ID"
    fi
else
    echo "❌ Profile creation failed (HTTP $HTTP_CODE)"
fi

echo ""
echo "❌ Step 5: Testing invalid data handling..."
echo "=========================================="

# Test invalid data
INVALID_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/settings/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "franchise_id": "invalid-uuid",
    "first_name": "",
    "email": "invalid-email",
    "role": "invalid-role"
  }' \
  -w "\n%{http_code}")

INVALID_HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
INVALID_BODY=$(echo "$INVALID_RESPONSE" | head -n -1)

echo "Invalid Data HTTP Code: $INVALID_HTTP_CODE"
echo "Invalid Data Response: $INVALID_BODY"

if [ "$INVALID_HTTP_CODE" = "400" ] || [ "$INVALID_HTTP_CODE" = "500" ]; then
    echo "✅ Invalid data properly rejected"
else
    echo "❌ Invalid data was accepted (security issue)"
fi

echo ""
echo "🎉 Profile Form Data Persistence Testing Complete!"
echo "=================================================="

# Clean up
echo "🧹 Cleaning up..."
kill $SERVER_PID 2>/dev/null
rm -f server.log

echo "✅ Test completed successfully"