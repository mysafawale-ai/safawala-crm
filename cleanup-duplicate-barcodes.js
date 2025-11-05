const https = require('https');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yoyfgrqjfbejglcyjlrw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveWZncnFqZmJlamdsY3lqbHJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODAwMzM5NiwiZXhwIjoxODk0MzM5Mzk2fQ.6DnHJnbJBEgcRKGSKbH7C0FzCXvz5qA5mMqNz6kVE8A';

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

async function cleanupDuplicates() {
  console.log('\n🔍 Step 1: Fetching all barcodes to analyze duplicates...');
  
  const result = await makeRequest('GET', '/rest/v1/barcodes?select=id,product_id,barcode_number');
  const barcodes = result.data;
  
  console.log(`✅ Found ${barcodes.length} total barcodes`);
  
  // Find duplicates: keep newest, delete oldest
  const groupedByProduct = {};
  barcodes.forEach(b => {
    if (!groupedByProduct[b.product_id]) {
      groupedByProduct[b.product_id] = [];
    }
    groupedByProduct[b.product_id].push(b);
  });
  
  let toDelete = [];
  Object.values(groupedByProduct).forEach(group => {
    if (group.length > 1) {
      // Keep the last one (newest), delete others
      toDelete.push(...group.slice(0, -1));
    }
  });
  
  if (toDelete.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }
  
  console.log(`\n🗑️  Step 2: Deleting ${toDelete.length} duplicate barcode records...`);
  
  // Delete duplicates
  for (const barcode of toDelete) {
    await makeRequest('DELETE', `/rest/v1/barcodes?id=eq.${barcode.id}`);
  }
  
  console.log(`✅ Deleted ${toDelete.length} duplicates`);
  
  // Verify final count
  const finalResult = await makeRequest('GET', '/rest/v1/barcodes?select=id');
  console.log(`\n✅ Final barcode count: ${finalResult.data.length}`);
}

cleanupDuplicates().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
