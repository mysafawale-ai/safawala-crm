const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkVendors() {
  try {
    // Check all vendors
    console.log('=== ALL VENDORS ===')
    const { data: allVendors, error: allError } = await supabase
      .from('vendors')
      .select('*')

    if (allError) {
      console.error('Error fetching all vendors:', allError)
    } else {
      console.log(`Total vendors: ${allVendors?.length || 0}`)
      console.log(JSON.stringify(allVendors, null, 2))
    }

    // Check active vendors
    console.log('\n=== ACTIVE VENDORS ===')
    const { data: activeVendors, error: activeError } = await supabase
      .from('vendors')
      .select('*')
      .eq('is_active', true)

    if (activeError) {
      console.error('Error fetching active vendors:', activeError)
    } else {
      console.log(`Active vendors: ${activeVendors?.length || 0}`)
      console.log(JSON.stringify(activeVendors, null, 2))
    }

    // Check vendors with franchise_id
    console.log('\n=== VENDORS WITH FRANCHISE FILTERING ===')
    const { data: franchises, error: franchiseError } = await supabase
      .from('franchises')
      .select('id, name')
      .limit(1)

    if (!franchiseError && franchises?.length) {
      const franchiseId = franchises[0].id
      console.log(`Using franchise: ${franchises[0].name} (${franchiseId})`)

      const { data: franchiseVendors, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('franchise_id', franchiseId)
        .eq('is_active', true)

      if (vendorError) {
        console.error('Error fetching franchise vendors:', vendorError)
      } else {
        console.log(`Vendors for franchise: ${franchiseVendors?.length || 0}`)
        console.log(JSON.stringify(franchiseVendors, null, 2))
      }
    }

  } catch (err) {
    console.error('Fatal error:', err)
  }
}

checkVendors()
