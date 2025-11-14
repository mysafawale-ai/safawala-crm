#!/usr/bin/env node
/**
 * Check current user and franchise
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
  console.log('🔍 Checking user: vadodara@safawala.com\n')

  try {
    // Find the user
    const { data: user } = await supabase
      .from('users')
      .select('id, email, franchise_id, role')
      .eq('email', 'vadodara@safawala.com')
      .single()

    if (!user) {
      console.log('❌ User not found!')
      return
    }

    console.log('👤 User found:')
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Franchise ID: ${user.franchise_id}\n`)

    // Get franchise name
    const { data: franchise } = await supabase
      .from('franchises')
      .select('id, name')
      .eq('id', user.franchise_id)
      .single()

    if (franchise) {
      console.log(`🏢 Franchise: ${franchise.name} (${franchise.id})\n`)
    }

    // Count bookings for this franchise
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('franchise_id', user.franchise_id)

    console.log(`📊 Bookings count for this franchise: ${bookingCount}`)

    // Get booking details
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status, total_amount')
      .eq('franchise_id', user.franchise_id)

    if (bookings && bookings.length > 0) {
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`💰 Total revenue: ₹${totalRevenue.toLocaleString()}`)
      console.log(`📈 Avg booking value: ₹${Math.round(totalRevenue / bookings.length).toLocaleString()}\n`)

      // Show status breakdown
      const statuses = {}
      bookings.forEach(b => {
        statuses[b.status] = (statuses[b.status] || 0) + 1
      })
      console.log('📋 Bookings by status:')
      Object.entries(statuses).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkUser()
