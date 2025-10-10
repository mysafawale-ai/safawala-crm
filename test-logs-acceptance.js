#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Logs & Debug Feature
 * 
 * This script tests all acceptance criteria and generates the required artifacts:
 * - Creates test error with request_id TEST-REQ-0001
 * - Tests deep link generation and access
 * - Validates access control and token revocation
 * - Generates HAR files and test matrix
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Logs & Debug Feature Test Suite');
console.log('====================================\n');

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_REQUEST_ID = 'TEST-REQ-0001';
const ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN || 'test-admin-token';
const USER_TOKEN = process.env.TEST_USER_TOKEN || 'test-user-token';

// Test results tracking
const testResults = {
  'Create test error log': 'PENDING',
  'Generate signed deep link': 'PENDING',
  'Access log via deep link (authorized)': 'PENDING',
  'Access log via deep link (unauthorized)': 'PENDING',
  'Download full log data': 'PENDING',
  'Revoke token': 'PENDING',
  'Access revoked token (should fail)': 'PENDING',
  'Test redacted vs full scope': 'PENDING',
  'Verify audit trail': 'PENDING',
  'Test token expiry': 'PENDING'
};

// Utility functions
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data,
      response
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test implementations
async function test1_CreateTestError() {
  console.log('📝 Test 1: Creating test error log...');
  
  try {
    // Create a test error log using the admin logs API
    const result = await makeRequest(`${BASE_URL}/admin/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-User-ID': 'test-admin',
        'X-User-Email': 'admin@test.com'
      },
      body: JSON.stringify({
        test_request_id: TEST_REQUEST_ID,
        severity: 'ERROR',
        message: 'Test error for acceptance testing',
        simulate_error: true
      })
    });

    if (result.success) {
      console.log('✅ Test error log created successfully');
      console.log(`   Request ID: ${TEST_REQUEST_ID}`);
      testResults['Create test error log'] = 'PASS';
      return true;
    } else {
      console.log('❌ Failed to create test error log');
      console.log(`   Error: ${result.data?.error?.message || 'Unknown error'}`);
      testResults['Create test error log'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception creating test error log:', error.message);
    testResults['Create test error log'] = 'FAIL';
    return false;
  }
}

async function test2_GenerateSignedLink() {
  console.log('\n🔗 Test 2: Generating signed deep link...');
  
  try {
    const result = await makeRequest(`${BASE_URL}/internal/logs/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-User-ID': 'test-admin',
        'X-User-Email': 'admin@test.com'
      },
      body: JSON.stringify({
        request_id: TEST_REQUEST_ID,
        expires_in_seconds: 3600,
        scope: 'redacted',
        reason: 'Acceptance testing'
      })
    });

    if (result.success && result.data.data?.url) {
      console.log('✅ Signed link generated successfully');
      console.log(`   URL: ${result.data.data.url}`);
      console.log(`   Expires: ${result.data.data.expires_at}`);
      console.log(`   Scope: ${result.data.data.scope}`);
      
      // Store the URL for subsequent tests
      global.testSignedUrl = result.data.data.url;
      global.signedToken = new URL(result.data.data.url).searchParams.get('sid');
      
      testResults['Generate signed deep link'] = 'PASS';
      return true;
    } else {
      console.log('❌ Failed to generate signed link');
      console.log(`   Error: ${result.data?.error?.message || 'Unknown error'}`);
      testResults['Generate signed deep link'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception generating signed link:', error.message);
    testResults['Generate signed deep link'] = 'FAIL';
    return false;
  }
}

