const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

const products = [
  { name: 'Katar Classic', sku: 'KTR-001', price: 550, cost: 275 },
  { name: 'Katar Radiant', sku: 'KTR-002', price: 650, cost: 325 },
  { name: 'Katar Royal', sku: 'KTR-003', price: 1150, cost: 575 },
  { name: 'Katar Elegant', sku: 'KTR-004', price: 1750, cost: 875 },
  { name: 'Katar Luxe', sku: 'KTR-005', price: 2250, cost: 1125 },
  { name: 'Katar Premium', sku: 'KTR-006', price: 5500, cost: 2750 },
  { name: 'Katar Divine', sku: 'KTR-007', price: 7500, cost: 3750 }
];

async function insertKatarProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🎯 INSERTING KATAR PRODUCTS\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Total Products: 7`);
  console.log(`Stock per Product: 100 units`);
  console.log(`Total Stock: 700 units\n`);

  try {
    // Step 1: Get KATAR category from product_categories
    console.log('🔄 Step 1: Getting KATAR category...\n');
    
    let { data: katarCategory, error: categoryError } = await supabase
      .from('product_categories')
      .select('id')
      .eq('franchise_id', franchiseId)
      .eq('name', 'KATAR')
      .single();

    if (!katarCategory) {
      throw new Error('KATAR category not found. Please create it first.');
    }

    const categoryId = katarCategory.id;
    console.log(`✓ Found KATAR category: ${categoryId}\n`);

    // Step 2: Insert products
    console.log('🔄 Step 2: Inserting 7 KATAR products...\n');

    const productInserts = products.map(prod => ({
      franchise_id: franchiseId,
      category_id: categoryId,
      category: 'KATAR',
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
    console.log(`Category:        KATAR`);
    console.log(`Franchise:       Vadodara Branch\n`);

    console.log('═════════════════════════════════════════');
    console.log('✅ ALL KATAR PRODUCTS CREATED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertKatarProducts();
