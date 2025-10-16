const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkVariantData() {
  console.log('🔍 Checking variant data for Basic Packagefgg...\n')
  
  // 1. Get the package
  const { data: pkg } = await supabase
    .from('package_sets')
    .select('id, name')
    .eq('name', 'Basic Packagefgg')
    .single()
  
  if (!pkg) {
    console.log('❌ Package not found')
    return
  }
  
  console.log('📦 Package:', pkg)
  
  // 2. Get variants for this package
  const { data: variants } = await supabase
    .from('package_variants')
    .select('*')
    .eq('package_id', pkg.id)
  
  console.log('\n📋 Variants:')
  console.log(JSON.stringify(variants, null, 2))
  
  // 3. Check variant structure
  if (variants && variants.length > 0) {
    console.log('\n✅ Variants found:', variants.length)
    console.log('\n📊 Variant fields available:')
    console.log('- id:', variants[0].id ? '✅' : '❌')
    console.log('- name:', variants[0].name ? '✅' : '❌')
    console.log('- variant_name:', variants[0].variant_name ? '✅' : '❌')
    console.log('- inclusions:', variants[0].inclusions ? '✅' : '❌')
    console.log('- inclusions type:', typeof variants[0].inclusions)
    
    if (variants[0].inclusions) {
      console.log('\n🎯 Inclusions content:')
      console.log(JSON.stringify(variants[0].inclusions, null, 2))
    }
  } else {
    console.log('❌ No variants found for this package')
  }
}

checkVariantData()
