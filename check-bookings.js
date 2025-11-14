#!/usr/bin/env node
/**
 * Check if there are any bookings in the database
 * Run with: node check-bookings.js
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBookings() {
  console.log('🔍 Checking bookings in database...\n')

  try {
    // Check total count
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error fetching booking count:', countError)
      return
    }

    console.log(`📊 Total bookings in database: ${count}`)

    if (count === 0) {
      console.log('\n⚠️  No bookings found! The database appears to be empty.')
      console.log('You need to create test bookings first.')
      return
    }

    // Fetch sample bookings
    const { data: bookings, error: dataError } = await supabase
      .from('bookings')
      .select('id, booking_number, status, total_amount, created_at, type')
      .limit(5)

    if (dataError) {
      console.error('❌ Error fetching bookings:', dataError)
      return
    }

    console.log('\n📋 Sample bookings:\n')
    bookings?.forEach((b, i) => {
      console.log(`${i + 1}. Booking #${b.booking_number}`)
      console.log(`   Status: ${b.status}`)
      console.log(`   Amount: ₹${b.total_amount}`)
      console.log(`   Type: ${b.type}`)
      console.log(`   Created: ${new Date(b.created_at).toLocaleDateString()}\n`)
    })

    // Check revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('bookings')
      .select('total_amount')

    if (!revenueError && revenueData) {
      const totalRevenue = revenueData.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`)
    }

    // Check by status
    const { data: statusData, error: statusError } = await supabase
      .from('bookings')
      .select('status', { count: 'exact' })

    if (!statusError && statusData) {
      const statuses = {}
      statusData.forEach(b => {
        statuses[b.status] = (statuses[b.status] || 0) + 1
      })
      console.log('\n📊 Bookings by status:')
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkBookings()
