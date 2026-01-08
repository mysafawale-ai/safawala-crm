const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkTables() {
  try {
    // Get all tables
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .in('table_schema', ['public', 'laundry'])
      .order('table_name')

    if (error) {
      console.error('Error fetching tables:', error)
    } else {
      console.log('=== ALL TABLES ===')
      console.log(JSON.stringify(data, null, 2))
    }

  } catch (err) {
    console.error('Error:', err)
    
    // Fallback: use RPC or direct query
    console.log('\nTrying alternative method...')
    const { data: tables } = await supabase.rpc('get_tables')
    console.log(tables)
  }
}

checkTables()
