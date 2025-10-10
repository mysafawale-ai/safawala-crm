/**
 * Profile Data Persistence Debug Script
 * Tests the exact issue: Profile saves but data disappears after refresh
 */

console.log('🔍 Starting Profile Data Persistence Debug...\n');

const BASE_URL = 'http://localhost:3002'; // Adjust based on your current server
const PROFILE_ENDPOINT = '/api/settings/profile';

// Test payload matching your form
const TEST_PROFILE_DATA = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@safawala.com',
  phone: '+91 98765 43210',
  role: 'General Manager', // Note: This might be the issue if dropdown is empty
  designation: 'Operations',
  department: 'Operations',
  employee_id: 'EMP001',
  date_of_joining: '2024-01-15',
  street_address: '123 Main Street, Building Name',
  city: 'Mumbai',
  state: 'Maharashtra',
  postal_code: '400001',
  emergency_contact_name: 'Emergency Contact',
  emergency_contact_phone: '+91 98765 12345',
  bio: 'Test save for debugging data persistence issue',
  debug_marker: `save-${new Date().toISOString()}-${Math.random().toString(36).substr(2, 9)}`
};

let testResults = {
  tests: [],
  issues: []
};

function logTest(testName, status, details = '') {
  const result = { testName, status, details, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${statusIcon} ${testName}: ${status}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function logIssue(issue) {
  testResults.issues.push(issue);
  console.log(`🚨 ISSUE: ${issue}`);
}

async function testProfilePersistence() {
  console.log('='.repeat(60));
  console.log('🧪 PROFILE DATA PERSISTENCE DEBUG TEST');
  console.log('='.repeat(60));
  
  // Test 1: Check if profile endpoint exists
  console.log('\n📡 Testing API Endpoint Accessibility...');
  try {
    const getResponse = await fetch(`${BASE_URL}${PROFILE_ENDPOINT}`);
    
    logTest('Profile GET Endpoint Accessible', getResponse.ok ? 'PASS' : 'FAIL', 
            `Status: ${getResponse.status}`);
    
    if (!getResponse.ok) {
      logIssue(`Profile GET endpoint returning ${getResponse.status} - API may not be set up correctly`);
    }
  } catch (error) {
    logTest('Profile GET Endpoint Accessible', 'FAIL', `Error: ${error.message}`);
    logIssue('Cannot connect to profile API endpoint');
  }

  // Test 2: Save profile data (POST)
  console.log('\n💾 Testing Profile Save (POST)...');
  let saveResponse, saveData;
  
  try {
    saveResponse = await fetch(`${BASE_URL}${PROFILE_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_PROFILE_DATA)
    });
    
    saveData = await saveResponse.json();
    
    logTest('Profile Save Request', saveResponse.ok ? 'PASS' : 'FAIL', 
            `Status: ${saveResponse.status}, Response: ${JSON.stringify(saveData).substring(0, 100)}...`);
    
    if (!saveResponse.ok) {
      logIssue(`Profile save failed with status ${saveResponse.status}: ${JSON.stringify(saveData)}`);
    } else {
      console.log('   ✅ Save successful, response received');
      console.log('   📝 Response data keys:', Object.keys(saveData.data || saveData || {}));
    }
    
  } catch (error) {
    logTest('Profile Save Request', 'FAIL', `Error: ${error.message}`);
    logIssue(`Profile save threw error: ${error.message}`);
  }

  // Test 3: Immediate read after save
  console.log('\n🔄 Testing Immediate Read After Save...');
  try {
    // Small delay to ensure any async processing completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const immediateReadResponse = await fetch(`${BASE_URL}${PROFILE_ENDPOINT}`);
    const immediateReadData = await immediateReadResponse.json();
    
    logTest('Immediate Read After Save', immediateReadResponse.ok ? 'PASS' : 'FAIL',
            `Status: ${immediateReadResponse.status}`);
    
    if (immediateReadResponse.ok) {
      const savedData = immediateReadData.data || immediateReadData;
      
      // Check if our test data is present
      const dataMatches = savedData.first_name === TEST_PROFILE_DATA.first_name &&
                         savedData.debug_marker === TEST_PROFILE_DATA.debug_marker;
      
      logTest('Data Matches After Save', dataMatches ? 'PASS' : 'FAIL',
              `first_name: "${savedData.first_name}" vs "${TEST_PROFILE_DATA.first_name}", marker: "${savedData.debug_marker}"`);
      
      if (!dataMatches) {
        logIssue('Saved data does not match what was sent - possible transaction rollback or write failure');
        console.log('   📋 Expected:', TEST_PROFILE_DATA.first_name, TEST_PROFILE_DATA.debug_marker);
        console.log('   📋 Received:', savedData.first_name, savedData.debug_marker);
      }
      
      // Check for empty/default data
      const hasData = savedData.first_name || savedData.email || savedData.bio;
      logTest('Read Data Not Empty', hasData ? 'PASS' : 'FAIL',
              `Data present: ${!!hasData}`);
      
      if (!hasData) {
        logIssue('Read endpoint returns empty data even after successful save');
      }
      
    } else {
      logIssue(`Immediate read failed with status ${immediateReadResponse.status}`);
    }
    
  } catch (error) {
    logTest('Immediate Read After Save', 'FAIL', `Error: ${error.message}`);
    logIssue(`Immediate read threw error: ${error.message}`);
  }

  // Test 4: Simulate page reload scenario
  console.log('\n🔄 Testing Reload Scenario (Fresh GET)...');
  try {
    // Simulate what happens on page reload - fresh GET request
    await new Promise(resolve => setTimeout(resolve, 500)); // Slightly longer delay
    
    const reloadReadResponse = await fetch(`${BASE_URL}${PROFILE_ENDPOINT}`, {
      cache: 'no-cache', // Simulate hard refresh
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    const reloadReadData = await reloadReadResponse.json();
    
    logTest('Reload Read Request', reloadReadResponse.ok ? 'PASS' : 'FAIL',
            `Status: ${reloadReadResponse.status}`);
    
    if (reloadReadResponse.ok) {
      const reloadData = reloadReadData.data || reloadReadData;
      
      // Check if our test data persists after "reload"
      const dataStillThere = reloadData.first_name === TEST_PROFILE_DATA.first_name &&
                            reloadData.debug_marker === TEST_PROFILE_DATA.debug_marker;
      
      logTest('Data Persists After Reload', dataStillThere ? 'PASS' : 'FAIL',
              `first_name: "${reloadData.first_name}", marker: "${reloadData.debug_marker}"`);
      
      if (!dataStillThere) {
        logIssue('🚨 CRITICAL: Data does not persist after reload simulation - this is the main issue!');
        console.log('   📋 This confirms the reported bug');
        console.log('   📋 Data was saved successfully but is not retrieved on reload');
      } else {
        console.log('   ✅ Data persistence working correctly');
      }
      
      // Check what data is actually returned
      console.log('\n📊 Reload Data Analysis:');
      console.log('   Raw response:', JSON.stringify(reloadData, null, 2));
      
      const fields = ['first_name', 'last_name', 'email', 'phone', 'bio', 'debug_marker'];
      fields.forEach(field => {
        const value = reloadData[field];
        console.log(`   ${field}: "${value}" ${value ? '✅' : '❌'}`);
      });
      
    } else {
      logIssue(`Reload read failed with status ${reloadReadResponse.status}`);
    }
    
  } catch (error) {
    logTest('Reload Read Request', 'FAIL', `Error: ${error.message}`);
    logIssue(`Reload read threw error: ${error.message}`);
  }

  // Test 5: Check for database table existence
  console.log('\n🗄️ Testing Database Integration...');
  try {
    // Try to get some indication of database health
    const healthResponse = await fetch(`${BASE_URL}/api/health`, {
      method: 'GET'
    });
    
    if (healthResponse.ok) {
      logTest('Health Check', 'PASS', 'API health endpoint accessible');
    } else {
      logTest('Health Check', 'INFO', 'No health endpoint available');
    }
    
  } catch (error) {
    logTest('Health Check', 'INFO', 'No health endpoint available');
  }

  // Generate report
  console.log('\n' + '='.repeat(60));
  console.log('📊 DEBUG SUMMARY REPORT');
  console.log('='.repeat(60));
  
  const passedTests = testResults.tests.filter(t => t.status === 'PASS').length;
  const totalTests = testResults.tests.filter(t => t.status !== 'INFO').length;
  
  console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`🚨 Issues Found: ${testResults.issues.length}`);
  
  if (testResults.issues.length > 0) {
    console.log('\n🔍 ISSUES TO INVESTIGATE:');
    testResults.issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
  }
  
  // Specific recommendations based on common patterns
  console.log('\n💡 LIKELY CAUSES & SOLUTIONS:');
  
  if (testResults.issues.some(i => i.includes('does not persist after reload'))) {
    console.log('🎯 PRIMARY ISSUE: Data saves but doesn\'t persist');
    console.log('   • Check if POST and GET use different database tables');
    console.log('   • Verify user_id/session consistency between save and load');
    console.log('   • Check for transaction rollbacks in backend logs');
    console.log('   • Verify database constraints aren\'t causing silent failures');
  }
  
  if (testResults.issues.some(i => i.includes('API may not be set up'))) {
    console.log('🎯 API SETUP ISSUE: Profile endpoints not working');
    console.log('   • Run the database setup script first');
    console.log('   • Check if profile API routes exist');
    console.log('   • Verify server is running on correct port');
  }
  
  if (testResults.issues.some(i => i.includes('transaction rollback'))) {
    console.log('🎯 DATABASE ISSUE: Data not actually saving');
    console.log('   • Check database logs for constraint violations');
    console.log('   • Verify user_profiles table exists and is accessible');
    console.log('   • Check for missing required fields causing failures');
  }
  
  console.log('\n✅ Debug test completed!');
  console.log('📝 Next steps: Check browser Network tab while running this test');
  console.log('📝 Compare with actual form save behavior in Settings');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.debugProfilePersistence = testProfilePersistence;
  console.log('💻 To run in browser: debugProfilePersistence()');
}

// Run automatically if in Node.js environment
if (typeof module !== 'undefined') {
  testProfilePersistence().catch(console.error);
}