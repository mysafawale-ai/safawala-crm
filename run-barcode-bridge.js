const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runScript() {
  console.log('🚀 Running Booking Barcode Bridge SQL Script...\n')
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('./scripts/CREATE_BOOKING_BARCODE_BRIDGE.sql', 'utf8')
    
    console.log('📋 Executing SQL commands directly via Supabase...\n')
    
    // Since we can't execute complex SQL via Supabase JS client,
    // we'll print instructions for manual execution
    console.log('⚠️  Complex SQL with triggers and functions detected.')
    console.log('📝 Please run this script manually in Supabase SQL Editor:\n')
    console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new')
    console.log('2. Copy the contents of: scripts/CREATE_BOOKING_BARCODE_BRIDGE.sql')
    console.log('3. Paste and click "Run"\n')
    console.log('Or use psql command line:')
    console.log('  psql $DATABASE_URL -f scripts/CREATE_BOOKING_BARCODE_BRIDGE.sql\n')
    
    // Try to at least verify the table doesn't exist yet
    const { data, error } = await supabase
      .from('booking_barcode_assignments')
      .select('id')
      .limit(1)
    
    if (!error) {
      console.log('✅ Table already exists! Script was likely run successfully before.')
    } else if (error.message.includes('does not exist')) {
      console.log('⚠️  Table does not exist yet. Please run the SQL script manually.')
    } else {
      console.log('ℹ️  Status unknown. Please verify in Supabase dashboard.')
    }
    
    console.log('\n📊 What will be created:')
    console.log('  ✓ booking_barcode_assignments table')
    console.log('  ✓ 8 indexes for fast lookups')
    console.log('  ✓ RLS policies configured')
    console.log('  ✓ 3 automatic triggers')
    console.log('  ✓ 3 helper functions')
    console.log('\n🎯 Next: Build API endpoints for barcode assignment')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    process.exit(1)
  }
}

runScript()
