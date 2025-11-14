#!/usr/bin/env node
/**
 * Check franchise IDs in bookings
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkFranchiseData() {
  console.log('🔍 Checking franchise data...\n')

  try {
    // Check bookings franchise_id
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, booking_number, franchise_id')
      .limit(5)

    console.log('📋 Sample bookings with franchise_id:\n')
    bookings?.forEach((b, i) => {
      console.log(`${i + 1}. Booking #${b.booking_number}: franchise_id = ${b.franchise_id || 'NULL'}`)
    })

    // Check franchise table
    const { data: franchises } = await supabase
      .from('franchises')
      .select('id, name')

    console.log('\n🏢 Franchises in database:\n')
    franchises?.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name}: ID = ${f.id}`)
    })

    // Check users and their franchise
    const { data: users } = await supabase
      .from('users')
      .select('id, email, franchise_id, role')
      .limit(5)

    console.log('\n👥 Sample users with franchise_id:\n')
    users?.forEach((u, i) => {
      console.log(`${i + 1}. ${u.email}: franchise_id = ${u.franchise_id || 'NULL'}, role = ${u.role}`)
    })
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkFranchiseData()
