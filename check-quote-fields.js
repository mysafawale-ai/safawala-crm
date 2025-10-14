/**
 * Check available fields in product_orders and package_bookings
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkFields() {
  console.log('\n🔍 CHECKING AVAILABLE FIELDS\n')

  // Check product_orders
  console.log('📦 Product Orders Fields:')
  const { data: prodData } = await supabase
    .from('product_orders')
    .select('*')
    .eq('is_quote', true)
    .limit(1)

  if (prodData && prodData[0]) {
    const fields = Object.keys(prodData[0]).sort()
    console.log('Available fields:', fields.join(', '))
    
    // Check for time fields
    const timeFields = fields.filter(f => f.includes('time'))
    console.log('\nTime-related fields:', timeFields.length > 0 ? timeFields.join(', ') : 'NONE')
    
    // Show date fields with actual values
    console.log('\nDate/Time Values:')
    if (prodData[0].event_date) console.log('  event_date:', prodData[0].event_date)
    if (prodData[0].delivery_date) console.log('  delivery_date:', prodData[0].delivery_date)
    if (prodData[0].return_date) console.log('  return_date:', prodData[0].return_date)
    
    timeFields.forEach(field => {
      if (prodData[0][field]) {
        console.log(`  ${field}:`, prodData[0][field])
      }
    })
  }

  // Check package_bookings
  console.log('\n\n📋 Package Bookings Fields:')
  const { data: pkgData } = await supabase
    .from('package_bookings')
    .select('*')
    .eq('is_quote', true)
    .limit(1)

  if (pkgData && pkgData[0]) {
    const fields = Object.keys(pkgData[0]).sort()
    console.log('Available fields:', fields.join(', '))
    
    // Check for time fields
    const timeFields = fields.filter(f => f.includes('time'))
    console.log('\nTime-related fields:', timeFields.length > 0 ? timeFields.join(', ') : 'NONE')
    
    // Show date fields with actual values
    console.log('\nDate/Time Values:')
    if (pkgData[0].event_date) console.log('  event_date:', pkgData[0].event_date)
    if (pkgData[0].delivery_date) console.log('  delivery_date:', pkgData[0].delivery_date)
    if (pkgData[0].return_date) console.log('  return_date:', pkgData[0].return_date)
    
    timeFields.forEach(field => {
      if (pkgData[0][field]) {
        console.log(`  ${field}:`, pkgData[0][field])
      }
    })
  }

  console.log('\n')
}

checkFields().catch(console.error)
