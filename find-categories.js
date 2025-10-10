const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xplnyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'
);

(async () => {
  console.log('\n=== FINDING CATEGORIES ===\n');
  
  // Get all packages with their category_ids
  const { data: packages } = await supabase
    .from('package_sets')
    .select('*')
    .order('name');
  
  console.log('Total packages:', packages?.length);
  
  // Group by category_id
  const categoryMap = {};
  packages?.forEach(pkg => {
    const catId = pkg.category_id;
    if (!categoryMap[catId]) {
      categoryMap[catId] = [];
    }
    categoryMap[catId].push(pkg);
  });
  
  console.log('\n=== CATEGORIES (grouped by category_id) ===\n');
  Object.keys(categoryMap).forEach(catId => {
    console.log(`Category ID: ${catId}`);
    console.log(`Packages (${categoryMap[catId].length}):`);
    categoryMap[catId].forEach(pkg => {
      console.log(`  - ${pkg.name}`);
    });
    console.log('');
  });
  
  // Try to find the actual category table by querying one category_id
  const firstCatId = Object.keys(categoryMap)[0];
  console.log(`\n=== LOOKING UP CATEGORY: ${firstCatId} ===\n`);
  
  const possibleTables = ['categories', 'safa_categories', 'package_categories', 'safawala_categories'];
  for (const table of possibleTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', firstCatId)
      .single();
    
    if (!error && data) {
      console.log(`Found in table '${table}':`, data);
    }
  }
})();
