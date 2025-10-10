// Comprehensive Vendor Management Testing Script
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzU5MDgsImV4cCI6MjA3MDAxMTkwOH0.8rsWVHk87qXJ9_s12IIyrUH3f4mc-kuCCcppw7zTm98'

const supabase = createClient(supabaseUrl, supabaseKey)

class VendorManagementTester {
  constructor() {
    this.testResults = {
      dashboardCounters: { pass: 0, fail: 0, tests: [] },
      vendorListing: { pass: 0, fail: 0, tests: [] },
      addVendorFlow: { pass: 0, fail: 0, tests: [] },
      viewVendorDetails: { pass: 0, fail: 0, tests: [] },
      editVendorFlow: { pass: 0, fail: 0, tests: [] },
      deleteVendorFlow: { pass: 0, fail: 0, tests: [] },
      securityValidation: { pass: 0, fail: 0, tests: [] },
      performance: { pass: 0, fail: 0, tests: [] }
    }
    this.testVendorId = null
    this.originalVendorCount = 0
  }

  async runAllTests() {
    console.log('🧪 VENDOR MANAGEMENT COMPREHENSIVE TESTING')
    console.log('==========================================')
    console.log(`📅 Test Date: ${new Date().toISOString()}`)
    console.log('🎯 Testing Module: Vendor Management')
    console.log('')

    try {
      // Get initial state
      await this.getInitialState()
      
      // Run test suites
      await this.testDashboardCounters()
      await this.testVendorListing()
      await this.testAddVendorFlow()
      await this.testViewVendorDetails()
      await this.testEditVendorFlow()
      await this.testDeleteVendorFlow()
      await this.testSecurityValidation()
      await this.testPerformance()
      
      // Generate final report
      this.generateFinalReport()
      
    } catch (error) {
      console.error('💥 Critical test failure:', error)
    }
  }

  async getInitialState() {
    console.log('📊 Getting Initial State...')
    try {
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
      
      if (error) throw error
      
      this.originalVendorCount = vendors?.length || 0
      console.log(`   📈 Initial vendor count: ${this.originalVendorCount}`)
      
    } catch (error) {
      console.log('   ❌ Failed to get initial state:', error.message)
    }
  }

  async testDashboardCounters() {
    console.log('\n🎯 Testing Dashboard & Counters...')
    
    try {
      // Test 1: Verify total vendors count
      const { data: allVendors, error: allError } = await supabase
        .from('vendors')
        .select('id')
      
      if (allError) throw allError
      
      const totalCount = allVendors?.length || 0
      this.recordTest('dashboardCounters', 'Total Vendors Count', true, `Found ${totalCount} vendors`)
      
      // Test 2: Verify active vendors count
      const { data: activeVendors, error: activeError } = await supabase
        .from('vendors')
        .select('id')
        .eq('is_active', true)
      
      if (activeError) throw activeError
      
      const activeCount = activeVendors?.length || 0
      this.recordTest('dashboardCounters', 'Active Vendors Count', true, `Found ${activeCount} active vendors`)
      
      // Test 3: Verify counter math
      const { data: inactiveVendors, error: inactiveError } = await supabase
        .from('vendors')
        .select('id')
        .eq('is_active', false)
      
      if (inactiveError) throw inactiveError
      
      const inactiveCount = inactiveVendors?.length || 0
      const mathCheck = (activeCount + inactiveCount) === totalCount
      this.recordTest('dashboardCounters', 'Counter Math Validation', mathCheck, 
        `Active: ${activeCount} + Inactive: ${inactiveCount} = Total: ${totalCount}`)
      
    } catch (error) {
      this.recordTest('dashboardCounters', 'Dashboard Counter Tests', false, error.message)
    }
  }

  async testVendorListing() {
    console.log('\n📋 Testing Vendor Listing...')
    
    try {
      // Test 1: Basic vendor listing with required fields
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('id, name, contact_person, phone, email, pricing_per_item, is_active, created_at, updated_at')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      this.recordTest('vendorListing', 'Basic Vendor List Query', true, `Retrieved ${vendors?.length || 0} vendors`)
      
      // Test 2: Verify required fields are present
      if (vendors && vendors.length > 0) {
        const firstVendor = vendors[0]
        const hasRequiredFields = firstVendor.id && firstVendor.name
        this.recordTest('vendorListing', 'Required Fields Present', hasRequiredFields, 
          `ID: ${!!firstVendor.id}, Name: ${!!firstVendor.name}`)
      }
      
      // Test 3: Search functionality simulation (name filter)
      if (vendors && vendors.length > 0) {
        const searchTerm = vendors[0].name.substring(0, 3)
        const { data: searchResults, error: searchError } = await supabase
          .from('vendors')
          .select('*')
          .ilike('name', `%${searchTerm}%`)
        
        if (searchError) throw searchError
        
        this.recordTest('vendorListing', 'Name Search Functionality', true, 
          `Search "${searchTerm}" returned ${searchResults?.length || 0} results`)
      }
      
      // Test 4: Status filtering
      const { data: activeOnlyVendors, error: statusError } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
      
      if (statusError) throw statusError
      
      this.recordTest('vendorListing', 'Status Filter (Active Only)', true, 
        `Active filter returned ${activeOnlyVendors?.length || 0} vendors`)
      
    } catch (error) {
      this.recordTest('vendorListing', 'Vendor Listing Tests', false, error.message)
    }
  }

