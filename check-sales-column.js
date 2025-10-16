const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://xplnyaxkusvuajtmorss.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwbG55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyODM4MTMwNiwiZXhwIjoyMDQzOTU3MzA2fQ.ps3VpeInioMJC66Ne_cCONRM7l8zvLKUg8pR7oaB_Nw'
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
  console.log('🔍 Checking sales_closed_by column in tables...\n')
  
  // Check product_orders table columns
  console.log('📦 Product Orders Table:')
  const { data: productOrder } = await supabase
    .from('product_orders')
    .select('*')
    .eq('is_quote', true)
    .limit(1)
  
  if (productOrder && productOrder[0]) {
    const columns = Object.keys(productOrder[0])
    const hasSalesClosedBy = columns.includes('sales_closed_by')
    const hasSalesClosedById = columns.includes('sales_closed_by_id')
    
    console.log('  Has sales_closed_by:', hasSalesClosedBy)
    console.log('  Has sales_closed_by_id:', hasSalesClosedById)
    
    if (hasSalesClosedById) {
      console.log('  Value:', productOrder[0].sales_closed_by_id || 'NULL')
    }
    
    console.log('  All columns:', columns.sort().join(', '))
  }
  
  console.log('\n📋 Package Bookings Table:')
  const { data: packageBooking } = await supabase
    .from('package_bookings')
    .select('*')
    .eq('is_quote', true)
    .limit(1)
  
  if (packageBooking && packageBooking[0]) {
    const columns = Object.keys(packageBooking[0])
    const hasSalesClosedBy = columns.includes('sales_closed_by')
    const hasSalesClosedById = columns.includes('sales_closed_by_id')
    
    console.log('  Has sales_closed_by:', hasSalesClosedBy)
    console.log('  Has sales_closed_by_id:', hasSalesClosedById)
    
    if (hasSalesClosedById) {
      console.log('  Value:', packageBooking[0].sales_closed_by_id || 'NULL')
    }
    
    console.log('  All columns:', columns.sort().join(', '))
  }
  
  console.log('\n👥 Staff Table:')
  const { data: staff } = await supabase
    .from('staff')
    .select('id, name')
    .limit(3)
  
  if (staff) {
    console.log('  Staff members:')
    staff.forEach(s => {
      console.log(`    - ${s.name} (${s.id})`)
    })
  }
}

checkColumns().then(() => process.exit(0))
