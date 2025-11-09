const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

const products = [
  { name: 'Mod Classic', sku: 'MOD-001', price: 350, cost: 175 },
  { name: 'Mod Radiant', sku: 'MOD-002', price: 650, cost: 325 },
  { name: 'Mod Royal', sku: 'MOD-003', price: 850, cost: 425 }
];

async function insertModProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🎯 INSERTING MOD PRODUCTS\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Total Products: 3`);
  console.log(`Stock per Product: 100 units`);
  console.log(`Total Stock: 300 units\n`);

  try {
    // Step 1: Get or create MOD category from product_categories
    console.log('🔄 Step 1: Setting up MOD category...\n');
    
    let { data: modCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('franchise_id', franchiseId)
      .eq('name', 'MOD')
      .single();

    let categoryId;

    if (!modCategory) {
      console.log('   MOD category not found. Creating new category...\n');
      const { data: newCategory, error: createError } = await supabase
        .from('product_categories')
        .insert([{
          franchise_id: franchiseId,
          name: 'MOD',
          description: 'MOD collection',
          is_active: true
        }])
        .select()
        .single();

      if (createError) throw createError;
      categoryId = newCategory.id;
      console.log(`✓ Created new MOD category: ${categoryId}\n`);
    } else {
      categoryId = modCategory.id;
      console.log(`✓ Found existing MOD category: ${categoryId}\n`);
    }

    // Step 2: Insert products
    console.log('🔄 Step 2: Inserting 3 MOD products...\n');

    const productInserts = products.map(prod => ({
      franchise_id: franchiseId,
      category_id: categoryId,
      category: 'MOD',
      name: prod.name,
      sku: prod.sku,
      brand: 'Safawala',
      color: 'Mixed',
      material: 'Premium Design',
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
    console.log(`Category:        MOD`);
    console.log(`Franchise:       Vadodara Branch\n`);

    console.log('═════════════════════════════════════════');
    console.log('✅ ALL MOD PRODUCTS CREATED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertModProducts();
