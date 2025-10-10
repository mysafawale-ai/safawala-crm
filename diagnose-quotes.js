#!/usr/bin/env node

/**
 * Diagnose product_orders vs package_bookings schema differences
 * to identify why product quotes fail to load
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read environment variables
const envPath = path.join(__dirname, '.env.local')
let supabaseUrl, supabaseKey

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim()
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim()
    }
  })
}

supabaseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL
supabaseKey = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseQuoteIssue() {
  console.log('🔍 Diagnosing quote loading issue...\n')

  // Test 1: Simple select with is_quote filter
  console.log('Test 1: Basic product_orders query with is_quote=true')
  const test1 = await supabase
    .from('product_orders')
    .select('id, order_number, is_quote, status')
    .eq('is_quote', true)
    .limit(5)

  console.log('  Result:', test1.error ? `❌ ${test1.error.message}` : `✅ ${test1.data.length} rows`)
  if (test1.error) {
    console.log('  Error details:', {
      code: test1.error.code,
      details: test1.error.details,
      hint: test1.error.hint,
    })
  }

  // Test 2: Query with customer join
  console.log('\nTest 2: Product orders with customer join')
  const test2 = await supabase
    .from('product_orders')
    .select('id, order_number, customer:customers(name, phone, email)')
    .eq('is_quote', true)
    .limit(5)

  console.log('  Result:', test2.error ? `❌ ${test2.error.message}` : `✅ ${test2.data.length} rows`)
  if (test2.error) {
    console.log('  Error details:', {
      code: test2.error.code,
      details: test2.error.details,
      hint: test2.error.hint,
    })
  }

  // Test 3: Query with items join
  console.log('\nTest 3: Product orders with items join')
  const test3 = await supabase
    .from('product_orders')
    .select('id, order_number, product_order_items(*)')
    .eq('is_quote', true)
    .limit(5)

  console.log('  Result:', test3.error ? `❌ ${test3.error.message}` : `✅ ${test3.data.length} rows`)
  if (test3.error) {
    console.log('  Error details:', {
      code: test3.error.code,
      details: test3.error.details,
      hint: test3.error.hint,
    })
  }

  // Test 4: Full query with nested product join
  console.log('\nTest 4: Product orders with nested product join (full query)')
  const test4 = await supabase
    .from('product_orders')
    .select(`
      *,
      customer:customers(name, phone, email),
      product_order_items(
        *,
        product:products(name)
      )
    `)
    .eq('is_quote', true)
    .limit(5)

  console.log('  Result:', test4.error ? `❌ ${test4.error.message}` : `✅ ${test4.data.length} rows`)
  if (test4.error) {
    console.log('  Error details:', {
      code: test4.error.code,
      details: test4.error.details,
      hint: test4.error.hint,
      message: test4.error.message,
    })
  }

  // Test 5: Package bookings for comparison
  console.log('\nTest 5: Package bookings (for comparison)')
  const test5 = await supabase
    .from('package_bookings')
    .select(`
      *,
      customer:customers(name, phone, email),
      package_booking_items(
        *,
        package:package_sets(name)
      )
    `)
    .eq('is_quote', true)
    .limit(5)

  console.log('  Result:', test5.error ? `❌ ${test5.error.message}` : `✅ ${test5.data.length} rows`)
  if (test5.data) {
    console.log('  Sample package quote:', test5.data[0]?.package_number || 'N/A')
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 Summary:')
  console.log('='.repeat(60))
  
  if (test1.error) {
    console.log('❌ Basic product_orders query fails')
    console.log('   Issue: Table or column missing')
  } else if (test2.error) {
    console.log('❌ Customer join fails')
    console.log('   Issue: Foreign key or customers table issue')
  } else if (test3.error) {
    console.log('❌ Items join fails')
    console.log('   Issue: product_order_items table or relationship issue')
  } else if (test4.error) {
    console.log('❌ Nested product join fails')
    console.log('   Issue: products table or nested relationship issue')
    console.log('   Most likely: RLS policy on products table blocking reads')
  } else {
    console.log('✅ All tests passed - issue may be intermittent or client-side')
  }

  console.log('')
}

diagnoseQuoteIssue().catch(e => {
  console.error('Fatal error:', e)
  process.exit(1)
})
