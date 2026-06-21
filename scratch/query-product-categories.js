const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQzNTkwOCwiZXhwIjoyMDcwMDExOTA4fQ.-46NLMqfpy8mKFgrQtW0KuW4_Vk5WeBmovy5QwFMiLY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: productCategories, error } = await supabase
    .from('product_categories')
    .select('*');
  
  if (error) {
    console.error('Error fetching product_categories:', error);
    return;
  }
  
  console.log('Product Categories found:');
  console.log(JSON.stringify(productCategories, null, 2));
}

run();
