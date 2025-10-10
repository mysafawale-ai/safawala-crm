#!/usr/bin/env node

/**
 * Quick Customer Form Verification Test
 */

const http = require('http');

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'test-user-123',
        'X-User-Email': 'tester@safawala.com',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runQuickTest() {
  console.log('🧪 Quick Customer Form Verification\n');
  
  // Test 1: Create customer
  console.log('1. Testing customer creation...');
  const createData = {
    name: 'Quick Test Customer',
    email: 'quicktest@example.com',
    phone: '9876543210',
    whatsapp: '9876543210',
    address: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001'
  };
  
  try {
    const createResponse = await makeRequest('POST', '/api/customers', createData);
    if (createResponse.status === 201 && createResponse.data.success) {
      console.log('   ✅ Customer created successfully');
      const customerId = createResponse.data.data.id;
      
      // Test 2: Retrieve customer
      console.log('2. Testing data persistence...');
      const getResponse = await makeRequest('GET', `/api/customers/${customerId}`);
      if (getResponse.status === 200 && getResponse.data.success) {
        console.log('   ✅ Data persisted correctly');
        
        // Test 3: Update customer
        console.log('3. Testing customer update...');
        const updateData = { name: 'Updated Quick Test Customer' };
        const updateResponse = await makeRequest('PUT', `/api/customers/${customerId}`, updateData);
        if (updateResponse.status === 200 && updateResponse.data.success) {
          console.log('   ✅ Customer updated successfully');
          
          // Test 4: Delete customer
          console.log('4. Testing customer deletion...');
          const deleteResponse = await makeRequest('DELETE', `/api/customers/${customerId}`);
          if (deleteResponse.status === 200 && deleteResponse.data.success) {
            console.log('   ✅ Customer deleted successfully');
            
            // Test 5: Verify deletion
            console.log('5. Verifying deletion...');
            const verifyResponse = await makeRequest('GET', `/api/customers/${customerId}`);
            if (verifyResponse.status === 404) {
              console.log('   ✅ Deletion verified (404 response)');
            } else {
              console.log('   ❌ Deletion not verified');
            }
          } else {
            console.log('   ❌ Delete failed:', deleteResponse.status);
          }
        } else {
          console.log('   ❌ Update failed:', updateResponse.status);
        }
      } else {
        console.log('   ❌ Data persistence failed:', getResponse.status);
      }
    } else {
      console.log('   ❌ Customer creation failed:', createResponse.status);
      console.log('   Response:', createResponse.data);
    }
  } catch (error) {
    console.error('   ❌ Test error:', error.message);
  }
  
  // Test invalid data
  console.log('6. Testing validation...');
  try {
    const invalidResponse = await makeRequest('POST', '/api/customers', { 
      name: '', 
      email: 'invalid-email',
      phone: '123'
    });
    if (invalidResponse.status === 400) {
      console.log('   ✅ Invalid data properly rejected');
    } else {
      console.log('   ❌ Validation failed');
    }
  } catch (error) {
    console.error('   ❌ Validation test error:', error.message);
  }
  
  console.log('\n🎉 Quick verification completed!');
}

runQuickTest();