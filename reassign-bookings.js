#!/usr/bin/env node
/**
 * Reassign bookings to correct franchise
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

const VADODARA_FRANCHISE_ID = '1a518dde-85b7-44ef-8bc4-092f53ddfd99'

async function reassignBookings() {
  console.log(`🔄 Reassigning bookings to Vadodara franchise (${VADODARA_FRANCHISE_ID})...\n`)

  try {
    // Update all bookings from default franchise to Vadodara
    const { error, count } = await supabase
      .from('bookings')
      .update({ franchise_id: VADODARA_FRANCHISE_ID })
      .eq('franchise_id', '00000000-0000-0000-0000-000000000001')

    if (error) {
      console.error('❌ Error updating bookings:', error)
      return
    }

    console.log(`✅ Successfully reassigned ${count} bookings to Vadodara franchise`)

    // Verify
    const { count: newCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('franchise_id', VADODARA_FRANCHISE_ID)

    console.log(`📊 Now Vadodara has ${newCount} bookings`)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

reassignBookings()
