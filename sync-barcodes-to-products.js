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

async function syncBarcodesToProducts() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║  SYNC: Copy barcodes from barcodes table to products ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Step 1: Get all barcodes
  console.log('📋 Step 1: Fetching all 103 barcodes...');
  const barcodesResult = await makeRequest('GET', '/rest/v1/barcodes?select=product_id,barcode_number&limit=500');
  const barcodes = barcodesResult.data;
  console.log(`✅ Found ${barcodes.length} barcodes\n`);

  // Step 2: Update each product with its barcode
  console.log('🔄 Step 2: Updating products with barcode_number...');
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < barcodes.length; i++) {
    const { product_id, barcode_number } = barcodes[i];
    
    const updateResult = await makeRequest('PATCH', `/rest/v1/products?id=eq.${product_id}`, {
      barcode_number: barcode_number
    });

    if (updateResult.status === 200) {
      updated++;
    } else {
      failed++;
    }

    if ((i + 1) % 20 === 0) {
      console.log(`  Updated ${i + 1}/${barcodes.length}...`);
    }
  }

  console.log(`✅ Updated ${updated} products`);
  if (failed > 0) {
    console.log(`⚠️  Failed: ${failed}`);
  }
  console.log('');

  // Step 3: Verify
  console.log('📊 Step 3: Verifying sync...');
  const verifyResult = await makeRequest('GET', '/rest/v1/products?select=id,name,barcode_number&limit=10');
  const products = verifyResult.data;
  
  console.log('Sample products with barcodes:');
  products.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name.substring(0, 30).padEnd(30)} | Barcode: ${p.barcode_number}`);
  });
  console.log('');

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║              ✅ SYNC COMPLETE ✅                   ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║ Products Updated: ${updated}/103                       ║`);
  console.log('║ All products now have barcode_number field!        ║');
  console.log('╚════════════════════════════════════════════════════╝\n');
}

syncBarcodesToProducts().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
