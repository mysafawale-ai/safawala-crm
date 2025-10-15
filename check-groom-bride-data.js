/**
 * Check if groom/bride data exists in quotes
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkGroomBrideData() {
  console.log('\n🔍 CHECKING GROOM/BRIDE DATA IN QUOTES\n')

  // Check product_orders
  console.log('📦 Product Orders (quotes):')
  const { data: products } = await supabase
    .from('product_orders')
    .select('order_number, groom_name, groom_whatsapp, groom_address, bride_name, bride_whatsapp, bride_address')
    .eq('is_quote', true)
    .limit(5)

  if (products) {
    products.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.order_number}`)
      console.log(`   Groom: ${p.groom_name || 'NULL'}`)
      console.log(`   Groom WhatsApp: ${p.groom_whatsapp || 'NULL'}`)
      console.log(`   Groom Address: ${p.groom_address || 'NULL'}`)
      console.log(`   Bride: ${p.bride_name || 'NULL'}`)
      console.log(`   Bride WhatsApp: ${p.bride_whatsapp || 'NULL'}`)
      console.log(`   Bride Address: ${p.bride_address || 'NULL'}`)
    })
  }

  // Check package_bookings
  console.log('\n\n📋 Package Bookings (quotes):')
  const { data: packages } = await supabase
    .from('package_bookings')
    .select('package_number, groom_name, groom_whatsapp, groom_address, bride_name, bride_whatsapp, bride_address')
    .eq('is_quote', true)
    .limit(5)

  if (packages) {
    packages.forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.package_number}`)
      console.log(`   Groom: ${p.groom_name || 'NULL'}`)
      console.log(`   Groom WhatsApp: ${p.groom_whatsapp || 'NULL'}`)
      console.log(`   Groom Address: ${p.groom_address || 'NULL'}`)
      console.log(`   Bride: ${p.bride_name || 'NULL'}`)
      console.log(`   Bride WhatsApp: ${p.bride_whatsapp || 'NULL'}`)
      console.log(`   Bride Address: ${p.bride_address || 'NULL'}`)
    })
  }

  console.log('\n')
}

checkGroomBrideData().catch(console.error)
