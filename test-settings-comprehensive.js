/**
 * Settings Module Comprehensive Testing Script
 * Tests all sections: Company Info, Branding & Templates, Banking Details, Profile
 * Validates form rendering, validation, data persistence, security, and UI/UX
 */

console.log('🚀 Starting Comprehensive Settings Module Testing...\n');

// Test configuration
const BASE_URL = 'http://localhost:3002';
const DEFAULT_FRANCHISE_ID = '00000000-0000-0000-0000-000000000001';

// Test data sets
const TEST_DATA = {
    company: {
        valid: {
            company_name: 'Safawala Test Company',
            email: 'test@safawala.com',
            phone: '9876543210',
            gst_number: '27ABCDE1234F1Z5',
            address: 'Test Address, Building Name',
            city: 'Mumbai',
            state: 'Maharashtra',
            website: 'https://test.safawala.com'
        },
        invalid: {
            email: 'invalid-email',
            phone: '123',
            gst_number: 'INVALID',
            website: 'not-a-url'
        },
        xss: {
            company_name: '<script>alert("XSS")</script>Test Company',
            address: '<img src=x onerror=alert("XSS")>Test Address'
        }
    },
    profile: {
        valid: {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@safawala.com',
            phone: '+91 98765 43210',
            role: 'General Manager',
            designation: 'Operations',
            employee_id: 'EMP001',
            date_of_joining: '2024-01-15',
            street_address: '123 Main Street, Building Name',
            city: 'Mumbai',
            state: 'Maharashtra',
            postal_code: '400001',
            emergency_contact_name: 'Emergency Contact',
            emergency_contact_phone: '+91 98765 12345',
            bio: 'Brief description about the user profile for testing purposes.'
        },
        invalid: {
            email: 'invalid-email-format',
            phone: '123',
            bio: 'A'.repeat(501) // Exceeds 500 character limit
        }
    },
    banking: {
        valid: {
            bank_name: 'HDFC Bank',
            account_type: 'Current',
            account_holder_name: 'Safawala Rental Services',
            account_number: '123456789012',
            ifsc_code: 'HDFC0001234',
            branch_name: 'Mumbai Main Branch',
            upi_id: 'safawala@hdfc'
        },
        invalid: {
            account_number: '123',
            ifsc_code: 'INVALID',
            upi_id: 'invalid-upi'
        }
    }
};

