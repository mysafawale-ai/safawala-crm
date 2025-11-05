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

async function freshStart() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   FRESH START - DELETE BARCODES, KEEP PRODUCTS      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Step 1: Check products count
  console.log('📦 Step 1: Checking products...');
  const productsResult = await makeRequest('GET', '/rest/v1/products?select=id&limit=500');
  const productsCount = productsResult.data ? productsResult.data.length : 0;
  console.log(`✅ Found ${productsCount} products (keeping all)\n`);

  // Step 2: Delete all barcodes
  console.log('🗑️  Step 2: Deleting all barcodes...');
  const barcodesResult = await makeRequest('GET', '/rest/v1/barcodes?select=id&limit=500');
  const barcodesCount = barcodesResult.data ? barcodesResult.data.length : 0;
  
  if (barcodesCount > 0) {
    const deleteBarcodesResult = await makeRequest('DELETE', '/rest/v1/barcodes');
    console.log(`✅ Deleted ${barcodesCount} barcode records (Status: ${deleteBarcodesResult.status})\n`);
  } else {
    console.log('✅ Barcodes table already empty\n');
  }

  // Step 3: Clear barcode fields in products table
  console.log('� Step 3: Clearing barcode fields in products...');
  const updateResult = await makeRequest('PATCH', '/rest/v1/products', {
    barcode: null,
    barcode_number: null,
    alternate_barcode_1: null,
    alternate_barcode_2: null
  });
  console.log(`✅ Cleared barcode fields (Status: ${updateResult.status})\n`);

  // Step 4: Verify cleanup
  console.log('📊 Step 4: Verifying cleanup...');
  const verifyProducts = await makeRequest('GET', '/rest/v1/products?select=id,name&limit=3');
  const verifyBarcodes = await makeRequest('GET', '/rest/v1/barcodes?select=id&limit=1');
  
  const barcodesFinal = verifyBarcodes.data ? verifyBarcodes.data.length : 0;

  console.log(`✅ Products remaining: ${productsCount}`);
  console.log(`✅ Barcodes remaining: ${barcodesFinal}\n`);

  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║          ✅ FRESH START COMPLETE ✅                ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║ Products Preserved:  ${productsCount}                             ║`);
  console.log(`║ Barcodes Deleted:    ${barcodesCount}                             ║`);
  console.log('║ Ready for new barcode generation!                 ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  console.log('📝 Next Steps:');
  console.log('   1. Generate new barcodes with: node generate-fresh-barcodes.js');
  console.log('   2. Verify in inventory: http://localhost:3000/inventory\n');
}

freshStart().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
