const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://qpinyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaW55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc5NTU2NjEsImV4cCI6MjA0MzUzMTY2MX0.TsptFJJV6l--uXHBONgRZKd4rwkNDhj9AwUPe5rw-wI'
)

async function checkDistancePricing() {
  console.log('\n=== Checking Distance Pricing in Database ===\n')
  
  // 1. Check distance_pricing table (per-variant pricing)
  console.log('1. Distance Pricing Table (Per-Variant):')
  const { data: dpData, error: dpError } = await supabase
    .from('distance_pricing')
    .select('*')
    .order('min_km', { ascending: true })
  
  if (dpError) {
    console.log('   ❌ Error:', dpError.message)
  } else if (dpData.length === 0) {
    console.log('   ⚠️  Table is EMPTY - No per-variant pricing rules')
  } else {
    console.log('   ✅ Found', dpData.length, 'pricing rules\n')
    dpData.forEach((rule, idx) => {
      console.log(`   Rule ${idx + 1}:`)
      console.log('      Distance:', rule.min_km, 'to', rule.max_km || '∞', 'km')
      console.log('      Variant ID:', rule.variant_id)
      if (rule.base_price_addition) {
        console.log('      Type: Flat Addition → +₹' + rule.base_price_addition)
      } else if (rule.extra_price) {
        console.log('      Type: Extra Price → +₹' + rule.extra_price)
      } else if (rule.price_multiplier) {
        console.log('      Type: Multiplier → ×' + rule.price_multiplier)
      }
      console.log('')
    })
  }
  
  // 2. Check distance_pricing_tiers (global pricing)
  console.log('2. Distance Pricing Tiers (Global):')
  const { data: tierData, error: tierError } = await supabase
    .from('distance_pricing_tiers')
    .select('*')
    .eq('is_active', true)
    .order('min_distance', { ascending: true })
  
  if (tierError) {
    console.log('   ❌ Error:', tierError.message)
  } else if (tierData.length === 0) {
    console.log('   ⚠️  No active global pricing tiers')
  } else {
    console.log('   ✅ Found', tierData.length, 'global tiers\n')
    tierData.forEach((tier, idx) => {
      console.log(`   Tier ${idx + 1}:`)
      console.log('      Distance:', tier.min_distance, 'to', tier.max_distance || '∞', 'km')
      if (tier.price_multiplier) {
        console.log('      Type: Multiplier → ×' + tier.price_multiplier)
        console.log('      Extra: ' + ((tier.price_multiplier - 1) * 100).toFixed(0) + '%')
      } else if (tier.extra_price) {
        console.log('      Type: Flat → +₹' + tier.extra_price)
      }
      console.log('      Active:', tier.is_active)
      console.log('')
    })
  }
  
  // 3. Test calculation for 597 km
  console.log('3. Test Calculation for 597 km distance:')
  console.log('   Base price: ₹1,307.00\n')
  
  if (dpData && dpData.length > 0) {
    const match = dpData.find(r => 597 >= r.min_km && 597 <= (r.max_km || 999999))
    if (match) {
      console.log('   ✅ Matched per-variant rule!')
      console.log('      Distance range:', match.min_km, '-', match.max_km || '∞', 'km')
      
      if (match.base_price_addition) {
        console.log('      Distance charge: +₹' + match.base_price_addition)
        console.log('      Final price: ₹' + (1307 + match.base_price_addition))
      } else if (match.extra_price) {
        console.log('      Distance charge: +₹' + match.extra_price)
        console.log('      Final price: ₹' + (1307 + match.extra_price))
      } else if (match.price_multiplier) {
        const addon = 1307 * (match.price_multiplier - 1)
        console.log('      Multiplier:', match.price_multiplier + 'x')
        console.log('      Distance charge: +₹' + addon.toFixed(2))
        console.log('      Final price: ₹' + (1307 * match.price_multiplier).toFixed(2))
      }
    } else {
      console.log('   ⚠️  No per-variant rule matches 597 km')
    }
  }
  
  if (tierData && tierData.length > 0) {
    const match = tierData.find(t => 597 >= t.min_distance && 597 <= (t.max_distance || 999999))
    if (match) {
      console.log('\n   ✅ Matched global tier!')
      console.log('      Distance range:', match.min_distance, '-', match.max_distance || '∞', 'km')
      
      if (match.price_multiplier) {
        const addon = 1307 * (match.price_multiplier - 1)
        console.log('      Multiplier:', match.price_multiplier + 'x')
        console.log('      Distance charge: +₹' + addon.toFixed(2))
        console.log('      Final price: ₹' + (1307 * match.price_multiplier).toFixed(2))
      } else if (match.extra_price) {
        console.log('      Distance charge: +₹' + match.extra_price)
        console.log('      Final price: ₹' + (1307 + match.extra_price))
      }
    } else {
      console.log('\n   ⚠️  No global tier matches 597 km')
    }
  }
  
  console.log('\n=== Summary ===')
  if ((dpData && dpData.length > 0) || (tierData && tierData.length > 0)) {
    console.log('✅ Distance pricing is configured!')
    console.log('✅ System will apply charges based on distance')
  } else {
    console.log('❌ No distance pricing configured')
    console.log('→ Need to add pricing rules to database')
  }
  console.log('')
}

checkDistancePricing().catch(console.error)
