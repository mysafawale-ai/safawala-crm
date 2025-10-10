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

async function checkStaff() {
  console.log('Checking staff table structure...\n');
  const { data, error } = await supabase.from('staff').select('*').limit(2);
  if (error) {
    console.log('Staff table error:', error.message);
  } else {
    console.log('Sample staff records:', JSON.stringify(data, null, 2));
  }
  
  // Check package_bookings table structure
  console.log('\n\nChecking package_bookings columns...');
  const { data: bookings } = await supabase.from('package_bookings').select('*').limit(1);
  if (bookings && bookings.length > 0) {
    console.log('Package bookings columns:', Object.keys(bookings[0]));
  } else {
    console.log('No package bookings found');
  }
  
  // Check product_orders table
  console.log('\n\nChecking product_orders columns...');
  const { data: orders } = await supabase.from('product_orders').select('*').limit(1);
  if (orders && orders.length > 0) {
    console.log('Product orders columns:', Object.keys(orders[0]));
  } else {
    console.log('No product orders found');
  }
}

checkStaff().then(() => process.exit(0));
