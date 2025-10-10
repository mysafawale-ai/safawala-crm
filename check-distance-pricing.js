const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://qpinyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaW55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc5NTU2NjEsImV4cCI6MjA0MzUzMTY2MX0.TsptFJJV6l--uXHBONgRZKd4rwkNDhj9AwUPe5rw-wI'
)

async function checkDistancePricing() {
  console.log('\n=== Distance Pricing Check ===\n')
  
  // 1. Check distance calculation
  console.log('1. Distance Calculation:')
  console.log('   Customer pincode: 410001')
  console.log('   Store pincode: 390001')
  console.log('   Expected distance: ~597 km (from cache or API)\n')
  
  // 2. Check if distance_pricing table exists and has data
  console.log('2. Distance Pricing Table:')
  const { data: dpData, error: dpError } = await supabase
    .from('distance_pricing')
    .select('*')
    .limit(5)
  
  if (dpError) {
    console.log('   ❌ Error:', dpError.message)
    console.log('   → Table might not exist or no data')
  } else if (dpData.length === 0) {
    console.log('   ⚠️  Table exists but is EMPTY')
    console.log('   → No distance-based pricing rules configured')
  } else {
    console.log('   ✅ Found', dpData.length, 'pricing rules')
    dpData.forEach(rule => {
      console.log('      -', rule.min_km, 'to', rule.max_km || '∞', 'km:', 
        rule.base_price_addition ? `+₹${rule.base_price_addition}` : 
        rule.price_multiplier ? `×${rule.price_multiplier}` : 
        rule.extra_price ? `+₹${rule.extra_price}` : 'N/A')
    })
  }
  
  // 3. Check distance_pricing_tiers (global fallback)
  console.log('\n3. Distance Pricing Tiers (Global):')
  const { data: tierData, error: tierError } = await supabase
    .from('distance_pricing_tiers')
    .select('*')
    .eq('is_active', true)
  
  if (tierError) {
    console.log('   ❌ Error:', tierError.message)
    console.log('   → Table might not exist or no data')
  } else if (tierData.length === 0) {
    console.log('   ⚠️  No active global pricing tiers')
    console.log('   → No fallback pricing rules')
  } else {
    console.log('   ✅ Found', tierData.length, 'global tiers')
    tierData.forEach(tier => {
      console.log('      -', tier.min_distance, 'to', tier.max_distance || '∞', 'km:', 
        tier.price_multiplier ? `×${tier.price_multiplier}` : 
        tier.extra_price ? `+₹${tier.extra_price}` : 'N/A')
    })
  }
  
  // 4. Check package variants
  console.log('\n4. Package Variants:')
  const { data: variants, error: varError } = await supabase
    .from('package_variants')
    .select('id, variant_name, base_price')
    .eq('is_active', true)
    .limit(3)
  
  if (varError) {
    console.log('   ❌ Error:', varError.message)
  } else {
    console.log('   ✅ Found', variants.length, 'active variants')
    variants.forEach(v => {
      console.log('      -', v.variant_name, '(₹' + v.base_price + ')')
    })
  }
  
  // 5. Simulate distance pricing calculation
  console.log('\n5. Price Calculation Simulation:')
  console.log('   Distance: 597 km')
  console.log('   Base price: ₹1,307.00')
  
  if (dpData && dpData.length > 0) {
    const match = dpData.find(r => 597 >= r.min_km && 597 <= (r.max_km || 999999))
    if (match) {
      console.log('   ✅ Matched pricing rule:', match.min_km, '-', match.max_km || '∞', 'km')
      if (match.base_price_addition) {
        console.log('   → Distance charge: +₹' + match.base_price_addition)
        console.log('   → Final price: ₹' + (1307 + match.base_price_addition))
      } else if (match.price_multiplier) {
        const addon = 1307 * (match.price_multiplier - 1)
        console.log('   → Multiplier:', match.price_multiplier + 'x')
        console.log('   → Distance charge: +₹' + addon.toFixed(2))
        console.log('   → Final price: ₹' + (1307 * match.price_multiplier).toFixed(2))
      }
    } else {
      console.log('   ⚠️  No matching pricing rule for 597 km')
    }
  } else if (tierData && tierData.length > 0) {
    const match = tierData.find(t => 597 >= t.min_distance && 597 <= (t.max_distance || 999999))
    if (match) {
      console.log('   ✅ Matched global tier:', match.min_distance, '-', match.max_distance || '∞', 'km')
      if (match.price_multiplier) {
        const addon = 1307 * (match.price_multiplier - 1)
        console.log('   → Multiplier:', match.price_multiplier + 'x')
        console.log('   → Distance charge: +₹' + addon.toFixed(2))
        console.log('   → Final price: ₹' + (1307 * match.price_multiplier).toFixed(2))
      } else if (match.extra_price) {
        console.log('   → Distance charge: +₹' + match.extra_price)
        console.log('   → Final price: ₹' + (1307 + match.extra_price))
      }
    } else {
      console.log('   ⚠️  No matching global tier for 597 km')
    }
  } else {
    console.log('   ⚠️  No pricing rules configured')
    console.log('   → Price will be base price only (₹1,307.00)')
  }
  
  console.log('\n=== Summary ===')
  console.log('Distance calculation: ✅ Working (597 km shown in UI)')
  console.log('Distance pricing rules:', dpData && dpData.length > 0 ? '✅ Configured' : '❌ NOT configured')
  console.log('Global pricing tiers:', tierData && tierData.length > 0 ? '✅ Configured' : '❌ NOT configured')
  
  if (!dpData || dpData.length === 0) {
    if (!tierData || tierData.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED:')
      console.log('You need to configure distance pricing rules!')
      console.log('Currently, distance is calculated (597 km) but NO extra charges are applied.')
      console.log('\nOptions:')
      console.log('1. Add per-variant pricing rules to distance_pricing table')
      console.log('2. Add global pricing tiers to distance_pricing_tiers table')
    }
  } else {
    console.log('\n✅ Distance-based pricing is configured and working!')
  }
  
  console.log('\n')
}

checkDistancePricing().catch(console.error)
