const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const franchiseId = '1a518dde-85b7-44ef-8bc4-092f53ddfd99';

const categories = [
  {
    name: 'FEATHERS',
    displayName: 'Feathers',
    products: [
      { name: 'Feathers Classic', sku: 'FTH-001', price: 150, cost: 75 },
      { name: 'Feathers Radiant', sku: 'FTH-002', price: 350, cost: 175 }
    ]
  },
  {
    name: 'GROOM SAFA',
    displayName: 'Groom Safa',
    products: [
      { name: 'Groom Safa Classic', sku: 'GRM-001', price: 2950, cost: 1475 },
      { name: 'Groom Safa Radiant', sku: 'GRM-002', price: 3250, cost: 1625 },
      { name: 'Groom Safa Royal', sku: 'GRM-003', price: 3650, cost: 1825 },
      { name: 'Groom Safa Elegant', sku: 'GRM-004', price: 3950, cost: 1975 },
      { name: 'Groom Safa Luxe', sku: 'GRM-005', price: 4150, cost: 2075 },
      { name: 'Groom Safa Premium', sku: 'GRM-006', price: 4550, cost: 2275 },
      { name: 'Groom Safa Divine', sku: 'GRM-007', price: 5100, cost: 2550 }
    ]
  },
  {
    name: 'SCARF',
    displayName: 'Scarf',
    products: [
      { name: 'Scarf Classic', sku: 'SCF-001', price: 450, cost: 225 },
      { name: 'Scarf Radiant', sku: 'SCF-002', price: 650, cost: 325 },
      { name: 'Scarf Premium', sku: 'SCF-003', price: 2500, cost: 1250 }
    ]
  },
  {
    name: 'BELT',
    displayName: 'Belt',
    products: [
      { name: 'Belt Premium', sku: 'BLT-001', price: 3500, cost: 1750 }
    ]
  },
  {
    name: 'TALWAR',
    displayName: 'Talwar',
    products: [
      { name: 'Talwar Classic', sku: 'TLW-001', price: 3500, cost: 1750 },
      { name: 'Talwar Radiant', sku: 'TLW-002', price: 4000, cost: 2000 },
      { name: 'Talwar Royal', sku: 'TLW-003', price: 5500, cost: 2750 },
      { name: 'Talwar Elegant', sku: 'TLW-004', price: 8000, cost: 4000 },
      { name: 'Talwar Divine', sku: 'TLW-005', price: 11000, cost: 5500 }
    ]
  }
];

async function insertAllProducts() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('\n🎯 BATCH INSERTING ALL PRODUCTS\n');
  console.log(`Franchise: Vadodara Branch`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Total Products: ${categories.reduce((sum, cat) => sum + cat.products.length, 0)}\n`);

  try {
    let totalProductsCreated = 0;
    const results = [];

    for (const category of categories) {
      console.log(`\n🔄 Processing ${category.displayName}...\n`);

      // Get or create category
      let { data: existingCategory } = await supabase
        .from('product_categories')
        .select('id')
        .eq('franchise_id', franchiseId)
        .eq('name', category.name)
        .single();

      let categoryId;

      if (!existingCategory) {
        const { data: newCategory, error: createError } = await supabase
          .from('product_categories')
          .insert([{
            franchise_id: franchiseId,
            name: category.name,
            description: `${category.displayName} collection`,
            is_active: true
          }])
          .select()
          .single();

        if (createError) throw createError;
        categoryId = newCategory.id;
        console.log(`   ✓ Created ${category.displayName} category`);
      } else {
        categoryId = existingCategory.id;
        console.log(`   ✓ Found existing ${category.displayName} category`);
      }

      // Insert products for this category
      const productInserts = category.products.map(prod => ({
        franchise_id: franchiseId,
        category_id: categoryId,
        category: category.name,
        name: prod.name,
        sku: prod.sku,
        brand: 'Safawala',
        color: 'Mixed',
        material: 'Premium',
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

      if (insertError) throw insertError;

      console.log(`   ✓ Created ${insertedProducts.length} products`);
      totalProductsCreated += insertedProducts.length;

      // Store results for summary
      results.push({
        category: category.displayName,
        count: insertedProducts.length,
        products: insertedProducts
      });
    }

    // Display final summary
    console.log('\n\n═════════════════════════════════════════════════════════════');
    console.log('📊 BATCH INSERTION COMPLETE - FINAL SUMMARY');
    console.log('═════════════════════════════════════════════════════════════\n');

    for (const result of results) {
      console.log(`${result.category.padEnd(20)} | ${result.count} products | ${result.count * 100} units`);
    }

    console.log('\n═════════════════════════════════════════════════════════════');
    console.log(`✅ TOTAL: ${totalProductsCreated} products created`);
    console.log(`✅ TOTAL STOCK: ${totalProductsCreated * 100} units`);
    console.log('═════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertAllProducts();
