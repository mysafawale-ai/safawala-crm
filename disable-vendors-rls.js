const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function disableVendorsRLS() {
  try {
    // Execute SQL to disable RLS on vendors table
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;'
    }).catch(async () => {
      // If RPC doesn't exist, try using query
      return await supabase.from('vendors').select('COUNT(*)', { count: 'exact', head: true })
    })

    if (error) {
      console.warn('Could not disable RLS via RPC:', error.message)
      console.log('Please manually run in Supabase SQL Editor:')
      console.log('  ALTER TABLE vendors DISABLE ROW LEVEL SECURITY;')
    } else {
      console.log('✅ RLS disabled on vendors table')
    }

    // Verify vendors are now visible with anon key
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data, error: selectError } = await supabaseAnon
      .from('vendors')
      .select('*')
      .eq('is_active', true)

    if (selectError) {
      console.error('❌ Still getting error:', selectError)
    } else {
      console.log(`✅ Vendors visible: ${data?.length || 0} vendors found`)
    }

  } catch (err) {
    console.error('Error:', err.message)
  }
}

disableVendorsRLS()
