const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSchema() {
  // Check variant_inclusions table structure
  const { data: inclusions, error } = await supabase
    .from('variant_inclusions')
    .select('*')
    .limit(1)
  
  console.log('Variant Inclusions Schema:', inclusions?.[0] || {})
  console.log('Error:', error)
  
  // Test the correct query
  const { data: variants, error: variantError } = await supabase
    .from('package_variants')
    .select(`
      id,
      variant_name,
      variant_inclusions!variant_id(
        product_id,
        quantity,
        product:products(name, product_code)
      )
    `)
    .limit(1)
  
  console.log('\nTest Query Result:', JSON.stringify(variants, null, 2))
  console.log('Error:', variantError)
}

checkSchema()
