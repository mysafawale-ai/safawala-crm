/**
 * Test Quotes Page - Verify quotes are fetched from product_orders and package_bookings
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

async function testQuotesPage() {
  console.log('🧪 Testing Quotes Page Functionality\n')

  try {
    // Test 1: Fetch product order quotes
    console.log('📦 Test 1: Fetching Product Order Quotes')
    const { data: productQuotes, error: productError } = await supabase
      .from('product_orders')
      .select(`
        *,
        customer:customers(name, phone, email),
        product_order_items(*)
      `)
      .eq('is_quote', true)
      .order('created_at', { ascending: false })

    if (productError) {
      console.error('❌ Error fetching product quotes:', productError.message)
    } else {
      console.log(`✅ Found ${productQuotes.length} product quotes`)
      if (productQuotes.length > 0) {
        console.log(`   Sample: ${productQuotes[0].order_number} - ${productQuotes[0].customer?.name || 'Unknown'}`)
      }
    }

    // Test 2: Fetch package booking quotes
    console.log('\n📦 Test 2: Fetching Package Booking Quotes')
    const { data: packageQuotes, error: packageError } = await supabase
      .from('package_bookings')
      .select(`
        *,
        customer:customers(name, phone, email),
        package_booking_items(*)
      `)
      .eq('is_quote', true)
      .order('created_at', { ascending: false })

    if (packageError) {
      console.error('❌ Error fetching package quotes:', packageError.message)
    } else {
      console.log(`✅ Found ${packageQuotes.length} package quotes`)
      if (packageQuotes.length > 0) {
        console.log(`   Sample: ${packageQuotes[0].package_number} - ${packageQuotes[0].customer?.name || 'Unknown'}`)
      }
    }

    // Test 3: Verify status values
    console.log('\n📊 Test 3: Checking Quote Statuses')
    const allQuotes = [...(productQuotes || []), ...(packageQuotes || [])]
    const statusCounts = allQuotes.reduce((acc, q) => {
      acc[q.status] = (acc[q.status] || 0) + 1
      return acc
    }, {})
    
    console.log('Status distribution:')
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })

    // Test 4: Summary
    console.log('\n📈 Summary:')
    console.log(`   Total quotes: ${allQuotes.length}`)
    console.log(`   Product quotes: ${productQuotes?.length || 0}`)
    console.log(`   Package quotes: ${packageQuotes?.length || 0}`)
    
    if (allQuotes.length > 0) {
      console.log('\n✅ Quotes page should display data correctly!')
    } else {
      console.log('\n⚠️  No quotes found. Create a quote to test the quotes page.')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  }
}

testQuotesPage()
