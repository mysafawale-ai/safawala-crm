/**
 * Test Script: Barcode Search v2 API
 * 
 * Run: node test-barcode-search-v2.js
 * 
 * Tests:
 * 1. Search via dedicated barcodes table
 * 2. Fallback search via product_code
 * 3. Verify response structure
 */

const https = require('https')

const SUPABASE_URL = 'https://xplnyaxkusvuajtmorss.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

async function testBarcodeSearch(barcode) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🔍 Testing barcode search for: ${barcode}`)
  console.log('='.repeat(60))

  try {
    // Step 1: Search barcodes table
    console.log('\n📋 Step 1: Searching barcodes table...')
    const barcodeData = await querySupabase('barcodes', {
      select: '*',
      match: { barcode_number: barcode, is_active: true }
    })

    if (barcodeData && barcodeData.length > 0) {
      const barcodeRecord = barcodeData[0]
      console.log(`✅ Found barcode record:`)
      console.log(`   - ID: ${barcodeRecord.id}`)
      console.log(`   - Barcode: ${barcodeRecord.barcode_number}`)
      console.log(`   - Type: ${barcodeRecord.barcode_type}`)
      console.log(`   - Product ID: ${barcodeRecord.product_id}`)

      // Step 2: Get product details
      console.log(`\n📦 Step 2: Fetching product details...`)
      const productData = await querySupabase('products', {
        select: '*',
        match: { id: barcodeRecord.product_id }
      })

      if (productData && productData.length > 0) {
        const product = productData[0]
        console.log(`✅ Found product:`)
        console.log(`   - Name: ${product.name}`)
        console.log(`   - Code: ${product.product_code}`)
        console.log(`   - Price: ₹${product.price}`)
        console.log(`   - Rental: ₹${product.rental_price}`)
        console.log(`   - Stock: ${product.stock_available}`)
        console.log(`   - Category: ${product.category_id}`)
        return { success: true, source: 'barcodes_table', product }
      } else {
        console.log(`❌ Product not found`)
        return { success: false, error: 'Product not found' }
      }
    } else {
      console.log(`⚠️  Barcode not found in barcodes table, trying fallback...`)

      // Fallback: Search product_code
      console.log(`\n📦 Step 2 (Fallback): Searching product_code...`)
      const productData = await querySupabase('products', {
        select: '*',
        match: { product_code: barcode, is_active: true }
      })

      if (productData && productData.length > 0) {
        const product = productData[0]
        console.log(`✅ Found product via product_code:`)
        console.log(`   - Name: ${product.name}`)
        console.log(`   - Code: ${product.product_code}`)
        console.log(`   - Price: ₹${product.price}`)
        console.log(`   - Rental: ₹${product.rental_price}`)
        console.log(`   - Stock: ${product.stock_available}`)
        return { success: true, source: 'product_code', product }
      } else {
        console.log(`❌ Product not found in fallback either`)
        return { success: false, error: 'Barcode not found anywhere' }
      }
    }
  } catch (error) {
    console.error(`❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

function querySupabase(table, options = {}) {
  return new Promise((resolve, reject) => {
    const query = new URLSearchParams()
    
    if (options.select) query.append('select', options.select)
    
    if (options.match) {
      for (const [key, value] of Object.entries(options.match)) {
        query.append(`${key}=eq.${value}`, '')
      }
    }

    const url = `${SUPABASE_URL}/rest/v1/${table}?${query.toString()}`

    https.get(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

async function runAllTests() {
  console.log('\n')
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║         Barcode Search v2 API - Test Suite                 ║')
  console.log('╚════════════════════════════════════════════════════════════╝')

  const testBarcodes = [
    'SAF562036',  // Known barcode
    'INVALID123', // Non-existent
  ]

  const results = []
  for (const barcode of testBarcodes) {
    const result = await testBarcodeSearch(barcode)
    results.push({ barcode, result })
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 Test Summary')
  console.log('='.repeat(60))

  let passed = 0
  let failed = 0

  results.forEach(({ barcode, result }) => {
    const status = result.success ? '✅' : '❌'
    const source = result.source || 'N/A'
    console.log(`${status} ${barcode} (via ${source})`)
    if (result.success) passed++
    else failed++
  })

  console.log(`\n📈 Results: ${passed} passed, ${failed} failed`)
  console.log(`\n✨ All tests completed!\n`)
}

runAllTests().catch(console.error)
