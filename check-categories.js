const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://xplnyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY'
);

(async () => {
  console.log('\n=== CHECKING CATEGORIES ===\n');
  
  const { data: categories } = await supabase
    .from('package_categories')
    .select('*')
    .order('name');
  
  console.log('Categories found:', categories?.length || 0);
  if (categories) {
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.description || 'No description'})`);
    });
  }
  
  console.log('\n=== CHECKING PACKAGES ===\n');
  
  const { data: packages } = await supabase
    .from('package_sets')
    .select('id, name, category_id')
    .limit(10);
  
  console.log('Sample packages:', packages?.length || 0);
  if (packages) {
    packages.forEach(pkg => {
      console.log(`  - ${pkg.name} (category_id: ${pkg.category_id || 'None'})`);
    });
  }
})();
