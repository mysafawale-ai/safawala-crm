const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

const products = [
  { name: 'Dupatta Classic', sku: 'DPT-001', price: 1999, cost: 1000 },
  { name: 'Dupatta Radiant', sku: 'DPT-002', price: 2250, cost: 1125 },
  { name: 'Dupatta Royal', sku: 'DPT-003', price: 2950, cost: 1475 },
  { name: 'Dupatta Elegant', sku: 'DPT-004', price: 3250, cost: 1625 },
  { name: 'Dupatta Luxe', sku: 'DPT-005', price: 3650, cost: 1825 },
  { name: 'Dupatta Premium', sku: 'DPT-006', price: 3850, cost: 1925 },
  { name: 'Dupatta Exquisite', sku: 'DPT-007', price: 3950, cost: 1975 },
  { name: 'Dupatta Divine', sku: 'DPT-008', price: 4550, cost: 2275 }
];

async function insertDupattaProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🎯 INSERTING DUPATTA PRODUCTS\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Total Products: 8`);
  console.log(`Stock per Product: 100 units`);
  console.log(`Total Stock: 800 units\n`);

  try {
    // Step 1: Get DUPATTA category from product_categories
    console.log('🔄 Step 1: Getting DUPATTA category...\n');
    
    let { data: dupathaCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('franchise_id', franchiseId)
      .eq('name', 'DUPATTA')
      .single();

    if (!dupathaCategory) {
      throw new Error('DUPATTA category not found. Please create it first.');
    }

    const categoryId = dupathaCategory.id;
    console.log(`✓ Found DUPATTA category: ${categoryId}\n`);

    // Step 2: Insert products
    console.log('🔄 Step 2: Inserting 8 DUPATTA products...\n');

    const productInserts = products.map(prod => ({
      franchise_id: franchiseId,
      category_id: categoryId,
      category: 'DUPATTA',
      name: prod.name,
      sku: prod.sku,
      brand: 'Safawala',
      color: 'Mixed',
      material: 'Premium Fabric',
      description: `Premium ${prod.name.toLowerCase()}`,
      rental_price: prod.price,
      price: prod.price,
      cost_price: prod.cost,
      security_deposit: Math.floor(prod.price * 0.1),
      stock_total: 100,
      stock_available: 100,
      stock_booked: 0,
      stock_damaged: 0,
      stock_in_laundry: 0,
      reorder_level: 10,
      is_active: true
    }));

    const { data: insertedProducts, error: insertError } = await supabase
      .from('products')
      .insert(productInserts)
      .select();

    if (insertError) {
      console.error('Error details:', insertError);
      throw insertError;
    }

    console.log(`✓ Created ${insertedProducts.length} products\n`);

    // Step 3: Display summary
    console.log('📊 INSERTION SUMMARY:\n');
    console.log('Product Name              | Price  | Cost   | Stock | SKU');
    console.log('──────────────────────────────────────────────────────────');

    for (let i = 0; i < insertedProducts.length; i++) {
      const prod = insertedProducts[i];
      const originalData = products[i];
      console.log(
        `${prod.name.padEnd(25)} | ₹${originalData.price.toString().padEnd(5)} | ₹${originalData.cost.toString().padEnd(5)} | 100   | ${prod.sku}`
      );
    }

    console.log('──────────────────────────────────────────────────────────');
    console.log(`Total Products:  ${insertedProducts.length}`);
    console.log(`Total Stock:     ${insertedProducts.length * 100} units`);
    console.log(`Category:        DUPATTA`);
    console.log(`Franchise:       Vadodara Branch\n`);

    console.log('═════════════════════════════════════════');
    console.log('✅ ALL DUPATTA PRODUCTS CREATED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertDupattaProducts();
