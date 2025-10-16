const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODM4MTMwNiwiZXhwIjoyMDQzOTU3MzA2fQ.ps3VpeInioMJC66Ne_cCONRM7l8zvLKUg8pR7oaB_Nw'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSalesStaff() {
  console.log('🔍 Checking sales_closed_by data...\n')
  
  // Check product_orders
  const { data: productOrders, error: productError } = await supabase
    .from('product_orders')
    .select('id, order_number, sales_closed_by, is_quote')
    .eq('is_quote', true)
    .limit(5)
  
  console.log('📦 Product Orders (quotes):')
  if (productError) {
    console.error('Error:', productError)
  } else {
    console.log(`Found ${productOrders.length} product order quotes`)
    productOrders.forEach(o => {
      console.log(`  - ${o.order_number}: sales_closed_by = ${o.sales_closed_by || 'NULL'}`)
    })
  }
  
  console.log('\n')
  
  // Check package_bookings
  const { data: packageBookings, error: packageError } = await supabase
    .from('package_bookings')
    .select('id, package_number, sales_closed_by, is_quote')
    .eq('is_quote', true)
    .limit(5)
  
  console.log('📋 Package Bookings (quotes):')
  if (packageError) {
    console.error('Error:', packageError)
  } else {
    console.log(`Found ${packageBookings.length} package booking quotes`)
    packageBookings.forEach(b => {
      console.log(`  - ${b.package_number}: sales_closed_by = ${b.sales_closed_by || 'NULL'}`)
    })
  }
  
  console.log('\n')
  
  // Check staff table
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, name')
    .limit(5)
  
  console.log('👥 Staff Members:')
  if (staffError) {
    console.error('Error:', staffError)
  } else {
    console.log(`Found ${staff.length} staff members`)
    staff.forEach(s => {
      console.log(`  - ${s.name} (ID: ${s.id})`)
    })
  }
}

checkSalesStaff().then(() => process.exit(0))
