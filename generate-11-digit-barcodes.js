/**
 * Generate 11-Digit Barcodes for All Products
 * 
 * Script to create unique 11-digit barcodes for all products
 * and insert them into the barcodes table
 * 
 * Format: PXXXXXXXXXXXX (P prefix + 11 digits)
 * Example: P00000000001, P00000000002, etc.
 * 
 * Run: node generate-11-digit-barcodes.js
 */

const https = require('https')

const SUPABASE_URL = 'https://xplnyaxkusvuajtmorss.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

/**
 * Query Supabase
 */
function querySupabase(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = `${SUPABASE_URL}${path}`
    
    const options = {
      hostname: 'xplnyaxkusvuajtmorss.supabase.co',
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          })
        }
      })
    })

    req.on('error', reject)
    
    if (body) {
      req.write(JSON.stringify(body))
    }
    
    req.end()
  })
}

/**
 * Generate unique 11-digit barcode
 * Format: PXXXXXXXXXXXX (P + 11 digits = 12 chars total)
 */
function generateBarcode(index) {
  const paddedNumber = String(index + 1).padStart(11, '0')
  return `P${paddedNumber}`
}

/**
 * Main function
 */
async function generateBarcodesForAllProducts() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║     11-DIGIT BARCODE GENERATION FOR ALL PRODUCTS            ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    // Step 1: Get all products
    console.log('📦 Step 1: Fetching all products from database...')
    const productsRes = await querySupabase('GET', '/rest/v1/products?select=id,name,product_code&limit=1000')
    
    if (productsRes.status !== 200) {
      throw new Error(`Failed to fetch products: ${productsRes.status}`)
    }

    const products = productsRes.data
    console.log(`✅ Found ${products.length} products\n`)

    // Step 2: Get existing barcodes to avoid duplicates
    console.log('📋 Step 2: Fetching existing barcodes...')
    const existingRes = await querySupabase('GET', '/rest/v1/barcodes?select=barcode_number&limit=10000')
    
    if (existingRes.status !== 200) {
      throw new Error(`Failed to fetch existing barcodes: ${existingRes.status}`)
    }

    const existingBarcodes = new Set(existingRes.data.map(b => b.barcode_number))
    console.log(`✅ Found ${existingBarcodes.size} existing barcodes\n`)

    // Step 3: Generate new barcodes
    console.log('🔢 Step 3: Generating new 11-digit barcodes...')
    const barcodeInserts = []
    let createdCount = 0
    let skippedCount = 0

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const barcode = generateBarcode(i)

      // Skip if barcode already exists
      if (existingBarcodes.has(barcode)) {
        console.log(`⏭️  Skipping barcode ${barcode} (already exists)`)
        skippedCount++
        continue
      }

      barcodeInserts.push({
        product_id: product.id,
        barcode_number: barcode,
        barcode_type: 'CODE128',
        is_active: true
      })

      createdCount++
      if (createdCount % 10 === 0) {
        console.log(`  Generated ${createdCount} barcodes...`)
      }
    }

    console.log(`✅ Generated ${createdCount} new barcodes\n`)
    console.log(`⏭️  Skipped ${skippedCount} existing barcodes\n`)

    // Step 4: Insert barcodes in batches
    console.log('💾 Step 4: Inserting barcodes into database...')
    const batchSize = 100
    let insertedTotal = 0

    for (let i = 0; i < barcodeInserts.length; i += batchSize) {
      const batch = barcodeInserts.slice(i, i + batchSize)
      
      console.log(`  Inserting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(barcodeInserts.length / batchSize)} (${batch.length} items)...`)

      const insertRes = await querySupabase('POST', '/rest/v1/barcodes', batch)

      if (insertRes.status !== 201) {
        console.error(`❌ Batch insert failed:`, insertRes.data)
        throw new Error(`Failed to insert barcodes: ${insertRes.status}`)
      }

      insertedTotal += batch.length
      console.log(`  ✅ Inserted ${insertedTotal}/${barcodeInserts.length}`)
    }

    // Step 5: Verify insertion
    console.log(`\n📊 Step 5: Verifying barcodes were inserted...`)
    const verifyRes = await querySupabase('GET', '/rest/v1/barcodes?select=count')

    if (verifyRes.status === 200) {
      const totalBarcodes = verifyRes.data[0]?.count || 0
      console.log(`✅ Total barcodes in system: ${totalBarcodes}`)
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║                    ✅ SUCCESS SUMMARY                       ║')
    console.log('╠════════════════════════════════════════════════════════════╣')
    console.log(`║ Total Products:           ${String(products.length).padEnd(43)}║`)
    console.log(`║ New Barcodes Created:     ${String(createdCount).padEnd(43)}║`)
    console.log(`║ Barcodes Skipped:         ${String(skippedCount).padEnd(43)}║`)
    console.log(`║ Format:                   P + 11 digits (P00000000001, etc.) ║`)
    console.log('║                                                            ║')
    console.log('║ ✅ All barcodes generated and inserted successfully!       ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    // Sample barcodes
    console.log('📝 Sample Generated Barcodes:')
    barcodeInserts.slice(0, 5).forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.barcode_number}`)
    })
    if (barcodeInserts.length > 5) {
      console.log(`   ... and ${barcodeInserts.length - 5} more`)
    }
    console.log()

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
generateBarcodesForAllProducts()
