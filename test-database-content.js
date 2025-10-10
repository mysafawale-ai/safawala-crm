const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment or use defaults
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-key';

console.log('🔍 Checking Database Content...');

async function checkDatabase() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n📊 Checking Franchises...');
    const { data: franchises, error: franchiseError } = await supabase
      .from('franchises')
      .select('*')
      .limit(5);
    
    if (franchiseError) {
      console.error('❌ Franchise query error:', franchiseError);
    } else {
      console.log(`✅ Found ${franchises?.length || 0} franchises`);
      if (franchises && franchises.length > 0) {
        console.log('First franchise:', franchises[0]);
      }
    }
    
    console.log('\n👥 Checking Customers...');
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .limit(5);
    
    if (customerError) {
      console.error('❌ Customer query error:', customerError);
    } else {
      console.log(`✅ Found ${customers?.length || 0} customers`);
      if (customers && customers.length > 0) {
        console.log('Customers:');
        customers.forEach((customer, index) => {
          console.log(`  ${index + 1}. ${customer.name} (ID: ${customer.id}, Franchise: ${customer.franchise_id})`);
        });
      }
    }
    
    // Check if customers have the correct franchise_id
    if (franchises && franchises.length > 0 && customers && customers.length > 0) {
      const defaultFranchiseId = franchises[0].id;
      const customersWithCorrectFranchise = customers.filter(c => c.franchise_id === defaultFranchiseId);
      
      console.log(`\n🔗 Franchise Matching:`);
      console.log(`Default franchise ID: ${defaultFranchiseId}`);
      console.log(`Customers with correct franchise: ${customersWithCorrectFranchise.length}/${customers.length}`);
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();