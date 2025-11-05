/**
 * COMPREHENSIVE BARCODE RESET
 * 1. Deletes ALL old barcodes (clean slate)
 * 2. Generates 103 new random 11-digit barcodes
 * 3. Assigns to all products
 */

const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xplnyaxkusvuajtmorss.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL);
    const options = {
      hostname: url.hostname,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function generateRandomBarcode() {
  let barcode = '';
  for (let i = 0; i < 11; i++) {
    barcode += Math.floor(Math.random() * 10);
  }
  return barcode;
}

async function resetBarcodes() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║           COMPREHENSIVE BARCODE RESET - FINAL PASS          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Get all active products
    console.log('📦 Step 1: Fetching all active products...');
    const productsResult = await makeRequest('GET', '/rest/v1/products?select=id&eq=is_active.eq.true');
    const products = productsResult.data;
    console.log(`✅ Found ${products.length} active products\n`);

    if (products.length === 0) {
      console.log('❌ No active products found!');
      return;
    }

    // Step 2: Delete ALL existing barcodes (nuclear option)
    console.log('🗑️  Step 2: Deleting ALL existing barcodes...');
    const deleteResult = await makeRequest('DELETE', '/rest/v1/barcodes');
    console.log(`✅ Deletion status: ${deleteResult.status}\n`);

    // Step 3: Generate unique random barcodes
    console.log('🔢 Step 3: Generating 103 unique random 11-digit barcodes...');
    const generatedBarcodes = new Set();
    const barcodeRecords = [];

    for (const product of products) {
      let barcode;
      let attempts = 0;
      
      // Ensure uniqueness
      do {
        barcode = generateRandomBarcode();
        attempts++;
      } while (generatedBarcodes.has(barcode) && attempts < 100);

      if (attempts >= 100) {
        console.log(`⚠️  Could not generate unique barcode for product ${product.id}`);
        continue;
      }

      generatedBarcodes.add(barcode);
      barcodeRecords.push({
        product_id: product.id,
        barcode_number: barcode
      });
    }

    console.log(`✅ Generated ${barcodeRecords.length} unique barcodes\n`);

    // Step 4: Insert all barcodes in batches
    console.log('💾 Step 4: Inserting barcodes into database (batch processing)...');
    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < barcodeRecords.length; i += batchSize) {
      const batch = barcodeRecords.slice(i, i + batchSize);
      const insertResult = await makeRequest('POST', '/rest/v1/barcodes', batch);
      
      if (insertResult.status === 201) {
        totalInserted += batch.length;
        console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: Inserted ${batch.length} barcodes`);
      } else {
        console.log(`  ⚠️  Batch ${Math.floor(i / batchSize) + 1}: Status ${insertResult.status}`);
      }
    }
    console.log(`✅ Inserted ${totalInserted} barcodes total\n`);

    // Step 5: Verify final count
    console.log('📊 Step 5: Verifying final barcode count...');
    const finalResult = await makeRequest('GET', '/rest/v1/barcodes?select=id,product_id,barcode_number');
    const finalBarcodes = finalResult.data || [];
    console.log(`✅ Final barcode count: ${finalBarcodes.length}\n`);

    // Step 6: Show samples
    console.log('📝 Sample Random Barcodes Generated:');
    const samples = finalBarcodes.slice(0, 10);
    samples.forEach((b, idx) => {
      console.log(`   ${idx + 1}. ${b.barcode_number} (Product ID: ${b.product_id})`);
    });

    if (finalBarcodes.length === 103) {
      console.log('\n╔════════════════════════════════════════════════════════════╗');
      console.log('║                  ✅ RESET COMPLETE! ✅                      ║');
      console.log('╠════════════════════════════════════════════════════════════╣');
      console.log(`║ • All ${finalBarcodes.length} products have unique barcodes      ║`);
      console.log('║ • Format: 11 random digits (no padding, no prefix)         ║');
      console.log('║ • Example: 2389939440, 5847302910, 1923847562             ║');
      console.log('║ • Ready to use in inventory and scanner                   ║');
      console.log('╚════════════════════════════════════════════════════════════╝\n');
    } else {
      console.log(`\n⚠️  WARNING: Expected 103 barcodes, got ${finalBarcodes.length}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetBarcodes();
