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

async function cleanupOldBarcodes() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║    CLEANUP: Keep only newest barcode per product    ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Step 1: Get all barcodes ordered by product_id and created_at
  console.log('📋 Step 1: Fetching all barcodes...');
  const result = await makeRequest('GET', '/rest/v1/barcodes?order=product_id.asc,created_at.desc&select=id,product_id,barcode_number,created_at&limit=500');
  const allBarcodes = result.data;
  console.log(`✅ Found ${allBarcodes.length} total barcode records\n`);

  // Step 2: Group by product and identify which ones to delete
  console.log('🔍 Step 2: Identifying duplicates...');
  const seenProducts = new Set();
  const toDelete = [];

  allBarcodes.forEach(barcode => {
    if (seenProducts.has(barcode.product_id)) {
      toDelete.push(barcode.id);
    } else {
      seenProducts.add(barcode.product_id);
    }
  });

  console.log(`✅ Found ${toDelete.length} duplicate records to delete\n`);

  if (toDelete.length === 0) {
    console.log('✅ No duplicates found!\n');
    return;
  }

  // Step 3: Delete old barcodes one by one
  console.log('🗑️  Step 3: Deleting old barcodes...');
  for (let i = 0; i < toDelete.length; i++) {
    const id = toDelete[i];
    await makeRequest('DELETE', `/rest/v1/barcodes?id=eq.${id}`);
    if ((i + 1) % 50 === 0) {
      console.log(`  Deleted ${i + 1}/${toDelete.length}...`);
    }
  }
  console.log(`✅ Deleted ${toDelete.length} old barcodes\n`);

  // Step 4: Verify final count
  console.log('📊 Step 4: Verifying cleanup...');
  const verifyResult = await makeRequest('GET', '/rest/v1/barcodes?select=id,product_id,barcode_number&limit=500');
  const finalBarcodes = verifyResult.data;
  console.log(`✅ Final barcode count: ${finalBarcodes.length}\n`);

  // Display results
  if (finalBarcodes.length === 103) {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║              ✅ CLEANUP COMPLETE ✅                ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║ Total Unique Products with Barcodes: 103           ║`);
    console.log('╚════════════════════════════════════════════════════╝\n');

    console.log('📝 Sample Random Barcodes:');
    for (let i = 0; i < Math.min(10, finalBarcodes.length); i++) {
      console.log(`   ${i + 1}. ${finalBarcodes[i].barcode_number}`);
    }
    console.log(`   ... and ${finalBarcodes.length - 10} more\n`);
  } else {
    console.log(`⚠️  Unexpected final count: ${finalBarcodes.length} (expected 103)\n`);
  }

  console.log('🔄 Refresh the inventory page to see the random barcodes!\n');
}

cleanupOldBarcodes().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
