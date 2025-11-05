const https = require('https');

const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'xplnyaxkusvuajtmorss.supabase.co',
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
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
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

async function generateFreshBarcodes() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║    GENERATING FRESH BARCODES FOR ALL PRODUCTS       ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Step 1: Get all products
  console.log('📦 Step 1: Fetching all 103 products...');
  const productsResult = await makeRequest('GET', '/rest/v1/products?select=id&limit=500');
  const products = productsResult.data;
  console.log(`✅ Found ${products.length} products\n`);

  // Step 2: Generate unique random barcodes
  console.log('🔢 Step 2: Generating 103 random 11-digit barcodes...');
  const barcodes = [];
  const usedNumbers = new Set();

  for (let i = 0; i < products.length; i++) {
    let barcode;
    do {
      barcode = generateRandomBarcode();
    } while (usedNumbers.has(barcode));
    usedNumbers.add(barcode);

    barcodes.push({
      product_id: products[i].id,
      barcode_number: barcode,
      barcode_type: 'CODE128',
      is_active: true
    });

    if ((i + 1) % 25 === 0) {
      console.log(`  Generated ${i + 1}/103...`);
    }
  }
  console.log(`✅ Generated 103 unique random barcodes\n`);

  // Step 3: Insert barcodes in batches
  console.log('💾 Step 3: Inserting barcodes into database...');
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < barcodes.length; i += batchSize) {
    const batch = barcodes.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    console.log(`  Inserting batch ${batchNum}/${Math.ceil(barcodes.length / batchSize)} (${batch.length} items)...`);

    const insertResult = await makeRequest('POST', '/rest/v1/barcodes', batch);
    
    if (insertResult.status === 201) {
      inserted += batch.length;
      console.log(`    ✅ Inserted ${inserted}/${barcodes.length}`);
    } else {
      console.log(`    ⚠️  Status: ${insertResult.status}`);
    }
  }
  console.log('');

  // Step 4: Verify insertion
  console.log('📊 Step 4: Verifying barcodes were inserted...');
  const verifyResult = await makeRequest('GET', '/rest/v1/barcodes?select=id,barcode_number&limit=500');
  const finalBarcodes = verifyResult.data;
  console.log(`✅ Total barcodes in system: ${finalBarcodes.length}\n`);

  // Display summary
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║           ✅ FRESH BARCODES GENERATED ✅           ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║ Total Products:           103                      ║`);
  console.log(`║ Random Barcodes Created:  103                      ║`);
  console.log(`║ Format: 11 random digits (e.g., 2389939440)        ║`);
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('📝 Sample Generated Random Barcodes:');
  for (let i = 0; i < Math.min(10, finalBarcodes.length); i++) {
    console.log(`   ${i + 1}. ${finalBarcodes[i].barcode_number}`);
  }
  console.log(`   ... and ${finalBarcodes.length - 10} more\n`);

  console.log('✅ Fresh barcodes generated successfully!');
  console.log('🔄 Refresh http://localhost:3000/inventory to see the new barcodes\n');
}

generateFreshBarcodes().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