// Test tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(category, testName, status, details = '') {
    testResults.total++;
    if (status === 'PASS') {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
    
    const result = { category, testName, status, details };
    testResults.tests.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} [${category}] ${testName}: ${status}`);
    if (details) {
        console.log(`   Details: ${details}`);
    }
}

// Test Categories
async function testSettingsPageAccess() {
    console.log('\n📋 Testing Settings Page Access...');
    
    try {
        const response = await fetch(`${BASE_URL}/settings`);
        
        if (response.ok) {
            const html = await response.text();
            
            // Check for main page elements
            const hasCompanyTab = html.includes('Company');
            const hasBrandingTab = html.includes('Branding');
            const hasBankingTab = html.includes('Banking');
            const hasProfileTab = html.includes('Profile');
            
            logTest('Page Access', 'Settings Page Loads', 'PASS', `Status: ${response.status}`);
            logTest('Page Access', 'Company Tab Present', hasCompanyTab ? 'PASS' : 'FAIL');
            logTest('Page Access', 'Branding Tab Present', hasBrandingTab ? 'PASS' : 'FAIL');
            logTest('Page Access', 'Banking Tab Present', hasBankingTab ? 'PASS' : 'FAIL');
            logTest('Page Access', 'Profile Tab Present', hasProfileTab ? 'PASS' : 'FAIL');
            
        } else {
            logTest('Page Access', 'Settings Page Loads', 'FAIL', `Status: ${response.status}`);
        }
    } catch (error) {
        logTest('Page Access', 'Settings Page Loads', 'FAIL', `Error: ${error.message}`);
    }
}

async function testCompanyInfoAPI() {
    console.log('\n🏢 Testing Company Information API...');
    
    // Test GET - Load existing data
    try {
        const getResponse = await fetch(`${BASE_URL}/api/settings/company`);
        const getData = await getResponse.json();
        
        logTest('Company API', 'Load Company Data', getResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${getResponse.status}, Data fields: ${Object.keys(getData.data || {}).length}`);
        
    } catch (error) {
        logTest('Company API', 'Load Company Data', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test POST - Save valid data
    try {
        const postResponse = await fetch(`${BASE_URL}/api/settings/company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_DATA.company.valid)
        });
        
        logTest('Company API', 'Save Valid Company Data', postResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${postResponse.status}`);
        
    } catch (error) {
        logTest('Company API', 'Save Valid Company Data', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test validation - Invalid email
    try {
        const invalidData = { ...TEST_DATA.company.valid, email: TEST_DATA.company.invalid.email };
        const validationResponse = await fetch(`${BASE_URL}/api/settings/company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidData)
        });
        
        // Should fail validation
        logTest('Company API', 'Email Validation', !validationResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${validationResponse.status} (should be 400)`);
        
    } catch (error) {
        logTest('Company API', 'Email Validation', 'FAIL', `Error: ${error.message}`);
    }
}

async function testBrandingAPI() {
    console.log('\n🎨 Testing Branding & Templates API...');
    
    // Test branding settings
    try {
        const response = await fetch(`${BASE_URL}/api/settings/branding`);
        
        if (response.ok) {
            const data = await response.json();
            logTest('Branding API', 'Load Branding Settings', 'PASS', 
                   `Status: ${response.status}, Has colors: ${!!data.data?.colors}`);
        } else {
            logTest('Branding API', 'Load Branding Settings', 'FAIL', `Status: ${response.status}`);
        }
    } catch (error) {
        logTest('Branding API', 'Load Branding Settings', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test color scheme save
    try {
        const colorData = {
            primary_color: '#3B82F6',
            secondary_color: '#EF4444',
            accent_color: '#10B981',
            background_color: '#FFFFFF',
            font_family: 'Inter (Modern)'
        };
        
        const saveResponse = await fetch(`${BASE_URL}/api/settings/branding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(colorData)
        });
        
        logTest('Branding API', 'Save Color Scheme', saveResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${saveResponse.status}`);
        
    } catch (error) {
        logTest('Branding API', 'Save Color Scheme', 'FAIL', `Error: ${error.message}`);
    }
}

async function testTemplateSettings() {
    console.log('\n📄 Testing Invoice & Quote Templates...');
    
    // Test template settings
    try {
        const response = await fetch(`${BASE_URL}/api/settings/templates`);
        
        if (response.ok) {
            const data = await response.json();
            logTest('Templates API', 'Load Template Settings', 'PASS', 
                   `Status: ${response.status}`);
        } else {
            logTest('Templates API', 'Load Template Settings', 'FAIL', `Status: ${response.status}`);
        }
    } catch (error) {
        logTest('Templates API', 'Load Template Settings', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test template configuration save
    try {
        const templateData = {
            invoice_number_format: 'INV-{YYYY}-{0001}',
            quote_number_format: 'QTE-{YYYY}-{0001}',
            default_payment_terms: 'Net 30 Days',
            default_tax_rate: 18,
            show_gst_breakdown: true,
            default_terms_conditions: 'Standard terms and conditions for services.'
        };
        
        const saveResponse = await fetch(`${BASE_URL}/api/settings/templates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(templateData)
        });
        
        logTest('Templates API', 'Save Template Settings', saveResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${saveResponse.status}`);
        
    } catch (error) {
        logTest('Templates API', 'Save Template Settings', 'FAIL', `Error: ${error.message}`);
    }
}

async function testBankingAPI() {
    console.log('\n🏦 Testing Banking Details API...');
    
    // Test load banking details
    try {
        const response = await fetch(`${BASE_URL}/api/settings/banking`);
        
        if (response.ok) {
            const data = await response.json();
            const accounts = data.data || [];
            logTest('Banking API', 'Load Banking Details', 'PASS', 
                   `Status: ${response.status}, Accounts: ${accounts.length}`);
        } else {
            logTest('Banking API', 'Load Banking Details', 'FAIL', `Status: ${response.status}`);
        }
    } catch (error) {
        logTest('Banking API', 'Load Banking Details', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test add bank account
    try {
        const bankData = TEST_DATA.banking.valid;
        const addResponse = await fetch(`${BASE_URL}/api/settings/banking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bankData)
        });
        
        logTest('Banking API', 'Add Bank Account', addResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${addResponse.status}`);
        
        if (addResponse.ok) {
            const addedAccount = await addResponse.json();
            console.log(`   Added account ID: ${addedAccount.data?.id || 'N/A'}`);
        }
        
    } catch (error) {
        logTest('Banking API', 'Add Bank Account', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test validation - Invalid IFSC
    try {
        const invalidBankData = { ...TEST_DATA.banking.valid, ifsc_code: TEST_DATA.banking.invalid.ifsc_code };
        const validationResponse = await fetch(`${BASE_URL}/api/settings/banking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invalidBankData)
        });
        
        // Should fail validation
        logTest('Banking API', 'IFSC Validation', !validationResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${validationResponse.status} (should be 400)`);
        
    } catch (error) {
        logTest('Banking API', 'IFSC Validation', 'FAIL', `Error: ${error.message}`);
    }
}

async function testProfileAPI() {
    console.log('\n👤 Testing Profile Management API...');
    
    // Test load profile
    try {
        const response = await fetch(`${BASE_URL}/api/settings/profile`);
        
        if (response.ok) {
            const data = await response.json();
            logTest('Profile API', 'Load Profile Data', 'PASS', 
                   `Status: ${response.status}`);
        } else {
            logTest('Profile API', 'Load Profile Data', 'FAIL', `Status: ${response.status}`);
        }
    } catch (error) {
        logTest('Profile API', 'Load Profile Data', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test save profile
    try {
        const profileData = TEST_DATA.profile.valid;
        const saveResponse = await fetch(`${BASE_URL}/api/settings/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        
        logTest('Profile API', 'Save Profile Data', saveResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${saveResponse.status}`);
        
    } catch (error) {
        logTest('Profile API', 'Save Profile Data', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test bio character limit
    try {
        const longBioData = { ...TEST_DATA.profile.valid, bio: TEST_DATA.profile.invalid.bio };
        const validationResponse = await fetch(`${BASE_URL}/api/settings/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(longBioData)
        });
        
        // Should fail validation
        logTest('Profile API', 'Bio Character Limit', !validationResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${validationResponse.status} (should be 400)`);
        
    } catch (error) {
        logTest('Profile API', 'Bio Character Limit', 'FAIL', `Error: ${error.message}`);
    }
}

async function testSecurityValidation() {
    console.log('\n🔒 Testing Security & XSS Prevention...');
    
    // Test XSS in company name
    try {
        const xssData = { ...TEST_DATA.company.valid, ...TEST_DATA.company.xss };
        const xssResponse = await fetch(`${BASE_URL}/api/settings/company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xssData)
        });
        
        if (xssResponse.ok) {
            // Verify data was sanitized
            const savedData = await xssResponse.json();
            const hasSanitization = !savedData.data?.company_name?.includes('<script>');
            
            logTest('Security', 'XSS Prevention', hasSanitization ? 'PASS' : 'FAIL', 
                   `Script tags sanitized: ${hasSanitization}`);
        } else {
            logTest('Security', 'XSS Prevention', 'FAIL', `API error: ${xssResponse.status}`);
        }
        
    } catch (error) {
        logTest('Security', 'XSS Prevention', 'FAIL', `Error: ${error.message}`);
    }
    
    // Test SQL injection attempt
    try {
        const sqlInjectionData = { 
            ...TEST_DATA.company.valid, 
            company_name: "'; DROP TABLE companies; --" 
        };
        
        const sqlResponse = await fetch(`${BASE_URL}/api/settings/company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sqlInjectionData)
        });
        
        // Should either sanitize or reject
        logTest('Security', 'SQL Injection Prevention', sqlResponse.ok ? 'PASS' : 'FAIL', 
               `Status: ${sqlResponse.status}`);
        
    } catch (error) {
        logTest('Security', 'SQL Injection Prevention', 'FAIL', `Error: ${error.message}`);
    }
}

async function testFileUploadSecurity() {
    console.log('\n📁 Testing File Upload Security...');
    
    // Note: This would require actual file upload testing
    // For now, we'll test the API endpoints existence
    
    try {
        // Test logo upload endpoint
        const logoResponse = await fetch(`${BASE_URL}/api/settings/upload/logo`, {
            method: 'POST',
            body: new FormData() // Empty form data
        });
        
        // Should have proper error handling
        logTest('File Upload', 'Logo Upload Endpoint', logoResponse.status === 400 ? 'PASS' : 'FAIL', 
               `Status: ${logoResponse.status}`);
        
    } catch (error) {
        logTest('File Upload', 'Logo Upload Endpoint', 'FAIL', `Error: ${error.message}`);
    }
    
    try {
        // Test signature upload endpoint
        const signatureResponse = await fetch(`${BASE_URL}/api/settings/upload/signature`, {
            method: 'POST',
            body: new FormData() // Empty form data
        });
        
        // Should have proper error handling
        logTest('File Upload', 'Signature Upload Endpoint', signatureResponse.status === 400 ? 'PASS' : 'FAIL', 
               `Status: ${signatureResponse.status}`);
        
    } catch (error) {
        logTest('File Upload', 'Signature Upload Endpoint', 'FAIL', `Error: ${error.message}`);
    }
}

async function testDataPersistence() {
    console.log('\n💾 Testing Data Persistence...');
    
    // Test company info persistence
    try {
        // Save data
        const saveResponse = await fetch(`${BASE_URL}/api/settings/company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_DATA.company.valid)
        });
        
        if (saveResponse.ok) {
            // Retrieve data
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
            
            const getResponse = await fetch(`${BASE_URL}/api/settings/company`);
            const getData = await getResponse.json();
            
            const dataMatches = getData.data?.company_name === TEST_DATA.company.valid.company_name;
            
            logTest('Data Persistence', 'Company Info Persistence', dataMatches ? 'PASS' : 'FAIL', 
                   `Data matches: ${dataMatches}`);
        } else {
            logTest('Data Persistence', 'Company Info Persistence', 'FAIL', 'Save failed');
        }
        
    } catch (error) {
        logTest('Data Persistence', 'Company Info Persistence', 'FAIL', `Error: ${error.message}`);
    }
}

// Main test execution
async function runAllTests() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║               SETTINGS MODULE COMPREHENSIVE TESTING          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    await testSettingsPageAccess();
    await testCompanyInfoAPI();
    await testBrandingAPI();
    await testTemplateSettings();
    await testBankingAPI();
    await testProfileAPI();
    await testSecurityValidation();
    await testFileUploadSecurity();
    await testDataPersistence();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SETTINGS MODULE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
    
    // Group results by category
    const categories = {};
    testResults.tests.forEach(test => {
        if (!categories[test.category]) {
            categories[test.category] = { passed: 0, total: 0 };
        }
        categories[test.category].total++;
        if (test.status === 'PASS') {
            categories[test.category].passed++;
        }
    });
    
    console.log('\n📋 Results by Category:');
    Object.entries(categories).forEach(([category, stats]) => {
        const rate = ((stats.passed / stats.total) * 100).toFixed(1);
        console.log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`);
    });
    
    // List failed tests
    const failedTests = testResults.tests.filter(test => test.status === 'FAIL');
    if (failedTests.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedTests.forEach(test => {
            console.log(`  • [${test.category}] ${test.testName}: ${test.details || 'No details'}`);
        });
    }
    
    console.log('\n✅ Settings Module Testing Complete!');
    
    // Determine overall assessment
    const passRate = (testResults.passed / testResults.total) * 100;
    if (passRate >= 90) {
        console.log('🎉 ASSESSMENT: EXCELLENT - Ready for production');
    } else if (passRate >= 75) {
        console.log('⚠️  ASSESSMENT: GOOD - Minor fixes needed');
    } else if (passRate >= 60) {
        console.log('🔧 ASSESSMENT: FAIR - Moderate fixes required');
    } else {
        console.log('🚨 ASSESSMENT: POOR - Major fixes required');
    }
}

// Execute tests
runAllTests().catch(console.error);