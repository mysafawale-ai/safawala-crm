const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBasicVariant() {
  console.log('🔍 Checking "Basic" variant specifically...\n')
  
  // Get Basic variant
  const { data: variant } = await supabase
    .from('package_variants')
    .select('*')
    .eq('name', 'Basic')
    .limit(1)
    .single()
  
  console.log('📋 Basic Variant Data:')
  console.log(JSON.stringify(variant, null, 2))
  
  console.log('\n🎯 Inclusions Analysis:')
  console.log('- Has inclusions field:', variant?.inclusions !== undefined ? '✅' : '❌')
  console.log('- Inclusions value:', variant?.inclusions)
  console.log('- Is null:', variant?.inclusions === null ? '⚠️ YES' : '❌ NO')
  console.log('- Is array:', Array.isArray(variant?.inclusions) ? '✅' : '❌')
  console.log('- Array length:', Array.isArray(variant?.inclusions) ? variant.inclusions.length : 'N/A')
}

checkBasicVariant()
