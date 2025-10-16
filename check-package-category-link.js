const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkPackageStructure() {
  console.log('🔍 Checking package structure...\n')
  
  // 1. Check package_sets structure
  const { data: packages, error: pkgError } = await supabase
    .from('package_sets')
    .select('id, name, category_id')
    .limit(3)
  
  console.log('📦 Package Sets Sample:')
  console.log(JSON.stringify(packages, null, 2))
  console.log('Error:', pkgError)
  
  // 2. Check if packages_categories table exists
  const { data: categories, error: catError } = await supabase
    .from('packages_categories')
    .select('*')
    .limit(5)
  
  console.log('\n📁 Categories Table:')
  console.log(JSON.stringify(categories, null, 2))
  console.log('Error:', catError)
  
  // 3. Check the specific package from screenshot
  const { data: specificPkg, error: specError } = await supabase
    .from('package_sets')
    .select('id, name, category_id')
    .eq('name', 'Basic Packagefgg')
    .single()
  
  console.log('\n🎯 Specific Package (Basic Packagefgg):')
  console.log(JSON.stringify(specificPkg, null, 2))
  
  if (specificPkg?.category_id) {
    const { data: cat } = await supabase
      .from('packages_categories')
      .select('*')
      .eq('id', specificPkg.category_id)
      .single()
    
    console.log('\n✅ Its Category:')
    console.log(JSON.stringify(cat, null, 2))
  }
}

checkPackageStructure()
