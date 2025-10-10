const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Read env vars manually
const envContent = fs.readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  }
})

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPincodeTables() {
  console.log('Checking pincode-related tables...\n')
  
  // Check pincode_distance
  try {
    const { data, error } = await supabase
      .from('pincode_distance')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ pincode_distance table error:', error.message)
    } else {
      console.log('✅ pincode_distance table exists')
      console.log('Sample data:', data)
    }
  } catch (e) {
    console.log('❌ pincode_distance table does not exist')
  }
  
  console.log('\n')
  
  // Check pincode_km
  try {
    const { data, error } = await supabase
      .from('pincode_km')
      .select('*')
      .limit(5)
    
    if (error) {
      console.log('❌ pincode_km table error:', error.message)
    } else {
      console.log('✅ pincode_km table exists')
      console.log('Sample data:', data)
    }
  } catch (e) {
    console.log('❌ pincode_km table does not exist')
  }
  
  console.log('\n')
  
  // Try to find a customer with pincode 400001
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, pincode')
    .eq('pincode', '400001')
    .limit(1)
  
  console.log('Customer with pincode 400001:', customers)
}

checkPincodeTables().then(() => process.exit(0))
