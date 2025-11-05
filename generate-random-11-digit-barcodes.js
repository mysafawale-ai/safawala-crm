/**
 * Generate Random 11-Digit Barcodes for All Products
 * 
 * Creates truly random 11-digit numbers (not sequential)
 * Examples: 2389939440, 5847302910, 1923847562, etc.
 * 
 * Format: 11 random digits (0-9)
 * Database: barcodes table
 * 
 * Run: node generate-random-11-digit-barcodes.js
 */

const https = require('https')

const SUPABASE_URL = 'https://xplnyaxkusvuajtmorss.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'

/**
 * Query Supabase
 */
function querySupabase(method, path, body = null) {
  return new Promise((resolve, reject) => {
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
 * Generate truly random 11-digit barcode
 * Examples: 2389939440, 5847302910, 1923847562
 */
function generateRandomBarcode() {
  let barcode = ''
  for (let i = 0; i < 11; i++) {
    barcode += Math.floor(Math.random() * 10)
  }
  return barcode
}

/**
 * Check if barcode already exists
 */
async function barcodeExists(barcode, existingBarcodes) {
  return existingBarcodes.has(barcode)
}

/**
 * Main function
 */
async function generateRandomBarcodesForAllProducts() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════╗')
    console.log('║     RANDOM 11-DIGIT BARCODE GENERATION FOR ALL PRODUCTS    ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    // Step 1: Get all products
    console.log('📦 Step 1: Fetching all products from database...')
    const productsRes = await querySupabase('GET', '/rest/v1/products?select=id,name,product_code&limit=1000')
    
    if (productsRes.status !== 200) {
      throw new Error(`Failed to fetch products: ${productsRes.status}`)
    }

    const products = productsRes.data
    console.log(`✅ Found ${products.length} products\n`)

    // Step 2: Delete existing barcodes
    console.log('🗑️  Step 2: Deleting old barcodes from database...')
    const deleteRes = await querySupabase('DELETE', '/rest/v1/barcodes')
    
    if (deleteRes.status !== 204) {
      console.warn(`⚠️  Delete may have had issues (status: ${deleteRes.status}), continuing...`)
    } else {
      console.log(`✅ Old barcodes deleted\n`)
    }

    // Step 3: Generate new random barcodes
    console.log('🔢 Step 3: Generating random 11-digit barcodes...')
    const barcodeInserts = []
    const generatedBarcodes = new Set()
    let attempts = 0
    const maxAttemptsPerProduct = 100

    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      let barcode
      let attemptCount = 0

      // Keep generating until we get a unique one
      do {
        barcode = generateRandomBarcode()
        attemptCount++
        attempts++
      } while (generatedBarcodes.has(barcode) && attemptCount < maxAttemptsPerProduct)

      if (attemptCount >= maxAttemptsPerProduct) {
        console.warn(`⚠️  Could not generate unique barcode after ${maxAttemptsPerProduct} attempts, skipping product`)
        continue
      }

      generatedBarcodes.add(barcode)

      barcodeInserts.push({
        product_id: product.id,
        barcode_number: barcode,
        barcode_type: 'CODE128',
        is_active: true
      })

      if ((i + 1) % 20 === 0) {
        console.log(`  Generated ${i + 1}/${products.length} barcodes...`)
      }
    }

    console.log(`✅ Generated ${barcodeInserts.length} unique random barcodes\n`)

    // Step 4: Insert new barcodes in batches
    console.log('💾 Step 4: Inserting random barcodes into database...')
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
    console.log(`║ Random Barcodes Created:  ${String(barcodeInserts.length).padEnd(43)}║`)
    console.log(`║ Format:                   11 random digits (2389939440)    ║`)
    console.log(`║ Total Uniqueness Checks:  ${String(attempts).padEnd(43)}║`)
    console.log('║                                                            ║')
    console.log('║ ✅ All random barcodes generated and inserted!             ║')
    console.log('╚════════════════════════════════════════════════════════════╝\n')

    // Sample barcodes
    console.log('📝 Sample Generated Random Barcodes:')
    barcodeInserts.slice(0, 10).forEach((b, i) => {
      console.log(`   ${i + 1}. ${b.barcode_number} (Product: ${products[i].name.substring(0, 40)})`)
    })
    if (barcodeInserts.length > 10) {
      console.log(`   ... and ${barcodeInserts.length - 10} more`)
    }
    console.log()

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

// Run the script
generateRandomBarcodesForAllProducts()
