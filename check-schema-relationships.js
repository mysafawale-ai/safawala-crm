/**
 * Check table relationships
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkSchema() {
  console.log('\n🔍 CHECKING TABLE SCHEMA\n')

  // Check product_order_items structure
  console.log('📋 Checking product_order_items:')
  const { data: items, error } = await supabase
    .from('product_order_items')
    .select('*')
    .limit(1)

  if (error) {
    console.error('❌ Error:', error)
  } else if (items && items[0]) {
    console.log('✅ Columns:', Object.keys(items[0]))
  }

  // Try different relationship names
  console.log('\n🔬 Testing different relationship patterns:\n')

  // Test 1: products table
  console.log('1. Testing: product:products!left(name)')
  const test1 = await supabase
    .from('product_order_items')
    .select('*, product:products!left(name)')
    .limit(1)
  console.log(test1.error ? `❌ ${test1.error.message}` : '✅ Success')

  // Test 2: inventory table
  console.log('\n2. Testing: product:inventory!left(name)')
  const test2 = await supabase
    .from('product_order_items')
    .select('*, product:inventory!left(name)')
    .limit(1)
  console.log(test2.error ? `❌ ${test2.error.message}` : '✅ Success')

  // Test 3: Direct product_id reference
  console.log('\n3. Testing: just product_id column')
  const test3 = await supabase
    .from('product_order_items')
    .select('product_id')
    .limit(1)
  console.log(test3.error ? `❌ ${test3.error.message}` : `✅ Success: ${JSON.stringify(test3.data)}`)

  console.log('\n')
}

checkSchema().catch(console.error)
