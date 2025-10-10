// Test script to verify dropdown functionality
const puppeteer = require('puppeteer')

async function testDropdowns() {
  console.log('🧪 Testing Staff Management Dropdown Functionality')
  console.log('================================================')
  
  try {
    const browser = await puppeteer.launch({ 
      headless: false, // Show browser for visual verification
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
    
    console.log('📱 Navigating to Staff Management page...')
    await page.goto('http://localhost:3001/staff', { 
      waitUntil: 'networkidle2',
      timeout: 10000 
    })
    
    console.log('✅ Page loaded successfully')
    
    // Wait for Add Staff button and click it
    console.log('🔍 Looking for Add Staff Member button...')
    await page.waitForSelector('button:has-text("Add Staff Member")', { timeout: 5000 })
    await page.click('button:has-text("Add Staff Member")')
    
    console.log('✅ Add Staff dialog opened')
    
    // Test Role dropdown
    console.log('🔽 Testing Role dropdown...')
    await page.waitForSelector('[aria-label="Role"]', { timeout: 3000 })
    await page.click('[aria-label="Role"]')
    
    // Wait for dropdown options to appear
    await page.waitForSelector('[role="option"]', { timeout: 3000 })
    const roleOptions = await page.$$eval('[role="option"]', options => 
      options.map(opt => opt.textContent?.trim())
    )
    
    console.log('📋 Role options found:', roleOptions)
    
    // Test Franchise dropdown
    console.log('🔽 Testing Franchise dropdown...')
    await page.click('[aria-label="Franchise"]')
    
    // Wait for franchise options
    await page.waitForSelector('[role="option"]', { timeout: 3000 })
    const franchiseOptions = await page.$$eval('[role="option"]', options => 
      options.map(opt => opt.textContent?.trim())
    )
    
    console.log('🏢 Franchise options found:', franchiseOptions)
    
    // Verification
    const hasRoles = roleOptions.length > 0
    const hasFranchises = franchiseOptions.length > 0
    
    console.log('\n📊 Test Results:')
    console.log(`   Role Dropdown: ${hasRoles ? '✅ WORKING' : '❌ FAILED'}`)
    console.log(`   Franchise Dropdown: ${hasFranchises ? '✅ WORKING' : '❌ FAILED'}`)
    
    if (hasRoles && hasFranchises) {
      console.log('\n🎉 All dropdowns are working correctly!')
    } else {
      console.log('\n⚠️  Some dropdowns may need additional fixes')
    }
    
    await browser.close()
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    // Fallback: Basic connectivity test
    console.log('\n🔄 Attempting basic connectivity test...')
    try {
      const response = await fetch('http://localhost:3001/staff')
      if (response.ok) {
        console.log('✅ Server is running and staff page is accessible')
      } else {
        console.log('⚠️  Server responded but with error:', response.status)
      }
    } catch (fetchError) {
      console.log('❌ Server connectivity issue:', fetchError.message)
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3001/api/staff')
    if (response.ok) {
      console.log('✅ Server is running on port 3001')
      return true
    }
  } catch (error) {
    console.log('⚠️  Server not running on port 3001')
    return false
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer()
  
  if (serverRunning) {
    await testDropdowns()
  } else {
    console.log('💡 Please start the development server with: npm run dev')
    console.log('   Then run this test again')
  }
}

main().catch(console.error)