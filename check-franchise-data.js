#!/usr/bin/env node
/**
 * Check current logged-in user and their franchise data
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUserFranchiseData() {
  console.log('🔍 Checking user and franchise data...\n')

  try {
    // Check the Ronak Dave user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, franchise_id, role')
      .eq('email', 'vadodara@safawala.com')
      .single()

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('👤 User Found:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Franchise ID: ${user.franchise_id}\n`)

    // Get franchise details
    const { data: franchise } = await supabase
      .from('franchises')
      .select('id, name')
      .eq('id', user.franchise_id)
      .single()

    if (franchise) {
      console.log('🏢 Franchise:')
      console.log(`   Name: ${franchise.name}`)
      console.log(`   ID: ${franchise.id}\n`)
    }

    // Check bookings for this franchise
    const { data: bookings, count } = await supabase
      .from('bookings')
      .select('id, booking_number, status, total_amount', { count: 'exact' })
      .eq('franchise_id', user.franchise_id)

    console.log(`📊 Bookings for ${franchise?.name}:`)
    console.log(`   Total Count: ${count}\n`)

    if (bookings && bookings.length > 0) {
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`)
      console.log(`   📋 Sample bookings:`)
      
      bookings.slice(0, 5).forEach((b, i) => {
        console.log(`      ${i + 1}. ${b.booking_number}: ${b.status} - ₹${b.total_amount}`)
      })
    } else {
      console.log('   ❌ No bookings found for this franchise!')
    }

    // Also check default franchise for comparison
    console.log('\n---\n')
    const { data: defaultBookings, count: defaultCount } = await supabase
      .from('bookings')
      .select('id, booking_number, status, total_amount', { count: 'exact' })
      .eq('franchise_id', '00000000-0000-0000-0000-000000000001')

    console.log(`📊 Bookings in Default Franchise:`)
    console.log(`   Total Count: ${defaultCount}\n`)

    if (defaultBookings && defaultBookings.length > 0) {
      const totalRevenue = defaultBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`)
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkUserFranchiseData()
