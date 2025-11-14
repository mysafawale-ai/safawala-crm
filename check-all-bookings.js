#!/usr/bin/env node
/**
 * Check all bookings in database - what bookings page is seeing
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllBookings() {
  console.log('🔍 Checking ALL bookings in database...\n')

  try {
    // Get ALL bookings (no filter)
    const { data: allBookings, count: allCount } = await supabase
      .from('bookings')
      .select('id, booking_number, franchise_id, status, total_amount', { count: 'exact' })

    console.log(`📊 TOTAL Bookings in Database: ${allCount}`)
    
    if (allBookings && allBookings.length > 0) {
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
      console.log(`   💰 Total Revenue (ALL): ₹${totalRevenue.toLocaleString()}\n`)

      // Group by franchise
      const byFranchise = {}
      allBookings.forEach(b => {
        if (!byFranchise[b.franchise_id]) {
          byFranchise[b.franchise_id] = { count: 0, revenue: 0, bookings: [] }
        }
        byFranchise[b.franchise_id].count++
        byFranchise[b.franchise_id].revenue += b.total_amount || 0
        byFranchise[b.franchise_id].bookings.push(b)
      })

      console.log('📋 Bookings by Franchise:\n')
      Object.entries(byFranchise).forEach(([franchiseId, data]) => {
        console.log(`   Franchise: ${franchiseId}`)
        console.log(`   Count: ${data.count}`)
        console.log(`   Revenue: ₹${data.revenue.toLocaleString()}`)
        console.log('')
      })

      // Check if ₹112,140 appears
      const targetRevenue = 112140
      Object.entries(byFranchise).forEach(([franchiseId, data]) => {
        if (data.revenue === targetRevenue) {
          console.log(`⚠️  FOUND ₹112,140 in franchise: ${franchiseId}`)
          console.log(`   Bookings: ${data.count}`)
        }
      })

      // Check if it's from multiple franchises
      if (totalRevenue === targetRevenue) {
        console.log(`✅ Database total revenue is ₹${targetRevenue} - bookings page is showing ALL bookings`)
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAllBookings()
