const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

const products = [
  { name: 'Pocket Brooch Classic', sku: 'PBR-001', price: 250, cost: 125 },
  { name: 'Pocket Brooch Radiant', sku: 'PBR-002', price: 350, cost: 175 },
  { name: 'Pocket Brooch Royal', sku: 'PBR-003', price: 450, cost: 225 }
];

async function insertPocketBroochProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🎯 INSERTING POCKET BROOCH PRODUCTS\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Total Products: 3`);
  console.log(`Stock per Product: 100 units`);
  console.log(`Total Stock: 300 units\n`);

  try {
    // Step 1: Get or create POCKET BROOCH category from product_categories
    console.log('🔄 Step 1: Setting up POCKET BROOCH category...\n');
    
    let { data: pocketBroochCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('franchise_id', franchiseId)
      .eq('name', 'POCKET BROOCH')
      .single();

    let categoryId;

    if (!pocketBroochCategory) {
      console.log('   POCKET BROOCH category not found. Creating new category...\n');
      const { data: newCategory, error: createError } = await supabase
        .from('product_categories')
        .insert([{
          franchise_id: franchiseId,
          name: 'POCKET BROOCH',
          description: 'Pocket brooch collection',
          is_active: true
        }])
        .select()
        .single();

      if (createError) throw createError;
      categoryId = newCategory.id;
      console.log(`✓ Created new POCKET BROOCH category: ${categoryId}\n`);
    } else {
      categoryId = pocketBroochCategory.id;
      console.log(`✓ Found existing POCKET BROOCH category: ${categoryId}\n`);
    }

    // Step 2: Insert products
    console.log('🔄 Step 2: Inserting 3 POCKET BROOCH products...\n');

    const productInserts = products.map(prod => ({
      franchise_id: franchiseId,
      category_id: categoryId,
      category: 'POCKET BROOCH',
      name: prod.name,
      sku: prod.sku,
      brand: 'Safawala',
      color: 'Mixed',
      material: 'Premium Metal',
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
    console.log(`Category:        POCKET BROOCH`);
    console.log(`Franchise:       Vadodara Branch\n`);

    console.log('═════════════════════════════════════════');
    console.log('✅ ALL POCKET BROOCH PRODUCTS CREATED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertPocketBroochProducts();
