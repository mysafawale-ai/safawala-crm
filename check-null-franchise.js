#!/usr/bin/env node
/**
 * Check bookings with NULL franchise_id
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNullFranchise() {
  console.log('🔍 Checking bookings with NULL franchise_id...\n')

  try {
    // Check product_orders with NULL franchise_id
    const { data: productNull, count: productNullCount } = await supabase
      .from('product_orders')
      .select('id, order_number, total_amount, is_archived, is_quote', { count: 'exact' })
      .is('franchise_id', null)
      .eq('is_archived', false)
      .or('is_quote.is.null,is_quote.eq.false')

    console.log(`📊 Product Orders with NULL franchise_id: ${productNullCount}`)
    if (productNull && productNull.length > 0) {
      const total = productNull.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   Revenue: ₹${total.toLocaleString()}\n`)
      productNull.slice(0, 5).forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.order_number}: ₹${b.total_amount}`)
      })
    }

    // Check package_bookings with NULL franchise_id
    const { data: packageNull, count: packageNullCount } = await supabase
      .from('package_bookings')
      .select('id, package_number, total_amount, is_archived, is_quote', { count: 'exact' })
      .is('franchise_id', null)
      .eq('is_archived', false)
      .eq('is_quote', false)

    console.log(`\n📊 Package Bookings with NULL franchise_id: ${packageNullCount}`)
    if (packageNull && packageNull.length > 0) {
      const total = packageNull.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   Revenue: ₹${total.toLocaleString()}\n`)
      packageNull.slice(0, 5).forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.package_number}: ₹${b.total_amount}`)
      })
    }

    const totalNullRevenue = (productNull?.reduce((s, b) => s + (b.total_amount || 0), 0) || 0) +
                             (packageNull?.reduce((s, b) => s + (b.total_amount || 0), 0) || 0)
    console.log(`\n💰 TOTAL Revenue from NULL franchise: ₹${totalNullRevenue.toLocaleString()}`)

    // Check if this + Vadodara = 112,140
    const vadodaraRevenue = 5178
    const combined = vadodaraRevenue + totalNullRevenue
    console.log(`\n✅ Vadodara (₹${vadodaraRevenue}) + NULL (₹${totalNullRevenue}) = ₹${combined}`)
    if (combined === 112140) {
      console.log(`⚠️  This equals ₹112,140! The bookings page is showing ALL these bookings.`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkNullFranchise()
