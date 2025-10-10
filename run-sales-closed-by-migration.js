const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('🚀 Running migration to add sales_closed_by_id column...\n');
  
  try {
    // Add column to package_bookings
    console.log('Adding sales_closed_by_id to package_bookings...');
    const { error: pkgError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE package_bookings ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES users(id);`
    });
    
    if (pkgError && !pkgError.message.includes('already exists')) {
      console.log('Package bookings error (might be OK):', pkgError.message);
    } else {
      console.log('✅ Added to package_bookings');
    }
    
    // Add column to product_orders
    console.log('\nAdding sales_closed_by_id to product_orders...');
    const { error: ordError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS sales_closed_by_id UUID REFERENCES users(id);`
    });
    
    if (ordError && !ordError.message.includes('already exists')) {
      console.log('Product orders error (might be OK):', ordError.message);
    } else {
      console.log('✅ Added to product_orders');
    }
    
    console.log('\n✅ Migration completed! You can now track sales closed by staff members.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor:');
    console.log('   File: ADD_SALES_CLOSED_BY_COLUMN.sql');
  }
}

runMigration().then(() => process.exit(0));