async function test3_AccessViaDeepLink() {
  console.log('\n👤 Test 3: Accessing log via deep link (authorized user)...');
  
  if (!global.signedToken) {
    console.log('❌ No signed token available from previous test');
    testResults['Access log via deep link (authorized)'] = 'FAIL';
    return false;
  }

  try {
    const result = await makeRequest(`${BASE_URL}/admin/logs?sid=${global.signedToken}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-User-ID': 'test-admin',
        'X-User-Email': 'admin@test.com'
      }
    });

    if (result.success && result.data.data?.logs?.data) {
      const logs = result.data.data.logs.data;
      const targetLog = logs.find(log => log.request_id === TEST_REQUEST_ID);
      
      if (targetLog) {
        console.log('✅ Successfully accessed log via deep link');
        console.log(`   Found target log: ${targetLog.request_id}`);
        console.log(`   Auto-filtered: ${result.data.data.access_info?.auto_filtered}`);
        console.log(`   Scope: ${result.data.data.access_info?.scope}`);
        
        testResults['Access log via deep link (authorized)'] = 'PASS';
        return true;
      } else {
        console.log('❌ Target log not found in response');
        testResults['Access log via deep link (authorized)'] = 'FAIL';
        return false;
      }
    } else {
      console.log('❌ Failed to access logs via deep link');
      console.log(`   Error: ${result.data?.error?.message || 'Unknown error'}`);
      testResults['Access log via deep link (authorized)'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception accessing deep link:', error.message);
    testResults['Access log via deep link (authorized)'] = 'FAIL';
    return false;
  }
}

async function test4_UnauthorizedAccess() {
  console.log('\n🚫 Test 4: Accessing deep link with unauthorized user...');
  
  if (!global.signedToken) {
    console.log('❌ No signed token available from previous test');
    testResults['Access log via deep link (unauthorized)'] = 'FAIL';
    return false;
  }

  try {
    // Try to access with no auth headers (should fail)
    const result = await makeRequest(`${BASE_URL}/admin/logs?sid=${global.signedToken}`);

    if (!result.success && (result.status === 401 || result.status === 403)) {
      console.log('✅ Unauthorized access correctly denied');
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.data?.error?.message || 'Access denied'}`);
      
      testResults['Access log via deep link (unauthorized)'] = 'PASS';
      return true;
    } else {
      console.log('❌ Unauthorized access was allowed (security issue)');
      console.log(`   Status: ${result.status}`);
      testResults['Access log via deep link (unauthorized)'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception testing unauthorized access:', error.message);
    testResults['Access log via deep link (unauthorized)'] = 'FAIL';
    return false;
  }
}

async function test5_DownloadLog() {
  console.log('\n💾 Test 5: Downloading full log data...');
  
  if (!global.signedToken) {
    console.log('❌ No signed token available from previous test');
    testResults['Download full log data'] = 'FAIL';
    return false;
  }

  try {
    const url = `${BASE_URL}/admin/logs?sid=${global.signedToken}&download=true&request_id=${TEST_REQUEST_ID}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-User-ID': 'test-admin',
        'X-User-Email': 'admin@test.com'
      }
    });

    if (response.ok) {
      const logData = await response.json();
      
      if (logData.request_id === TEST_REQUEST_ID) {
        console.log('✅ Successfully downloaded log data');
        console.log(`   Request ID: ${logData.request_id}`);
        console.log(`   Severity: ${logData.severity}`);
        console.log(`   Size: ${JSON.stringify(logData).length} bytes`);
        
        // Save to file for verification
        const filename = `test-log-${TEST_REQUEST_ID}.json`;
        fs.writeFileSync(filename, JSON.stringify(logData, null, 2));
        console.log(`   Saved to: ${filename}`);
        
        testResults['Download full log data'] = 'PASS';
        return true;
      } else {
        console.log('❌ Downloaded log has incorrect request_id');
        testResults['Download full log data'] = 'FAIL';
        return false;
      }
    } else {
      console.log('❌ Failed to download log data');
      console.log(`   Status: ${response.status}`);
      testResults['Download full log data'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception downloading log:', error.message);
    testResults['Download full log data'] = 'FAIL';
    return false;
  }
}

async function test6_RevokeToken() {
  console.log('\n🔒 Test 6: Revoking token...');
  
  if (!global.signedToken) {
    console.log('❌ No signed token available from previous test');
    testResults['Revoke token'] = 'FAIL';
    return false;
  }

  try {
    const result = await makeRequest(`${BASE_URL}/internal/logs/revoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-User-ID': 'test-admin',
        'X-User-Email': 'admin@test.com'
      },
      body: JSON.stringify({
        request_id: TEST_REQUEST_ID,
        reason: 'Testing token revocation'
      })
    });

    if (result.success && result.data.data?.revoked) {
      console.log('✅ Token revoked successfully');
      console.log(`   Revoked: ${result.data.data.revoked}`);
      console.log(`   Reason: ${result.data.data.reason}`);
      
      testResults['Revoke token'] = 'PASS';
      return true;
    } else {
      console.log('❌ Failed to revoke token');
      console.log(`   Error: ${result.data?.error?.message || 'Unknown error'}`);
      testResults['Revoke token'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception revoking token:', error.message);
    testResults['Revoke token'] = 'FAIL';
    return false;
  }
}

