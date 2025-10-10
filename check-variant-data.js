const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://qpinyaxkusvuajtmorss.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaW55YXhrdXN2dWFqdG1vcnNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc5NTU2NjEsImV4cCI6MjA0MzUzMTY2MX0.TsptFJJV6l--uXHBONgRZKd4rwkNDhj9AwUPe5rw-wI'
)

async function checkVariantData() {
  console.log('\n=== Checking Variant Data ===\n')
  
  // Get the "Basic Packagefgg" package
  const { data: packages, error: pkgError } = await supabase
    .from('package_sets')
    .select('id, name')
    .ilike('name', '%basic%')
  
  if (pkgError) {
    console.log('Error:', pkgError.message)
    return
  }
  
  console.log('Found packages:', packages.map(p => p.name))
  
  if (packages.length === 0) {
    console.log('No "Basic" package found')
    return
  }
  
  const pkg = packages[0]
  console.log('\nPackage:', pkg.name, '(' + pkg.id + ')')
  
  // Get variants for this package
  const { data: variants, error: varError } = await supabase
    .from('package_variants')
    .select('*')
    .eq('package_id', pkg.id)
    .eq('is_active', true)
  
  if (varError) {
    console.log('Error:', varError.message)
    return
  }
  
  console.log('\nFound', variants.length, 'variants:\n')
  
  variants.forEach(v => {
    console.log('Variant:', v.variant_name)
    console.log('  ID:', v.id)
    console.log('  Base Price:', v.base_price)
    console.log('  Inclusions:', v.inclusions)
    console.log('  Type:', typeof v.inclusions)
    console.log('')
  })
}

checkVariantData().catch(console.error)
