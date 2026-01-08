const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabaseService = createClient(supabaseUrl, serviceRoleKey)
const supabaseAnon = createClient(supabaseUrl, anonKey)

async function verifyVendors() {
  try {
    console.log('=== USING SERVICE ROLE (bypasses RLS) ===')
    const { data: serviceData, error: serviceError } = await supabaseService
      .from('vendors')
      .select('*')

    if (serviceError) {
      console.error('Service role error:', serviceError)
    } else {
      console.log(`Service role sees ${serviceData?.length || 0} vendors`)
      console.log(JSON.stringify(serviceData, null, 2))
    }

    console.log('\n=== USING ANON KEY (applies RLS) ===')
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('vendors')
      .select('*')
      .eq('is_active', true)

    if (anonError) {
      console.error('Anon error:', anonError)
    } else {
      console.log(`Anon key sees ${anonData?.length || 0} vendors`)
      console.log(JSON.stringify(anonData, null, 2))
    }

  } catch (err) {
    console.error('Fatal error:', err)
  }
}

verifyVendors()
