const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function analyzeAllVariants() {
  console.log('🔍 Analyzing ALL variants with and without inclusions...\n')
  
  // Get all variants
  const { data: variants } = await supabase
    .from('package_variants')
    .select('id, name, package_id, inclusions')
    .order('name')
  
  console.log('📊 Variant Inclusions Summary:\n')
  
  const withInclusions = variants.filter(v => v.inclusions && Array.isArray(v.inclusions) && v.inclusions.length > 0)
  const withoutInclusions = variants.filter(v => !v.inclusions || (Array.isArray(v.inclusions) && v.inclusions.length === 0))
  
  console.log(`✅ Variants WITH inclusions: ${withInclusions.length}`)
  withInclusions.forEach(v => {
    console.log(`   - ${v.name}: ${JSON.stringify(v.inclusions)}`)
  })
  
  console.log(`\n❌ Variants WITHOUT inclusions: ${withoutInclusions.length}`)
  withoutInclusions.slice(0, 10).forEach(v => {
    console.log(`   - ${v.name}: null`)
  })
  
  console.log('\n💡 SOLUTION OPTIONS:')
  console.log('1. Add inclusions to existing variants via database')
  console.log('2. Show "No inclusions specified" message when null')
  console.log('3. Add default inclusions like ["Safa", "Accessories", "Delivery"]')
}

analyzeAllVariants()
