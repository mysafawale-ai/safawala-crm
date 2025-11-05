/**
 * Final Cleanup: Keep only the newest random barcode per product
 * Deletes old sequential barcodes, keeping 103 random ones (1 per product)
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const SUPABASE_URL = 'https://yoyfgrqjfbejglcyjlrw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlveWZncnFqZmJlamdsY3lqbHJ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODAwMzM5NiwiZXhwIjoxODk0MzM5Mzk2fQ.6DnHJnbJBEgcRKGSKbH7C0FzCXvz5qA5mMqNz6kVE8A';

async function makeRequest(method, path, body = null) {
  const url = `${SUPABASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'apikey': SUPABASE_KEY
  };

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(url, options);
    const text = await response.text();
    return { status: response.status, data: text ? JSON.parse(text) : null };
  } catch (error) {
    console.error(`Error in ${method} ${path}:`, error.message);
    return { status: 0, data: null };
  }
}

async function cleanupBarcodes() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║      FINAL BARCODE CLEANUP - KEEP NEWEST ONLY      ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  // Step 1: Fetch all barcodes with full details
  console.log('📋 Step 1: Fetching all barcodes...');
  const result = await makeRequest('GET', '/rest/v1/barcodes?order=product_id.asc,created_at.desc&select=id,product_id,barcode_number,created_at');
  
  if (!result.data || !Array.isArray(result.data)) {
    console.error('❌ Failed to fetch barcodes:', result);
    return;
  }

  const allBarcodes = result.data;
  console.log(`✅ Found ${allBarcodes.length} total barcode records\n`);

  if (allBarcodes.length <= 103) {
    console.log('✅ Already clean! No duplicates detected.');
    return;
  }

  // Step 2: Group by product and identify duplicates
  console.log('🔍 Step 2: Grouping barcodes by product...');
  const byProduct = {};
  const toDelete = [];

  allBarcodes.forEach(b => {
    if (!byProduct[b.product_id]) {
      byProduct[b.product_id] = [];
    }
    byProduct[b.product_id].push(b);
  });

  // Keep newest, mark others for deletion
  Object.entries(byProduct).forEach(([productId, barcodes]) => {
    if (barcodes.length > 1) {
      // Keep the first one (already sorted by created_at desc), delete rest
      toDelete.push(...barcodes.slice(1));
    }
  });

  console.log(`✅ Found ${toDelete.length} duplicate records to delete\n`);

  if (toDelete.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  // Step 3: Delete duplicates
  console.log('🗑️  Step 3: Deleting duplicate barcodes...');
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i++) {
    const barcode = toDelete[i];
    const response = await makeRequest('DELETE', `/rest/v1/barcodes?id=eq.${barcode.id}`);
    if (response.status === 204) {
      deleted++;
      if ((i + 1) % 20 === 0) {
        console.log(`  ✓ Deleted ${i + 1}/${toDelete.length}...`);
      }
    }
  }
  console.log(`✅ Successfully deleted ${deleted}/${toDelete.length} duplicates\n`);

  // Step 4: Verify cleanup
  console.log('📊 Step 4: Verifying final count...');
  const finalResult = await makeRequest('GET', '/rest/v1/barcodes?select=id,barcode_number,product_id');
  const finalBarcodes = finalResult.data || [];
  console.log(`✅ Final barcode count: ${finalBarcodes.length}\n`);

  if (finalBarcodes.length === 103) {
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║              ✅ CLEANUP COMPLETE! ✅               ║');
    console.log('╠════════════════════════════════════════════════════╣');
    console.log(`║ Final Count: 103 unique random 11-digit barcodes   ║`);
    console.log(`║ Sample Random Barcodes:                            ║`);
    finalBarcodes.slice(0, 5).forEach((b, i) => {
      const num = String(b.barcode_number).padEnd(11);
      console.log(`║   ${i + 1}. ${num}  (Product: ${b.product_id})               ║`.substring(0, 52) + '║');
    });
    console.log('╚════════════════════════════════════════════════════╝\n');
  } else {
    console.log(`⚠️  Unexpected final count: ${finalBarcodes.length} (expected 103)`);
  }
}

cleanupBarcodes().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
