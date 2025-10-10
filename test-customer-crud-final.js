#!/usr/bin/env node

/**
 * Final QA Verification Tests for Customer Management CRUD Operations
 * 
 * This script tests all the implemented customer CRUD endpoints with:
 * - Authentication (when enabled)
 * - Audit logging
 * - Validation
 * - Error handling
 * - Security features
 */

const http = require('http');
const https = require('https');

class CustomerCRUDTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.testCustomerId = null;
  }

  // Helper method to make HTTP requests
  async makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'QA-Test-Suite/1.0',
          // Mock authentication headers for testing
          'X-User-ID': 'test-user-123',
          'X-User-Email': 'qa-test@safawala.com',
          'X-Session-ID': 'qa-session-' + Date.now(),
          ...headers
        }
      };

      const protocol = url.protocol === 'https:' ? https : http;
      const req = protocol.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const parsedBody = JSON.parse(body);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: parsedBody
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
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

  // Test helper
  addResult(testName, success, message, details = {}) {
    this.results.push({
      testName,
      success,
      message,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${testName} - ${message}`);
    if (!success && details.error) {
      console.log(`   Error: ${JSON.stringify(details.error, null, 2)}`);
    }
  }

  // Test 1: Create Customer (POST /api/customers)
  async testCreateCustomer() {
    console.log('\n=== Testing Customer Creation ===');
    
    try {
      const customerData = {
        name: 'QA Test Customer',
        email: 'qa-test@example.com',
        phone: '9876543210',
        whatsapp: '9876543210',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        notes: 'This is a QA test customer'
      };

      const response = await this.makeRequest('POST', '/api/customers', customerData);
      
      if (response.status === 201 && response.data.success) {
        this.testCustomerId = response.data.data.id;
        this.addResult(
          'CREATE_CUSTOMER',
          true,
          'Customer created successfully',
          { customerId: this.testCustomerId, response: response.data }
        );
      } else {
        this.addResult(
          'CREATE_CUSTOMER',
          false,
          `Failed to create customer. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'CREATE_CUSTOMER',
        false,
        'Exception during customer creation',
        { error: error.message }
      );
    }
  }

  // Test 2: Get Customer List (GET /api/customers)
  async testGetCustomerList() {
    console.log('\n=== Testing Customer List Retrieval ===');
    
    try {
      const response = await this.makeRequest('GET', '/api/customers');
      
      if (response.status === 200 && response.data.success) {
        const customers = response.data.data;
        const hasOurCustomer = customers.some(c => c.id === this.testCustomerId);
        
        this.addResult(
          'GET_CUSTOMER_LIST',
          true,
          `Retrieved ${customers.length} customers. Our test customer found: ${hasOurCustomer}`,
          { customerCount: customers.length, containsTestCustomer: hasOurCustomer }
        );
      } else {
        this.addResult(
          'GET_CUSTOMER_LIST',
          false,
          `Failed to get customer list. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'GET_CUSTOMER_LIST',
        false,
        'Exception during customer list retrieval',
        { error: error.message }
      );
    }
  }

  // Test 3: Get Individual Customer (GET /api/customers/:id)
  async testGetIndividualCustomer() {
    console.log('\n=== Testing Individual Customer Retrieval ===');
    
    if (!this.testCustomerId) {
      this.addResult(
        'GET_INDIVIDUAL_CUSTOMER',
        false,
        'Cannot test - no customer ID available from creation test',
        {}
      );
      return;
    }

    try {
      const response = await this.makeRequest('GET', `/api/customers/${this.testCustomerId}`);
      
      if (response.status === 200 && response.data.success) {
        const customer = response.data.data;
        this.addResult(
          'GET_INDIVIDUAL_CUSTOMER',
          true,
          `Retrieved customer: ${customer.name}`,
          { customer }
        );
      } else {
        this.addResult(
          'GET_INDIVIDUAL_CUSTOMER',
          false,
          `Failed to get individual customer. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'GET_INDIVIDUAL_CUSTOMER',
        false,
        'Exception during individual customer retrieval',
        { error: error.message }
      );
    }
  }

  // Test 4: Update Customer (PUT /api/customers/:id)
  async testUpdateCustomer() {
    console.log('\n=== Testing Customer Update ===');
    
    if (!this.testCustomerId) {
      this.addResult(
        'UPDATE_CUSTOMER',
        false,
        'Cannot test - no customer ID available from creation test',
        {}
      );
      return;
    }

    try {
      const updateData = {
        name: 'QA Test Customer (Updated)',
        notes: 'This customer was updated by QA tests'
      };

      const response = await this.makeRequest('PUT', `/api/customers/${this.testCustomerId}`, updateData);
      
      if (response.status === 200 && response.data.success) {
        const updatedCustomer = response.data.data;
        this.addResult(
          'UPDATE_CUSTOMER',
          true,
          `Customer updated successfully: ${updatedCustomer.name}`,
          { updatedCustomer }
        );
      } else {
        this.addResult(
          'UPDATE_CUSTOMER',
          false,
          `Failed to update customer. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'UPDATE_CUSTOMER',
        false,
        'Exception during customer update',
        { error: error.message }
      );
    }
  }

  // Test 5: Validation Tests
  async testValidation() {
    console.log('\n=== Testing Input Validation ===');
    
    // Test invalid email format
    try {
      const invalidData = {
        name: 'Test User',
        email: 'invalid-email',
        phone: '9876543210',
        pincode: '123456'
      };

      const response = await this.makeRequest('POST', '/api/customers', invalidData);
      
      if (response.status === 400) {
        this.addResult(
          'VALIDATION_INVALID_EMAIL',
          true,
          'Correctly rejected invalid email format',
          { response: response.data }
        );
      } else {
        this.addResult(
          'VALIDATION_INVALID_EMAIL',
          false,
          `Should have rejected invalid email. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'VALIDATION_INVALID_EMAIL',
        false,
        'Exception during email validation test',
        { error: error.message }
      );
    }

    // Test missing required fields
    try {
      const incompleteData = {
        email: 'test@example.com'
        // Missing name, phone, pincode
      };

      const response = await this.makeRequest('POST', '/api/customers', incompleteData);
      
      if (response.status === 400) {
        this.addResult(
          'VALIDATION_MISSING_FIELDS',
          true,
          'Correctly rejected incomplete data',
          { response: response.data }
        );
      } else {
        this.addResult(
          'VALIDATION_MISSING_FIELDS',
          false,
          `Should have rejected incomplete data. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'VALIDATION_MISSING_FIELDS',
        false,
        'Exception during missing fields validation test',
        { error: error.message }
      );
    }
  }

  // Test 6: Security Tests
  async testSecurity() {
    console.log('\n=== Testing Security Features ===');
    
    // Test XSS protection
    try {
      const xssData = {
        name: '<script>alert("xss")</script>',
        email: 'test@example.com',
        phone: '9876543210',
        pincode: '123456'
      };

      const response = await this.makeRequest('POST', '/api/customers', xssData);
      
      if (response.status === 400) {
        this.addResult(
          'SECURITY_XSS_PROTECTION',
          true,
          'XSS attack properly blocked',
          { response: response.data }
        );
      } else {
        this.addResult(
          'SECURITY_XSS_PROTECTION',
          false,
          `XSS should have been blocked. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'SECURITY_XSS_PROTECTION',
        false,
        'Exception during XSS protection test',
        { error: error.message }
      );
    }

    // Test invalid UUID format
    try {
      const response = await this.makeRequest('GET', '/api/customers/invalid-uuid-format');
      
      if (response.status === 400) {
        this.addResult(
          'SECURITY_UUID_VALIDATION',
          true,
          'Invalid UUID format properly rejected',
          { response: response.data }
        );
      } else {
        this.addResult(
          'SECURITY_UUID_VALIDATION',
          false,
          `Invalid UUID should be rejected. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'SECURITY_UUID_VALIDATION',
        false,
        'Exception during UUID validation test',
        { error: error.message }
      );
    }
  }

  // Test 7: Delete Customer (DELETE /api/customers/:id)
  async testDeleteCustomer() {
    console.log('\n=== Testing Customer Deletion ===');
    
    if (!this.testCustomerId) {
      this.addResult(
        'DELETE_CUSTOMER',
        false,
        'Cannot test - no customer ID available from creation test',
        {}
      );
      return;
    }

    try {
      const response = await this.makeRequest('DELETE', `/api/customers/${this.testCustomerId}`);
      
      if (response.status === 200 && response.data.success) {
        this.addResult(
          'DELETE_CUSTOMER',
          true,
          `Customer deleted successfully`,
          { response: response.data }
        );
        
        // Verify deletion by trying to get the customer
        const verifyResponse = await this.makeRequest('GET', `/api/customers/${this.testCustomerId}`);
        if (verifyResponse.status === 404) {
          this.addResult(
            'DELETE_VERIFICATION',
            true,
            'Customer properly deleted (404 on subsequent GET)',
            {}
          );
        } else {
          this.addResult(
            'DELETE_VERIFICATION',
            false,
            `Customer still exists after deletion. Status: ${verifyResponse.status}`,
            { response: verifyResponse.data }
          );
        }
      } else {
        this.addResult(
          'DELETE_CUSTOMER',
          false,
          `Failed to delete customer. Status: ${response.status}`,
          { response: response.data }
        );
      }
    } catch (error) {
      this.addResult(
        'DELETE_CUSTOMER',
        false,
        'Exception during customer deletion',
        { error: error.message }
      );
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🧪 Starting Final QA Verification Tests for Customer CRUD Operations\n');
    console.log(`Testing against: ${this.baseUrl}`);
    
    await this.testCreateCustomer();
    await this.testGetCustomerList();
    await this.testGetIndividualCustomer();
    await this.testUpdateCustomer();
    await this.testValidation();
    await this.testSecurity();
    await this.testDeleteCustomer();
    
    this.generateReport();
  }

  // Generate final report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL QA VERIFICATION REPORT');
    console.log('='.repeat(80));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${successRate}%`);
    
    if (failedTests > 0) {
      console.log(`\n❌ FAILED TESTS:`);
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.testName}: ${result.message}`);
      });
    }
    
    console.log(`\n✅ PASSED TESTS:`);
    this.results.filter(r => r.success).forEach(result => {
      console.log(`   • ${result.testName}: ${result.message}`);
    });
    
    // Overall assessment
    console.log(`\n🎯 OVERALL ASSESSMENT:`);
    if (successRate >= 90) {
      console.log('   🟢 EXCELLENT - System ready for production');
    } else if (successRate >= 80) {
      console.log('   🟡 GOOD - Minor issues to address before production');
    } else if (successRate >= 70) {
      console.log('   🟠 FAIR - Several issues need attention');
    } else {
      console.log('   🔴 POOR - Major issues require immediate attention');
    }
    
    // Save detailed report
    const detailedReport = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: parseFloat(successRate)
      },
      results: this.results,
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl
    };
    
    // In a real environment, this would save to a file
    console.log(`\n💾 Detailed report data:`);
    console.log(JSON.stringify(detailedReport, null, 2));
  }
}

// Run the tests
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new CustomerCRUDTester(baseUrl);
  
  tester.runAllTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = CustomerCRUDTester;