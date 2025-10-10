console.log('🧪 Testing Customer Display Issue...');

// Test direct API call to customers endpoint
async function testCustomersAPI() {
  try {
    console.log('\n📡 Testing /api/customers endpoint...');
    
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Using headers that match our API client
        'X-User-ID': 'test-user-id',
        'X-User-Email': 'test@example.com'
      }
    });
    
    const result = await response.json();
    
    console.log('\n📊 API Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Message:', result.message);
    console.log('Data count:', Array.isArray(result.data) ? result.data.length : 'Not an array');
    
    if (Array.isArray(result.data) && result.data.length > 0) {
      console.log('\n👥 First customer:');
      console.log(JSON.stringify(result.data[0], null, 2));
    } else {
      console.log('\n⚠️  No customers found in response');
    }
    
    return result;
    
  } catch (error) {
    console.error('\n❌ API Test Failed:', error.message);
    return null;
  }
}

// Test from browser context (simulating frontend)
async function testFromBrowser() {
  try {
    console.log('\n🌐 Testing from browser context...');
    
    // Simulate what the frontend does
    const user = {
      id: 'test-user-id',
      email: 'test@example.com'
    };
    
    // Store in localStorage (this simulates browser environment)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    // Test the data service
    console.log('User data for headers:', user);
    
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': user.id,
      'X-User-Email': user.email
    };
    
    console.log('Headers being sent:', headers);
    
    const response = await fetch('http://localhost:3000/api/customers', {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    console.log('Browser context result:', result);
    
    return result;
    
  } catch (error) {
    console.error('\n❌ Browser Test Failed:', error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Customer Display Tests...\n');
  
  const apiResult = await testCustomersAPI();
  const browserResult = await testFromBrowser();
  
  console.log('\n📋 Test Summary:');
  console.log('API Direct Test:', apiResult ? '✅ Success' : '❌ Failed');
  console.log('Browser Context Test:', browserResult ? '✅ Success' : '❌ Failed');
  
  if (apiResult && browserResult) {
    console.log('\n🎉 Both tests passed! Customer data should be visible.');
  } else {
    console.log('\n🔍 Check the specific test results above for debugging.');
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testCustomersAPI, testFromBrowser, runTests };
} else {
  // Run immediately if in browser or direct execution
  runTests();
}