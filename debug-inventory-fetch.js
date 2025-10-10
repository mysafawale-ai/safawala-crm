// Debug script to check inventory data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qpinyaxkusvuajtmgrss.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInventory() {
  console.log('🔍 Debugging Inventory...\n');
  
  // 1. Check user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('email', 'mysafawale@gmail.com')
    .single();
    
  if (userError) {
    console.log('❌ User Error:', userError);
    return;
  }
  
  console.log('✅ User found:');
  console.log('  - Email:', user.email);
  console.log('  - Role:', user.role);
  console.log('  - Franchise ID:', user.franchise_id);
  console.log('');
  
  // 2. Check all products for this franchise
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('franchise_id', user.franchise_id);
    
  if (productsError) {
    console.log('❌ Products Error:', productsError);
    return;
  }
  
  console.log('📦 Products for franchise:', products?.length || 0);
  
  if (products && products.length > 0) {
    console.log('\nProduct details:');
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${p.product_code})`);
      console.log(`     - Active: ${p.is_active}`);
      console.log(`     - Stock: ${p.stock_available}/${p.stock_total}`);
      console.log(`     - Category ID: ${p.category_id}`);
    });
  } else {
    console.log('⚠️  No products found for this franchise!');
    
    // Check if products exist with different franchise_id
    const { data: allProducts } = await supabase
      .from('products')
      .select('franchise_id')
      .limit(10);
      
    console.log('\n🔍 Sample franchise_ids in products table:', 
      [...new Set(allProducts?.map(p => p.franchise_id))]);
  }
  
  // 3. Check categories
  const { data: categories } = await supabase
    .from('product_categories')
    .select('*');
    
  console.log('\n📁 Categories:', categories?.length || 0);
  if (categories) {
    categories.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id})`);
    });
  }
}

debugInventory().catch(console.error);
