/**
 * Run Database Migration for Quote Support
 * Executes ADD_QUOTE_SUPPORT.sql commands via Supabase client
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

async function checkMigration() {
  console.log('\n🔍 Checking if migration is needed...\n')
  
  try {
    // Try to select is_quote column
    const { data, error } = await supabase
      .from('product_orders')
      .select('is_quote')
      .limit(1)
    
    if (error) {
      if (error.message.includes('column "is_quote" does not exist')) {
        console.log('❌ Migration NOT applied')
        console.log('\n📋 To apply migration:')
        console.log('1. Open Supabase Dashboard → SQL Editor')
        console.log('2. Copy contents of ADD_QUOTE_SUPPORT.sql')
        console.log('3. Run the SQL script')
        console.log('\nOr you can run it via psql/database client\n')
        return false
      }
      throw error
    }
    
    console.log('✅ Migration already applied')
    console.log('✅ Column is_quote exists in product_orders')
    
    // Check package_bookings too
    const { error: pkgError } = await supabase
      .from('package_bookings')
      .select('is_quote')
      .limit(1)
    
    if (pkgError) {
      console.log('⚠️  Column is_quote missing in package_bookings')
      return false
    }
    
    console.log('✅ Column is_quote exists in package_bookings')
    console.log('\n✅ Migration is complete!\n')
    return true
    
  } catch (err) {
    console.error('❌ Error checking migration:', err.message)
    return false
  }
}

checkMigration()
