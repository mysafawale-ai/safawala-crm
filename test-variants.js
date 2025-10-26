const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmqrss.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1xcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4OTU5NjcsImV4cCI6MjA0NDQ3MTk2N30.R_RYJQG8LvVZT_2TL0iFCfQQXYcDL-Zt-VY_tPcZqoc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVariantsFetch() {
  console.log('\n=== SMOKE TEST: Package Variants ===\n');
  
  // 1. Fetch categories
  console.log('1️⃣ Fetching categories...');
  const { data: categories, error: catError } = await supabase
    .from('packages_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  
  if (catError) {
    console.error('❌ Error fetching categories:', catError.message);
    return;
  }
  console.log(`✅ Found ${categories.length} categories`);
  categories.forEach(cat => console.log(`   - ${cat.name} (id: ${cat.id.substring(0, 8)}...)`));
  
  // 2. Fetch variants
  console.log('\n2️⃣ Fetching all variants...');
  const { data: variants, error: varError } = await supabase
    .from('package_variants')
    .select('*')
    .eq('is_active', true);
  
  if (varError) {
    console.error('❌ Error fetching variants:', varError.message);
    return;
  }
  console.log(`✅ Found ${variants.length} total variants`);
  
  // 3. Check columns
  if (variants.length > 0) {
    console.log('\n3️⃣ Checking variant columns...');
    const firstVariant = variants[0];
    console.log('   Columns:', Object.keys(firstVariant).join(', '));
    
    const hasCategoryId = 'category_id' in firstVariant;
    const hasPackageId = 'package_id' in firstVariant;
    console.log(`   • has category_id: ${hasCategoryId}`);
    console.log(`   • has package_id: ${hasPackageId}`);
    
    // 4. Group by category/package
    console.log('\n4️⃣ Grouping variants...');
    const groupKey = hasCategoryId ? 'category_id' : 'package_id';
    const grouped = {};
    variants.forEach(v => {
      const key = v[groupKey];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(v);
    });
    
    console.log(`   Grouped by ${groupKey}:`);
    Object.entries(grouped).forEach(([id, vars]) => {
      const category = categories.find(c => c.id === id);
      const catName = category ? category.name : `Unknown (${id.substring(0, 8)}...)`;
      console.log(`   - ${catName}: ${vars.length} variants`);
      vars.slice(0, 2).forEach(v => {
        console.log(`      • ${v.name || v.variant_name || 'Unnamed'} - ₹${v.base_price}`);
      });
      if (vars.length > 2) console.log(`      ... and ${vars.length - 2} more`);
    });
    
    // 5. Test filter for first category
    if (categories.length > 0) {
      console.log('\n5️⃣ Testing filter logic...');
      const firstCat = categories[0];
      const filtered = variants.filter(v => 
        v.category_id === firstCat.id || v.package_id === firstCat.id
      );
      console.log(`   Category: ${firstCat.name}`);
      console.log(`   Filter result: ${filtered.length} variants matched`);
      if (filtered.length > 0) {
        filtered.slice(0, 3).forEach(v => {
          console.log(`      • ${v.name || v.variant_name || 'Unnamed'} - ₹${v.base_price}`);
        });
      } else {
        console.log('   ⚠️  No variants matched! Check the linking column.');
      }
    }
  } else {
    console.log('\n⚠️  No variants found in database');
  }
  
  console.log('\n=== Test Complete ===\n');
}

testVariantsFetch().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
