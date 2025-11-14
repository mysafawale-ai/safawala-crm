#!/usr/bin/env node
/**
 * Check product_orders and package_bookings separately
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkByType() {
  console.log('🔍 Checking bookings by type...\n')

  try {
    // Product Orders for Vadodara
    const { data: productOrders, count: productCount } = await supabase
      .from('product_orders')
      .select('id, order_number, total_amount, is_archived', { count: 'exact' })
      .eq('franchise_id', '1a518dde-85b7-44ef-8bc4-092f53ddfd99')
      .eq('is_archived', false)

    console.log(`📊 Product Orders (Vadodara): ${productCount}`)
    if (productOrders) {
      const total = productOrders.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   Revenue: ₹${total.toLocaleString()}\n`)
    }

    // Package Bookings for Vadodara
    const { data: packageBookings, count: packageCount } = await supabase
      .from('package_bookings')
      .select('id, package_number, total_amount, is_archived', { count: 'exact' })
      .eq('franchise_id', '1a518dde-85b7-44ef-8bc4-092f53ddfd99')
      .eq('is_archived', false)

    console.log(`📊 Package Bookings (Vadodara): ${packageCount}`)
    if (packageBookings) {
      const total = packageBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   Revenue: ₹${total.toLocaleString()}\n`)
    }

    const totalProd = productOrders?.reduce((s, b) => s + (b.total_amount || 0), 0) || 0
    const totalPkg = packageBookings?.reduce((s, b) => s + (b.total_amount || 0), 0) || 0
    const grandTotal = totalProd + totalPkg

    console.log(`💰 Grand Total: ₹${grandTotal.toLocaleString()}`)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkByType()