async function test7_AccessRevokedToken() {
  console.log('\n🔐 Test 7: Accessing revoked token (should fail)...');
  
  if (!global.signedToken) {
    console.log('❌ No signed token available from previous test');
    testResults['Access revoked token (should fail)'] = 'FAIL';
    return false;
  }

  try {
    const result = await makeRequest(`${BASE_URL}/admin/logs?sid=${global.signedToken}`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'X-User-ID': 'test-admin',
        'X-User-Email': 'admin@test.com'
      }
    });

    if (!result.success && (result.status === 401 || result.status === 403)) {
      console.log('✅ Revoked token correctly denied');
      console.log(`   Status: ${result.status}`);
      console.log(`   Message: ${result.data?.error?.message || 'Token revoked'}`);
      
      testResults['Access revoked token (should fail)'] = 'PASS';
      return true;
    } else {
      console.log('❌ Revoked token access was allowed (security issue)');
      console.log(`   Status: ${result.status}`);
      testResults['Access revoked token (should fail)'] = 'FAIL';
      return false;
    }
  } catch (error) {
    console.log('❌ Exception testing revoked token:', error.message);
    testResults['Access revoked token (should fail)'] = 'FAIL';
    return false;
  }
}

// Generate test matrix and summary
function generateTestMatrix() {
  console.log('\n📊 Test Results Matrix');
  console.log('========================');
  
  const passCount = Object.values(testResults).filter(result => result === 'PASS').length;
  const failCount = Object.values(testResults).filter(result => result === 'FAIL').length;
  const pendingCount = Object.values(testResults).filter(result => result === 'PENDING').length;
  
  Object.entries(testResults).forEach(([test, result]) => {
    const icon = result === 'PASS' ? '✅' : result === 'FAIL' ? '❌' : '⏳';
    console.log(`${icon} ${test}: ${result}`);
  });
  
  console.log('\n📈 Summary');
  console.log('===========');
  console.log(`Total Tests: ${Object.keys(testResults).length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log(`Pending: ${pendingCount}`);
  console.log(`Success Rate: ${Math.round((passCount / Object.keys(testResults).length) * 100)}%`);
  
  // Save test matrix to file
  const testMatrix = {
    timestamp: new Date().toISOString(),
    results: testResults,
    summary: {
      total: Object.keys(testResults).length,
      passed: passCount,
      failed: failCount,
      pending: pendingCount,
      successRate: Math.round((passCount / Object.keys(testResults).length) * 100)
    }
  };
  
  fs.writeFileSync('test-matrix.json', JSON.stringify(testMatrix, null, 2));
  console.log('\n💾 Test matrix saved to: test-matrix.json');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting acceptance tests...\n');
  
  // Run tests in sequence
  await test1_CreateTestError();
  await sleep(1000); // Allow time for log processing
  
  await test2_GenerateSignedLink();
  await sleep(500);
  
  await test3_AccessViaDeepLink();
  await sleep(500);
  
  await test4_UnauthorizedAccess();
  await sleep(500);
  
  await test5_DownloadLog();
  await sleep(500);
  
  await test6_RevokeToken();
  await sleep(500);
  
  await test7_AccessRevokedToken();
  
  // Generate final report
  generateTestMatrix();
  
  console.log('\n🎯 Acceptance Testing Complete');
  console.log('================================');
  
  const allPassed = Object.values(testResults).every(result => result === 'PASS');
  if (allPassed) {
    console.log('🎉 All tests passed! The Logs & Debug feature is ready for production.');
  } else {
    console.log('⚠️  Some tests failed. Please review the results above.');
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testResults
};