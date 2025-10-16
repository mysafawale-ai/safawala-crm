const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkVariantStructure() {
  // Get a sample package variant to see its structure
  const { data: variants, error } = await supabase
    .from('package_variants')
    .select('*')
    .limit(3)
  
  console.log('Package Variants Sample:')
  console.log(JSON.stringify(variants, null, 2))
  console.log('\nError:', error)
  
  // Check package_sets structure
  const { data: sets, error: setError } = await supabase
    .from('package_sets')
    .select('*')
    .limit(1)
  
  console.log('\n\nPackage Sets Sample:')
  console.log(JSON.stringify(sets, null, 2))
}

checkVariantStructure()
