/**
 * Check actual database schema
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '.env.local')
let supabaseUrl, supabaseKey

try {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim()
    }
  }
} catch (err) {
  console.error('❌ Error reading .env.local:', err.message)
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  console.log('🔍 Checking database schema...\n')
  
  // Check product_orders columns
  console.log('📋 product_orders table:')
  const { data: po1, error: poErr1 } = await supabase
    .from('product_orders')
    .select('*')
    .limit(1)
  
  if (poErr1) {
    console.error('❌ Error querying product_orders:', poErr1.message)
  } else if (po1 && po1.length > 0) {
    console.log('✅ Columns:', Object.keys(po1[0]).join(', '))
  } else {
    console.log('⚠️  No data in product_orders, trying empty insert to detect schema...')
    const { error: poErr2 } = await supabase
      .from('product_orders')
      .select()
      .limit(0)
    if (poErr2) console.error('Error:', poErr2.message)
  }
  
  // Check package_bookings columns
  console.log('\n📋 package_bookings table:')
  const { data: pb1, error: pbErr1 } = await supabase
    .from('package_bookings')
    .select('*')
    .limit(1)
  
  if (pbErr1) {
    console.error('❌ Error querying package_bookings:', pbErr1.message)
  } else if (pb1 && pb1.length > 0) {
    console.log('✅ Columns:', Object.keys(pb1[0]).join(', '))
  } else {
    console.log('⚠️  No data in package_bookings')
  }
  
  // Check product_order_items columns
  console.log('\n📋 product_order_items table:')
  const { data: poi1, error: poiErr1 } = await supabase
    .from('product_order_items')
    .select('*')
    .limit(1)
  
  if (poiErr1) {
    console.error('❌ Error querying product_order_items:', poiErr1.message)
  } else if (poi1 && poi1.length > 0) {
    console.log('✅ Columns:', Object.keys(poi1[0]).join(', '))
  } else {
    console.log('⚠️  No data in product_order_items')
  }
}

checkSchema().catch(console.error)
