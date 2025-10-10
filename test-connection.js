import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔗 Testing Supabase connection...')
  console.log('URL:', supabaseUrl)
  console.log('Key preview:', supabaseKey.substring(0, 20) + '...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1)
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
    } else {
      console.log('✅ Connection successful!')
      console.log('📊 Database accessible')
    }
    
    // Test if our tables exist
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tableError) {
      console.log('⚠️  Cannot check tables:', tableError.message)
    } else {
      console.log('📋 Available tables:', tables?.map(t => t.table_name) || 'None')
    }
    
  } catch (err) {
    console.error('💥 Connection test failed:', err)
  }
}

testConnection()