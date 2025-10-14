/**
 * Test the fixed query
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testFixedQuery() {
  console.log('\n🔍 TESTING FIXED QUERY\n')
  console.log('=' .repeat(80))

  // Test the corrected query
  console.log('\n📦 Testing Product Orders Query (FIXED):')
  const { data: productQuotes, error: prodError } = await supabase
    .from('product_orders')
    .select(`
      *,
      customer:customers!left(name, phone, email),
      product_order_items(
        *,
        product:products!left(name)
      )
    `)
    .eq('is_quote', true)
    .order('created_at', { ascending: false })

  if (prodError) {
    console.error('❌ Query Error:', prodError)
  } else {
    console.log(`✅ Query Success! Returned ${productQuotes.length} quotes`)
    console.log('\nQuote Details:')
    productQuotes.forEach((q, i) => {
      console.log(`\n  ${i + 1}. ${q.order_number}`)
      console.log(`     Customer: ${q.customer?.name || 'NULL'}`)
      console.log(`     Status: ${q.status}`)
      console.log(`     Franchise: ${q.franchise_id}`)
      console.log(`     Items: ${q.product_order_items?.length || 0}`)
      if (q.product_order_items && q.product_order_items.length > 0) {
        q.product_order_items.forEach((item, idx) => {
          console.log(`       ${idx + 1}. ${item.product?.name || 'No name'} (Qty: ${item.quantity})`)
        })
      }
    })
  }

  // Test package bookings query
  console.log('\n\n📋 Testing Package Bookings Query:')
  const { data: packageQuotes, error: pkgError } = await supabase
    .from('package_bookings')
    .select(`
      *,
      customer:customers!left(name, phone, email),
      package_booking_items(
        *,
        package:package_sets!left(name)
      )
    `)
    .eq('is_quote', true)
    .order('created_at', { ascending: false })

  if (pkgError) {
    console.error('❌ Query Error:', pkgError)
  } else {
    console.log(`✅ Query Success! Returned ${packageQuotes.length} quotes`)
    packageQuotes.forEach((q, i) => {
      console.log(`\n  ${i + 1}. ${q.package_number}`)
      console.log(`     Customer: ${q.customer?.name || 'NULL'}`)
      console.log(`     Status: ${q.status}`)
      console.log(`     Franchise: ${q.franchise_id}`)
      console.log(`     Items: ${q.package_booking_items?.length || 0}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✅ TOTAL QUOTES: ${(productQuotes?.length || 0) + (packageQuotes?.length || 0)}`)
  console.log('\n')
}

testFixedQuery().catch(console.error)
