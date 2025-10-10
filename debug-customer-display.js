#!/usr/bin/env node

console.log('🚀 Customer Display Debug Script');
console.log('================================\n');

// Test 1: Direct API endpoint test
async function testAPI() {
  console.log('📡 Test 1: Direct API Call');
  console.log('---------------------------');
  
  try {
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'debug-user',
        'X-User-Email': 'debug@test.com'
      }
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Success: ${result.success}`);
    console.log(`Message: ${result.message || 'No message'}`);
    
    if (result.data) {
      console.log(`Data type: ${Array.isArray(result.data) ? 'Array' : typeof result.data}`);
      console.log(`Count: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
      
      if (Array.isArray(result.data) && result.data.length > 0) {
        console.log('Sample customer:');
        console.log(JSON.stringify(result.data[0], null, 2));
      }
    }
    
    return { success: response.ok, data: result };
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test 2: Check if server is running
async function testServerHealth() {
  console.log('\n🏥 Test 2: Server Health Check');
  console.log('------------------------------');
  
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    });
    
    if (response.ok) {
      console.log('✅ Server is responding');
      return true;
    } else {
      console.log(`⚠️  Server responding with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Server not reachable:', error.message);
    return false;
  }
}

// Test 3: Test various endpoints
async function testMultipleEndpoints() {
  console.log('\n🔄 Test 3: Multiple Endpoint Test');
  console.log('----------------------------------');
  
  const endpoints = [
    '/api/customers',
    '/api/dashboard/stats',
    '/api/franchises'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint}`, {
        headers: {
          'X-User-ID': 'debug-user',
          'X-User-Email': 'debug@test.com'
        }
      });
      
      console.log(`${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (!response.ok) {
        const text = await response.text();
        console.log(`  Error: ${text.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`${endpoint}: Failed ❌ - ${error.message}`);
    }
  }
}

// Test 4: Check authentication headers
async function testAuthHeaders() {
  console.log('\n🔐 Test 4: Authentication Headers');
  console.log('---------------------------------');
  
  const testCases = [
    { name: 'No headers', headers: {} },
    { name: 'X-User headers', headers: { 'X-User-ID': 'test', 'X-User-Email': 'test@test.com' } },
    { name: 'Authorization Bearer', headers: { 'Authorization': 'Bearer test-token' } },
    { name: 'Both headers', headers: { 
      'X-User-ID': 'test', 
      'X-User-Email': 'test@test.com',
      'Authorization': 'Bearer test-token' 
    }}
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await fetch('http://localhost:3000/api/customers', {
        headers: {
          'Content-Type': 'application/json',
          ...testCase.headers
        }
      });
      
      console.log(`${testCase.name}: ${response.status} ${response.ok ? '✅' : '❌'}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`  Data count: ${Array.isArray(result.data) ? result.data.length : 'N/A'}`);
      }
      
    } catch (error) {
      console.log(`${testCase.name}: Failed ❌ - ${error.message}`);
    }
  }
}

// Main test runner
async function runAllTests() {
  console.log('Starting comprehensive debug tests...\n');
  
  const serverHealth = await testServerHealth();
  
  if (!serverHealth) {
    console.log('\n🛑 Cannot proceed - server is not responding');
    console.log('Make sure you have started the development server with: npm run dev');
    return;
  }
  
  const apiTest = await testAPI();
  await testMultipleEndpoints();
  await testAuthHeaders();
  
  console.log('\n📋 Summary');
  console.log('===========');
  console.log(`Server Health: ${serverHealth ? '✅' : '❌'}`);
  console.log(`API Test: ${apiTest.success ? '✅' : '❌'}`);
  
  if (apiTest.success && apiTest.data && Array.isArray(apiTest.data.data)) {
    console.log(`Customer Count: ${apiTest.data.data.length}`);
    
    if (apiTest.data.data.length === 0) {
      console.log('\n💡 Recommendations:');
      console.log('1. Check if customers exist in Supabase database');
      console.log('2. Verify franchise_id matching in customers table');
      console.log('3. Check if getDefaultFranchiseId() returns correct ID');
      console.log('4. Test creating a new customer to see if it appears');
    } else {
      console.log('\n🎉 Customers found! The issue might be in the frontend display logic.');
    }
  }
  
  console.log('\nFor more details, check the individual test results above.');
}

// Run the tests
runAllTests().catch(console.error);