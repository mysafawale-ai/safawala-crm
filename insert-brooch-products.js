const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

const products = [
  { name: 'Brooch Classic', sku: 'BRCH-001', price: 550, cost: 275 },
  { name: 'Brooch Radiant', sku: 'BRCH-002', price: 950, cost: 475 },
  { name: 'Brooch Royal', sku: 'BRCH-003', price: 1050, cost: 525 },
  { name: 'Brooch Elegant', sku: 'BRCH-004', price: 1450, cost: 725 },
  { name: 'Brooch Luxe', sku: 'BRCH-005', price: 1650, cost: 825 },
  { name: 'Brooch Premium', sku: 'BRCH-006', price: 1850, cost: 925 },
  { name: 'Brooch Exquisite', sku: 'BRCH-007', price: 2150, cost: 1075 },
  { name: 'Brooch Divine', sku: 'BRCH-008', price: 2550, cost: 1275 },
  { name: 'Brooch Regal', sku: 'BRCH-009', price: 3550, cost: 1775 },
  { name: 'Brooch Majestic', sku: 'BRCH-010', price: 4550, cost: 2275 },
  { name: 'Brooch Crown', sku: 'BRCH-011', price: 6550, cost: 3275 }
];

async function insertBroochProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🎯 INSERTING BROOCH PRODUCTS\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Total Products: 11`);
  console.log(`Stock per Product: 100 units`);
  console.log(`Total Stock: 1100 units\n`);

  try {
    // Step 1: Check or create Brooch category in product_categories
    console.log('🔄 Step 1: Setting up Brooch category...\n');
    
    let { data: existingCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('franchise_id', franchiseId)
      .eq('name', 'BROOCH')
      .single();

    let categoryId;

    if (!existingCategory) {
      const { data: newCategory, error: createError } = await supabase
        .from('product_categories')
        .insert([{
          franchise_id: franchiseId,
          name: 'BROOCH',
          description: 'Premium brooch collection',
          is_active: true
        }])
        .select()
        .single();

      if (createError) throw createError;
      categoryId = newCategory.id;
      console.log(`✓ Created new Brooch category: ${categoryId}\n`);
    } else {
      categoryId = existingCategory.id;
      console.log(`✓ Using existing Brooch category: ${categoryId}\n`);
    }

    // Step 2: Insert products
    console.log('🔄 Step 2: Inserting 11 Brooch products...\n');

    const productInserts = products.map(prod => ({
      franchise_id: franchiseId,
      category_id: categoryId,
      category: 'Brooch',
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

    console.log(`✓ Created ${insertedProducts.length} products\n`);;

    // Step 4: Display summary
    console.log('📊 INSERTION SUMMARY:\n');
    console.log('Product Name              | Price  | Cost  | Stock | SKU');
    console.log('─────────────────────────────────────────────────────────');

    for (let i = 0; i < insertedProducts.length; i++) {
      const prod = insertedProducts[i];
      const originalData = products[i];
      console.log(
        `${prod.name.padEnd(25)} | ₹${originalData.price.toString().padEnd(5)} | ₹${originalData.cost.toString().padEnd(4)} | 100   | ${prod.sku}`
      );
    }

    console.log('─────────────────────────────────────────────────────────');
    console.log(`Total Products:  ${insertedProducts.length}`);
    console.log(`Total Stock:     ${insertedProducts.length * 100} units`);
    console.log(`Category:        Brooch`);
    console.log(`Franchise:       Vadodara Branch\n`);

    console.log('═════════════════════════════════════════');
    console.log('✅ ALL PRODUCTS CREATED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertBroochProducts();
