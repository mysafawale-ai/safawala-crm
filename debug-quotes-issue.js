/**
 * Debug script to check quotes data and filtering
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function debugQuotes() {
  console.log('\n🔍 QUOTES DEBUG ANALYSIS\n')
  console.log('=' .repeat(80))

  // 1. Check product_orders quotes
  console.log('\n📦 Product Orders with is_quote=true:')
  const { data: productQuotes, error: prodError } = await supabase
    .from('product_orders')
    .select('id, order_number, status, is_quote, franchise_id, created_at, customer_id')
    .eq('is_quote', true)
    .order('created_at', { ascending: false })

  if (prodError) {
    console.error('❌ Error:', prodError)
  } else {
    console.log(`✅ Found ${productQuotes.length} product quotes`)
    productQuotes.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.order_number}`)
      console.log(`     Status: ${q.status}`)
      console.log(`     Franchise: ${q.franchise_id}`)
      console.log(`     Customer: ${q.customer_id}`)
      console.log(`     Created: ${new Date(q.created_at).toLocaleDateString()}`)
    })
  }

  // 2. Check package_bookings quotes
  console.log('\n📋 Package Bookings with is_quote=true:')
  const { data: packageQuotes, error: pkgError } = await supabase
    .from('package_bookings')
    .select('id, package_number, status, is_quote, franchise_id, created_at, customer_id')
    .eq('is_quote', true)
    .order('created_at', { ascending: false })

  if (pkgError) {
    console.error('❌ Error:', pkgError)
  } else {
    console.log(`✅ Found ${packageQuotes.length} package quotes`)
    packageQuotes.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.package_number}`)
      console.log(`     Status: ${q.status}`)
      console.log(`     Franchise: ${q.franchise_id}`)
      console.log(`     Customer: ${q.customer_id}`)
      console.log(`     Created: ${new Date(q.created_at).toLocaleDateString()}`)
    })
  }

  // 3. Check status distribution
  console.log('\n📊 Status Distribution:')
  const allStatuses = [
    ...productQuotes.map(q => q.status),
    ...packageQuotes.map(q => q.status)
  ]
  const statusCounts = allStatuses.reduce((acc, status) => {
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })

  // 4. Check franchise distribution
  console.log('\n🏢 Franchise Distribution:')
  const allFranchises = [
    ...productQuotes.map(q => q.franchise_id),
    ...packageQuotes.map(q => q.franchise_id)
  ]
  const franchiseCounts = allFranchises.reduce((acc, fId) => {
    acc[fId] = (acc[fId] || 0) + 1
    return acc
  }, {})
  
  Object.entries(franchiseCounts).forEach(([fId, count]) => {
    console.log(`  ${fId}: ${count} quotes`)
  })

  // 5. Test the actual query from quote-service with LEFT JOIN
  console.log('\n🔬 Testing Quote Service Query (with LEFT JOIN):')
  const { data: testProductQuery, error: testError } = await supabase
    .from('product_orders')
    .select(`
      *,
      customer:customers!left(name, phone, email),
      product_order_items(
        *,
        product:inventory!left(name)
      )
    `)
    .eq('is_quote', true)
    .order('created_at', { ascending: false })

  if (testError) {
    console.error('❌ Query Error:', testError)
  } else {
    console.log(`✅ Query returned ${testProductQuery.length} product quotes`)
    testProductQuery.forEach((q, i) => {
      console.log(`  ${i + 1}. ${q.order_number}`)
      console.log(`     Customer: ${q.customer?.name || 'NULL'}`)
      console.log(`     Items: ${q.product_order_items?.length || 0}`)
    })
  }

  // 6. Check for RLS issues
  console.log('\n🔐 RLS Check:')
  console.log('Note: This script uses anon key, so RLS policies apply')
  console.log('If you see fewer quotes here than in the database, RLS is filtering them')

  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Debug Complete\n')
}

debugQuotes().catch(console.error)