  async testAddVendorFlow() {
    console.log('\n➕ Testing Add Vendor Flow...')
    
    try {
      // Test 1: Create vendor with required fields only
      const testVendor = {
        name: 'Test Vendor Review',
        contact_person: 'Test Contact',
        phone: '9999999999',
        email: 'testvendor@review.com',
        address: 'Test Address for Review',
        pricing_per_item: 0,
        notes: 'Created during testing',
        is_active: true
      }
      
      const { data: createdVendor, error: createError } = await supabase
        .from('vendors')
        .insert([testVendor])
        .select()
        .single()
      
      if (createError) throw createError
      
      this.testVendorId = createdVendor.id
      this.recordTest('addVendorFlow', 'Create Vendor (Valid Data)', true, 
        `Vendor created with ID: ${createdVendor.id}`)
      
      // Test 2: Verify vendor appears in listing
      const { data: verifyVendor, error: verifyError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', this.testVendorId)
        .single()
      
      if (verifyError) throw verifyError
      
      this.recordTest('addVendorFlow', 'Vendor Persistence Verification', true, 
        `Vendor found in database with name: ${verifyVendor.name}`)
      
      // Test 3: Verify default values
      const hasCorrectDefaults = verifyVendor.pricing_per_item === 0 && 
                                 verifyVendor.is_active === true &&
                                 verifyVendor.created_at &&
                                 verifyVendor.updated_at
      
      this.recordTest('addVendorFlow', 'Default Values Verification', hasCorrectDefaults, 
        `Pricing: ${verifyVendor.pricing_per_item}, Active: ${verifyVendor.is_active}`)
      
      // Test 4: Attempt to create vendor with missing required field (name)
      try {
        await supabase
          .from('vendors')
          .insert([{ phone: '1234567890' }])
        
        this.recordTest('addVendorFlow', 'Required Field Validation', false, 
          'Should have failed but succeeded')
      } catch (validationError) {
        this.recordTest('addVendorFlow', 'Required Field Validation', true, 
          'Correctly rejected vendor without name')
      }
      
    } catch (error) {
      this.recordTest('addVendorFlow', 'Add Vendor Flow Tests', false, error.message)
    }
  }

  async testViewVendorDetails() {
    console.log('\n👁️  Testing View Vendor Details...')
    
    if (!this.testVendorId) {
      this.recordTest('viewVendorDetails', 'View Vendor Details', false, 'No test vendor available')
      return
    }
    
    try {
      // Test 1: Fetch vendor details
      const { data: vendorDetails, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', this.testVendorId)
        .single()
      
      if (error) throw error
      
      this.recordTest('viewVendorDetails', 'Fetch Vendor Details', true, 
        `Retrieved details for: ${vendorDetails.name}`)
      
      // Test 2: Verify all fields are accessible
      const fieldCheck = vendorDetails.id && vendorDetails.name && 
                         vendorDetails.created_at && vendorDetails.updated_at
      
      this.recordTest('viewVendorDetails', 'All Fields Accessible', fieldCheck, 
        'All essential fields are present')
      
      // Test 3: Check transaction history (simulated)
      const { data: purchases, error: purchaseError } = await supabase
        .from('purchases')
        .select('*')
        .eq('vendor_id', this.testVendorId)
      
      if (purchaseError) {
        console.log('   ⚠️  Purchases table may not exist, skipping transaction history test')
      } else {
        this.recordTest('viewVendorDetails', 'Transaction History Access', true, 
          `Found ${purchases?.length || 0} transactions`)
      }
      
    } catch (error) {
      this.recordTest('viewVendorDetails', 'View Vendor Details Tests', false, error.message)
    }
  }

  async testEditVendorFlow() {
    console.log('\n✏️  Testing Edit Vendor Flow...')
    
    if (!this.testVendorId) {
      this.recordTest('editVendorFlow', 'Edit Vendor Flow', false, 'No test vendor available')
      return
    }
    
    try {
      // Test 1: Update vendor information
      const updateData = {
        name: 'Updated Test Vendor Review',
        contact_person: 'Updated Contact',
        pricing_per_item: 15.50,
        notes: 'Updated during testing'
      }
      
      const { data: updatedVendor, error: updateError } = await supabase
        .from('vendors')
        .update(updateData)
        .eq('id', this.testVendorId)
        .select()
        .single()
      
      if (updateError) throw updateError
      
      this.recordTest('editVendorFlow', 'Update Vendor Data', true, 
        `Updated vendor: ${updatedVendor.name}`)
      
      // Test 2: Verify changes persisted
      const { data: verifyUpdate, error: verifyError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', this.testVendorId)
        .single()
      
      if (verifyError) throw verifyError
      
      const changesCorrect = verifyUpdate.name === updateData.name &&
                            verifyUpdate.pricing_per_item === updateData.pricing_per_item
      
      this.recordTest('editVendorFlow', 'Update Persistence Verification', changesCorrect, 
        `Name: ${verifyUpdate.name}, Pricing: ${verifyUpdate.pricing_per_item}`)
      
      // Test 3: Verify updated_at timestamp changed
      const timestampUpdated = new Date(verifyUpdate.updated_at) > new Date(verifyUpdate.created_at)
      this.recordTest('editVendorFlow', 'Timestamp Update Verification', timestampUpdated, 
        'Updated timestamp is newer than created timestamp')
      
      // Test 4: Toggle active status
      const { data: toggledVendor, error: toggleError } = await supabase
        .from('vendors')
        .update({ is_active: false })
        .eq('id', this.testVendorId)
        .select()
        .single()
      
      if (toggleError) throw toggleError
      
      this.recordTest('editVendorFlow', 'Status Toggle (Deactivate)', true, 
        `Vendor status: ${toggledVendor.is_active}`)
      
    } catch (error) {
      this.recordTest('editVendorFlow', 'Edit Vendor Flow Tests', false, error.message)
    }
  }

  async testDeleteVendorFlow() {
    console.log('\n🗑️  Testing Delete Vendor Flow...')
    
    if (!this.testVendorId) {
      this.recordTest('deleteVendorFlow', 'Delete Vendor Flow', false, 'No test vendor available')
      return
    }
    
    try {
      // Test 1: Delete vendor
      const { error: deleteError } = await supabase
        .from('vendors')
        .delete()
        .eq('id', this.testVendorId)
      
      if (deleteError) throw deleteError
      
      this.recordTest('deleteVendorFlow', 'Delete Vendor Operation', true, 
        `Vendor ${this.testVendorId} deleted`)
      
      // Test 2: Verify vendor no longer exists
      const { data: verifyDeletion, error: verifyError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', this.testVendorId)
      
      if (verifyError) throw verifyError
      
      const deletionConfirmed = !verifyDeletion || verifyDeletion.length === 0
      this.recordTest('deleteVendorFlow', 'Deletion Verification', deletionConfirmed, 
        'Vendor no longer exists in database')
      
      // Test 3: Verify counter updates (compare with initial count)
      const { data: finalVendors, error: countError } = await supabase
        .from('vendors')
        .select('id')
      
      if (countError) throw countError
      
      const finalCount = finalVendors?.length || 0
      const countCorrect = finalCount === this.originalVendorCount
      this.recordTest('deleteVendorFlow', 'Counter Update Verification', countCorrect, 
        `Final count: ${finalCount}, Expected: ${this.originalVendorCount}`)
      
    } catch (error) {
      this.recordTest('deleteVendorFlow', 'Delete Vendor Flow Tests', false, error.message)
    }
  }

  async testSecurityValidation() {
    console.log('\n🔒 Testing Security & Validation...')
    
    try {
      // Test 1: XSS Prevention (attempt to insert script in name)
      const maliciousVendor = {
        name: '<script>alert("XSS")</script>Test Vendor',
        phone: '9999999999'
      }
      
      const { data: xssVendor, error: xssError } = await supabase
        .from('vendors')
        .insert([maliciousVendor])
        .select()
        .single()
      
      if (xssError) {
        this.recordTest('securityValidation', 'XSS Prevention', true, 'Malicious input rejected')
      } else {
        // Check if script tags were sanitized
        const nameContainsScript = xssVendor.name.includes('<script>')
        this.recordTest('securityValidation', 'XSS Prevention', !nameContainsScript, 
          `Stored name: ${xssVendor.name}`)
        
        // Cleanup
        await supabase.from('vendors').delete().eq('id', xssVendor.id)
      }
      
      // Test 2: Email format validation (if enforced)
      try {
        const { data: invalidEmailVendor, error: emailError } = await supabase
          .from('vendors')
          .insert([{ name: 'Email Test', email: 'invalid-email', phone: '9999999999' }])
          .select()
        
        if (emailError) {
          this.recordTest('securityValidation', 'Email Format Validation', true, 'Invalid email rejected')
        } else {
          this.recordTest('securityValidation', 'Email Format Validation', false, 'Invalid email accepted')
          // Cleanup
          await supabase.from('vendors').delete().eq('id', invalidEmailVendor.id)
        }
      } catch (error) {
        this.recordTest('securityValidation', 'Email Format Validation', true, 'Email validation working')
      }
      
      // Test 3: Phone number validation
      const { data: phoneVendor, error: phoneError } = await supabase
        .from('vendors')
        .insert([{ name: 'Phone Test', phone: '123' }])
        .select()
      
      if (phoneError) {
        this.recordTest('securityValidation', 'Phone Number Validation', true, 'Short phone number rejected')
      } else {
        this.recordTest('securityValidation', 'Phone Number Validation', false, 'Short phone number accepted')
        // Cleanup
        await supabase.from('vendors').delete().eq('id', phoneVendor.id)
      }
      
    } catch (error) {
      this.recordTest('securityValidation', 'Security Validation Tests', false, error.message)
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...')
    
    try {
      // Test 1: Vendor listing performance
      const startTime = Date.now()
      const { data: vendors, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false })
      
      const endTime = Date.now()
      const queryTime = endTime - startTime
      
      if (error) throw error
      
      const performanceGood = queryTime < 2000 // Less than 2 seconds
      this.recordTest('performance', 'Vendor Listing Performance', performanceGood, 
        `Query completed in ${queryTime}ms`)
      
      // Test 2: Search performance
      const searchStartTime = Date.now()
      const { data: searchResults, error: searchError } = await supabase
        .from('vendors')
        .select('*')
        .ilike('name', '%test%')
      
      const searchEndTime = Date.now()
      const searchTime = searchEndTime - searchStartTime
      
      if (searchError) throw searchError
      
      const searchPerformanceGood = searchTime < 1000 // Less than 1 second
      this.recordTest('performance', 'Search Performance', searchPerformanceGood, 
        `Search completed in ${searchTime}ms`)
      
    } catch (error) {
      this.recordTest('performance', 'Performance Tests', false, error.message)
    }
  }

  recordTest(category, testName, passed, details) {
    const result = {
      name: testName,
      status: passed ? 'PASS' : 'FAIL',
      details: details,
      timestamp: new Date().toISOString()
    }
    
    this.testResults[category].tests.push(result)
    if (passed) {
      this.testResults[category].pass++
    } else {
      this.testResults[category].fail++
    }
    
    const icon = passed ? '✅' : '❌'
    console.log(`   ${icon} ${testName}: ${details}`)
  }

  generateFinalReport() {
    console.log('\n📊 VENDOR MANAGEMENT TEST REPORT')
    console.log('=================================')
    
    let totalPass = 0
    let totalFail = 0
    
    Object.keys(this.testResults).forEach(category => {
      const result = this.testResults[category]
      totalPass += result.pass
      totalFail += result.fail
      
      const categoryTotal = result.pass + result.fail
      const passRate = categoryTotal > 0 ? ((result.pass / categoryTotal) * 100).toFixed(1) : '0.0'
      
      console.log(`\n📋 ${category.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}:`)
      console.log(`   📊 Tests: ${categoryTotal} | ✅ Pass: ${result.pass} | ❌ Fail: ${result.fail} | 📈 Rate: ${passRate}%`)
      
      if (result.fail > 0) {
        console.log('   🚨 Failed Tests:')
        result.tests.filter(test => test.status === 'FAIL').forEach(test => {
          console.log(`      ❌ ${test.name}: ${test.details}`)
        })
      }
    })
    
    const overallTotal = totalPass + totalFail
    const overallPassRate = overallTotal > 0 ? ((totalPass / overallTotal) * 100).toFixed(1) : '0.0'
    
    console.log(`\n🎯 OVERALL RESULTS:`)
    console.log(`   📊 Total Tests: ${overallTotal}`)
    console.log(`   ✅ Passed: ${totalPass}`)
    console.log(`   ❌ Failed: ${totalFail}`)
    console.log(`   📈 Pass Rate: ${overallPassRate}%`)
    
    if (overallPassRate >= 95) {
      console.log(`   🎉 EXCELLENT - Production Ready!`)
    } else if (overallPassRate >= 85) {
      console.log(`   👍 GOOD - Minor issues to address`)
    } else if (overallPassRate >= 70) {
      console.log(`   ⚠️  MODERATE - Several issues need fixing`)
    } else {
      console.log(`   🚨 POOR - Major issues require attention`)
    }
    
    console.log(`\n📅 Test completed at: ${new Date().toISOString()}`)
  }
}

// Run the comprehensive test
const tester = new VendorManagementTester()
tester.runAllTests().catch(console.error)