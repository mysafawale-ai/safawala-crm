#!/usr/bin/env node

/**
 * Comprehensive QA Test Suite for Customer Management System
 * Testing: Add/Edit Customer forms and Customer listing
 * Environment: http://localhost:3001
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Test data
const TEST_CUSTOMER = {
  name: "Baapu boy",
  phone: "+91 7878787890", 
  whatsapp: "+91 7878787890",
  email: "info@safawalaa.com",
  address: "Vadodara, gujarat.",
  pincode: "390012",
  city: "Vadodara", // Will be auto-filled
  state: "Gujarat", // Will be auto-filled
  notes: "functional QA test"
};

// Results storage
const testResults = [];
let testCounter = 0;

// Helper functions
function addTestResult(area, testCase, steps, expected, actual, status, evidence = '', priority = 'Medium') {
  testCounter++;
  testResults.push({
    TestCaseID: `TC_${testCounter.toString().padStart(3, '0')}`,
    Area: area,
    TestCase: testCase,
    Steps: steps,
    Expected: expected,
    Actual: actual,
    Status: status,
    Evidence: evidence,
    Priority: priority,
    Timestamp: new Date().toISOString()
  });
}

function logTest(message, status = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${status}] ${message}`);
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test execution functions
async function runEnvironmentTests() {
  logTest('Starting Environment & Setup Tests');
  
  try {
    // Test 1: Verify application is accessible
    const response = await fetch(`${BASE_URL}/customers`);
    addTestResult(
      'Environment',
      'Application Accessibility',
      '1. Navigate to /customers page',
      'Page loads successfully with status 200',
      `Status: ${response.status}`,
      response.status === 200 ? 'PASS' : 'FAIL',
      `Response status: ${response.status}`,
      'Critical'
    );

    // Test 2: Verify new customer form accessibility
    const newCustomerResponse = await fetch(`${BASE_URL}/customers/new`);
    addTestResult(
      'Environment',
      'New Customer Form Access',
      '1. Navigate to /customers/new page',
      'Form page loads successfully with status 200',
      `Status: ${newCustomerResponse.status}`,
      newCustomerResponse.status === 200 ? 'PASS' : 'FAIL',
      `Response status: ${newCustomerResponse.status}`,
      'Critical'
    );

    // Test 3: API endpoint availability
    const apiResponse = await fetch(`${API_BASE}/customers`);
    const apiData = await apiResponse.json();
    addTestResult(
      'Environment',
      'Customer API Endpoint',
      '1. GET /api/customers',
      'API responds with valid JSON structure',
      `Status: ${apiResponse.status}, Response: ${JSON.stringify(apiData).substring(0, 100)}...`,
      apiResponse.status === 200 ? 'PASS' : 'FAIL',
      `API Response: ${JSON.stringify(apiData, null, 2)}`,
      'Critical'
    );

  } catch (error) {
    logTest(`Environment test failed: ${error.message}`, 'ERROR');
    addTestResult(
      'Environment',
      'Environment Setup',
      'Verify application accessibility',
      'All services should be running',
      `Error: ${error.message}`,
      'FAIL',
      error.stack,
      'Critical'
    );
  }
}

async function runSmokeTests() {
  logTest('Starting Smoke & Rendering Tests');
  
  // These tests would typically be run with a browser automation tool
  // For now, we'll document what should be tested
  
  const smokeTests = [
    {
      name: 'Form Fields Render',
      steps: '1. Navigate to /customers/new 2. Verify all fields are present',
      expected: 'Name*, Phone*, WhatsApp, Email, Address, Pincode*, City, State, Notes fields visible',
      area: 'UI Rendering'
    },
    {
      name: 'Required Field Indicators',
      steps: '1. Check for asterisk (*) or required indicators',
      expected: 'Name, Phone, Pincode marked as required',
      area: 'UI Rendering'
    },
    {
      name: 'Tab Order',
      steps: '1. Use Tab key to navigate through form',
      expected: 'Logical tab order: Name→Phone→WhatsApp→Email→Address→Pincode→City→State→Notes→Submit',
      area: 'Accessibility'
    },
    {
      name: 'Form Labels',
      steps: '1. Verify all form fields have proper labels',
      expected: 'All fields have descriptive labels and placeholders',
      area: 'UI Rendering'
    }
  ];

  smokeTests.forEach(test => {
    addTestResult(
      test.area,
      test.name,
      test.steps,
      test.expected,
      'Manual verification required - Browser automation needed',
      'PENDING',
      'Requires browser automation tools like Playwright or Cypress',
      'High'
    );
  });
}

async function runValidationTests() {
  logTest('Starting Client-side Validation Tests');

  try {
    // Test required field validation
    const emptyFormData = {};
    const emptyResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emptyFormData)
    });
    const emptyResult = await emptyResponse.json();

    addTestResult(
      'Validation',
      'Required Fields Validation',
      '1. Submit form with empty required fields',
      'API returns 400 error with validation message',
      `Status: ${emptyResponse.status}, Message: ${emptyResult.error || emptyResult.message}`,
      emptyResponse.status === 400 ? 'PASS' : 'FAIL',
      JSON.stringify(emptyResult, null, 2),
      'High'
    );

    // Test phone validation
    const invalidPhoneData = { ...TEST_CUSTOMER, phone: '12345' };
    const phoneResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPhoneData)
    });
    const phoneResult = await phoneResponse.json();

    addTestResult(
      'Validation',
      'Phone Number Validation',
      '1. Submit form with invalid phone number (12345)',
      'API rejects with phone validation error',
      `Status: ${phoneResponse.status}, Message: ${phoneResult.error || phoneResult.message}`,
      phoneResponse.status === 400 ? 'PASS' : 'FAIL',
      JSON.stringify(phoneResult, null, 2),
      'High'
    );

    // Test email validation
    const invalidEmailData = { ...TEST_CUSTOMER, email: 'test@' };
    const emailResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidEmailData)
    });
    const emailResult = await emailResponse.json();

    addTestResult(
      'Validation',
      'Email Validation',
      '1. Submit form with invalid email (test@)',
      'API rejects with email validation error',
      `Status: ${emailResponse.status}, Message: ${emailResult.error || emailResult.message}`,
      emailResponse.status === 400 ? 'PASS' : 'FAIL',
      JSON.stringify(emailResult, null, 2),
      'High'
    );

    // Test pincode validation
    const invalidPincodeData = { ...TEST_CUSTOMER, pincode: '123' };
    const pincodeResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidPincodeData)
    });
    const pincodeResult = await pincodeResponse.json();

    addTestResult(
      'Validation',
      'Pincode Validation',
      '1. Submit form with invalid pincode (123)',
      'API rejects with pincode validation error',
      `Status: ${pincodeResponse.status}, Message: ${pincodeResult.error || pincodeResult.message}`,
      pincodeResponse.status === 400 ? 'PASS' : 'FAIL',
      JSON.stringify(pincodeResult, null, 2),
      'High'
    );

    // Test XSS protection
    const xssData = { ...TEST_CUSTOMER, name: '<script>alert(1)</script>' };
    const xssResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xssData)
    });
    const xssResult = await xssResponse.json();

    addTestResult(
      'Security',
      'XSS Protection',
      '1. Submit form with XSS payload in name field',
      'API sanitizes input or rejects with security error',
      `Status: ${xssResponse.status}, Message: ${xssResult.error || xssResult.message}`,
      (xssResponse.status === 400 || (xssResult.data && !xssResult.data.name.includes('<script>'))) ? 'PASS' : 'FAIL',
      JSON.stringify(xssResult, null, 2),
      'High'
    );

  } catch (error) {
    logTest(`Validation test failed: ${error.message}`, 'ERROR');
    addTestResult(
      'Validation',
      'Validation Tests',
      'Execute validation tests',
      'All validation tests should complete',
      `Error: ${error.message}`,
      'FAIL',
      error.stack,
      'High'
    );
  }
}

async function runPincodeTests() {
  logTest('Starting Pincode Auto-fill Tests');

  // Note: These tests would require browser automation to test the frontend pincode service
  addTestResult(
    'Pincode Service',
    'Auto-fill Functionality',
    '1. Enter pincode 390012 in form 2. Verify city/state auto-populate',
    'City: Vadodara, State: Gujarat should auto-fill',
    'Manual verification required - Frontend testing needed',
    'PENDING',
    'Requires browser automation to test PincodeService.lookup() integration',
    'Medium'
  );

  addTestResult(
    'Pincode Service',
    'API Failure Handling',
    '1. Simulate API failure 2. Verify fallback data works',
    'Should fall back to local pincode data',
    'Manual verification required - Network simulation needed',
    'PENDING',
    'Requires network simulation tools',
    'Medium'
  );
}

async function runCreateWorkflow() {
  logTest('Starting Full Create Workflow Test');

  try {
    // Create customer with exact test data
    const createResponse = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_CUSTOMER)
    });

    const createResult = await createResponse.json();
    
    addTestResult(
      'CRUD Operations',
      'Customer Creation',
      `1. POST /api/customers with test data: ${JSON.stringify(TEST_CUSTOMER)}`,
      'Status 200/201, customer created with ID returned',
      `Status: ${createResponse.status}, Response: ${JSON.stringify(createResult)}`,
      (createResponse.status === 200 || createResponse.status === 201) ? 'PASS' : 'FAIL',
      `Request: ${JSON.stringify(TEST_CUSTOMER, null, 2)}\nResponse: ${JSON.stringify(createResult, null, 2)}`,
      'Critical'
    );

    // Store created customer ID for later tests
    if (createResult.success && createResult.data) {
      global.createdCustomerId = createResult.data.id;
      logTest(`Created customer with ID: ${global.createdCustomerId}`);
    }

  } catch (error) {
    logTest(`Create workflow test failed: ${error.message}`, 'ERROR');
    addTestResult(
      'CRUD Operations',
      'Customer Creation',
      'Create customer via API',
      'Customer should be created successfully',
      `Error: ${error.message}`,
      'FAIL',
      error.stack,
      'Critical'
    );
  }
}

async function runPersistenceTests() {
  logTest('Starting Database Persistence Tests');

  try {
    // Verify customer appears in list
    const listResponse = await fetch(`${API_BASE}/customers`);
    const listResult = await listResponse.json();

    const foundCustomer = listResult.data?.find(c => c.phone === TEST_CUSTOMER.phone);
    
    addTestResult(
      'Data Persistence',
      'Customer List Verification',
      '1. GET /api/customers 2. Verify created customer appears in list',
      'Created customer should be found in customer list',
      foundCustomer ? `Customer found: ${foundCustomer.name}` : 'Customer not found in list',
      foundCustomer ? 'PASS' : 'FAIL',
      JSON.stringify(listResult, null, 2),
      'High'
    );

    // Note: Direct SQL queries would require database access
    addTestResult(
      'Database',
      'SQL Verification',
      'SELECT * FROM customers WHERE phone = \'+91 7878787890\'',
      'Customer data should match submitted values exactly',
      'Manual verification required - Database access needed',
      'PENDING',
      'Requires direct database connection to execute SQL',
      'High'
    );

  } catch (error) {
    logTest(`Persistence test failed: ${error.message}`, 'ERROR');
    addTestResult(
      'Data Persistence',
      'Database Persistence',
      'Verify data persistence',
      'Data should persist correctly',
      `Error: ${error.message}`,
      'FAIL',
      error.stack,
      'High'
    );
  }
}

async function runEditDeleteTests() {
  logTest('Starting Edit & Delete Tests');

  // Note: Edit/Delete endpoints don't exist in current API
  addTestResult(
    'CRUD Operations',
    'Customer Update',
    '1. PUT /api/customers/:id with updated data',
    'Customer should be updated successfully',
    'UPDATE ENDPOINT NOT IMPLEMENTED',
    'FAIL',
    'PUT endpoint for individual customers does not exist',
    'High'
  );

  addTestResult(
    'CRUD Operations',
    'Customer Delete',
    '1. DELETE /api/customers/:id',
    'Customer should be deleted successfully',
    'DELETE ENDPOINT NOT IMPLEMENTED',
    'FAIL',
    'DELETE endpoint for individual customers does not exist',
    'High'
  );
}

async function runSecurityTests() {
  logTest('Starting Security & RBAC Tests');

  // Test unauthorized access
  addTestResult(
    'Security',
    'Authentication Required',
    '1. Access API without authentication',
    'Should require authentication',
    'Manual verification required - Auth system testing needed',
    'PENDING',
    'Requires authentication system analysis',
    'High'
  );

  addTestResult(
    'Security',
    'Role-based Access',
    '1. Test different user roles accessing customer endpoints',
    'Should enforce role-based permissions',
    'Manual verification required - Multi-user testing needed',
    'PENDING',
    'Requires multiple user accounts with different roles',
    'Medium'
  );
}

async function generateReport() {
  logTest('Generating Test Report');

  // Create results directory
  const resultsDir = path.join(__dirname, 'test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  // Generate CSV report
  const csvHeader = 'TestCaseID,Area,TestCase,Steps,Expected,Actual,Status,Priority,Timestamp\n';
  const csvData = testResults.map(result => 
    `"${result.TestCaseID}","${result.Area}","${result.TestCase}","${result.Steps}","${result.Expected}","${result.Actual}","${result.Status}","${result.Priority}","${result.Timestamp}"`
  ).join('\n');
  
  fs.writeFileSync(path.join(resultsDir, 'test-results.csv'), csvHeader + csvData);

  // Generate JSON report with evidence
  fs.writeFileSync(path.join(resultsDir, 'test-results.json'), JSON.stringify(testResults, null, 2));

  // Generate summary
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.Status === 'PASS').length;
  const failedTests = testResults.filter(r => r.Status === 'FAIL').length;
  const pendingTests = testResults.filter(r => r.Status === 'PENDING').length;
  const criticalIssues = testResults.filter(r => r.Status === 'FAIL' && r.Priority === 'Critical').length;
  const highIssues = testResults.filter(r => r.Status === 'FAIL' && r.Priority === 'High').length;

  const summary = `
# Customer Management QA Test Report
Generated: ${new Date().toISOString()}

## Test Summary
- **Total Tests**: ${totalTests}
- **Passed**: ${passedTests}
- **Failed**: ${failedTests}
- **Pending**: ${pendingTests}

## Issue Breakdown
- **Critical Issues**: ${criticalIssues}
- **High Priority Issues**: ${highIssues}
- **Medium Priority Issues**: ${testResults.filter(r => r.Status === 'FAIL' && r.Priority === 'Medium').length}

## Key Findings

### Critical Issues
${testResults.filter(r => r.Status === 'FAIL' && r.Priority === 'Critical').map(r => `- ${r.TestCase}: ${r.Actual}`).join('\n') || 'None'}

### High Priority Issues  
${testResults.filter(r => r.Status === 'FAIL' && r.Priority === 'High').map(r => `- ${r.TestCase}: ${r.Actual}`).join('\n') || 'None'}

### Missing Functionality
${testResults.filter(r => r.Status === 'FAIL' && r.Actual.includes('NOT IMPLEMENTED')).map(r => `- ${r.TestCase}: ${r.Actual}`).join('\n') || 'None'}

## Recommendations
1. Implement PUT /api/customers/:id endpoint for customer updates
2. Implement DELETE /api/customers/:id endpoint for customer deletion
3. Add comprehensive browser automation testing for UI validation
4. Implement audit logging system
5. Add role-based access control testing
`;

  fs.writeFileSync(path.join(resultsDir, 'test-summary.md'), summary);

  logTest(`Test report generated in ${resultsDir}`);
  console.log(summary);
}

// Main test execution
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Customer Management QA Tests');
  console.log('=' .repeat(60));

  try {
    await runEnvironmentTests();
    await runSmokeTests();
    await runValidationTests();
    await runPincodeTests();
    await runCreateWorkflow();
    await runPersistenceTests();
    await runEditDeleteTests();
    await runSecurityTests();
    await generateReport();

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testResults,
  TEST_CUSTOMER
};